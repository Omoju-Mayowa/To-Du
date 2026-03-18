import HttpError from "../models/errorModel.js";
import argon2 from "argon2";
import { readUsers, writeUsers } from "../utils/fileHelper.js";
import HttpMessage from "../models/sucessModel.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { ACCESS_TOKEN_MAX_AGE, environment, REFRESH_TOKEN_MAX_AGE } from "../environment.js";
import { v4 as uuid } from "uuid";

const accessSecret = environment.JWT_SECRET;
const refreshSecret = environment.JWT_REFRESH_SECRET;

const hashOptions = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  hashLength: 48,
  timeCost: 5,
  parallelism: 5,
};

// ----------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // always 4 digits
};

const safeUser = (user) => {
  const { password, otp, otpExpiresAt, refreshToken, ...rest } = user;
  return rest;
};

// ----------------------------------------------------------------
// AUTH
// ----------------------------------------------------------------

const refreshAccessToken = async (req, res, next) => {
  const token = req.cookies?.refreshToken;

  if (!token)
    return next(new HttpError("No refresh token, please log in.", 401));

  try {
    const decoded = jwt.verify(token, environment.JWT_REFRESH_SECRET);

    const users = await readUsers();
    const user = users.find((u) => u.id === decoded.id);

    if (!user || user.refreshToken !== token)
      return next(new HttpError("Invalid refresh token.", 403));

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: user.id, userName: user.userName, email: user.email },
      environment.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({ message: "Access token refreshed." });
  } catch {
    return next(new HttpError("Invalid or expired refresh token.", 403));
  }
};

const registerUser = async (req, res, next) => {
  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    return next(new HttpError("Fill in all fields.", 422));
  }

  const users = await readUsers();

  if (users.some((u) => u.email === email)) {
    return next(new HttpError("Email already in use.", 422));
  }

  try {
    const hashedPassword = await argon2.hash(password, hashOptions);

    const newUser = {
      id: `user-${uuid().replace(/-/g, "")}`,
      userName,
      email,
      password: hashedPassword,
      otp: null,
      otpExpiresAt: null,
      createdAt: new Date(),
    };

    users.push(newUser);
    await writeUsers(users);

    const response = new HttpMessage("User created successfully.", 201, safeUser(newUser));
    return res.status(response.statusCode).json(response.data);
  } catch (error) {
    return next(new HttpError(error.message, 500));
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new HttpError("Fill in all fields.", 422));

  try {
    const users = await readUsers();
    const user = users.find((u) => u.email === email);

    if (!user) return next(new HttpError("Invalid credentials.", 401));

    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) return next(new HttpError("Invalid credentials.", 401));

    const accessToken = jwt.sign(
      { id: user.id, userName: user.userName, email: user.email },
      accessSecret,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      refreshSecret,
      { expiresIn: "7d" }
    );

    // Save refresh token to user in JSON DB
    user.refreshToken = refreshToken;
    await writeUsers(users); // assumes you have a writeUsers function

    // Set both cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json(safeUser(user));
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const users = await readUsers();
    const user = users.find((u) => u.id === req.user.id);

    if (user) {
      user.refreshToken = null; // invalidate in DB
      await writeUsers(users);
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};
// ----------------------------------------------------------------
// USER
// ----------------------------------------------------------------

const me = async (req, res, next) => {
  const currentUserID = req.user?.id;
  const users = await readUsers();

  const user = users.find((u) => u.id === currentUserID);
  if (!user) return next(new HttpError("User not found.", 404));

  const response = new HttpMessage("User fetched successfully.", 200, safeUser(user));
  return res.status(response.statusCode).json(response.data);
};

const editUser = async (req, res, next) => {
  const currentUserID = req.user?.id;
  const { userName, email, password } = req.body;

  if (!userName && !email && !password) {
    return next(new HttpError("Provide at least one field to update.", 422));
  }

  try {
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === currentUserID);

    if (userIndex === -1) return next(new HttpError("User not found.", 404));

    const oldUser = users[userIndex];

    // If email is being changed, make sure it isn't taken
    if (email && email !== oldUser.email) {
      const emailTaken = users.some((u) => u.email === email);
      if (emailTaken) return next(new HttpError("Email already in use.", 422));
    }

    const updatedUser = {
      ...oldUser,
      userName: userName ?? oldUser.userName,
      email: email ?? oldUser.email,
      password: password
        ? await argon2.hash(password, hashOptions)
        : oldUser.password,
      updatedAt: new Date(),
    };

    users[userIndex] = updatedUser;
    await writeUsers(users);

    const response = new HttpMessage("User updated successfully.", 200, safeUser(updatedUser));
    return res.status(response.statusCode).json(response.data);
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

// ----------------------------------------------------------------
// PASSWORD RESET
// ----------------------------------------------------------------

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new HttpError("Please provide your email.", 422));

  try {
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.email === email);

    // Don't reveal whether email exists or not — security best practice
    if (userIndex === -1) {
      const response = new HttpMessage("If that email exists, an OTP has been sent.", 200, null);
      return res.status(response.statusCode).json(response.data);
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    users[userIndex] = { ...users[userIndex], otp, otpExpiresAt };
    await writeUsers(users);

    await sendEmail({
      to: email,
      subject: "Your Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Use the OTP below to reset your password. It expires in <b>10 minutes</b>.</p>
        <h1 style="letter-spacing: 8px;">${otp}</h1>
        <p>If you did not request this, ignore this email.</p>
      `,
    });

    const response = new HttpMessage("If that email exists, an OTP has been sent.", 200, null);
    return res.status(response.statusCode).json(response.data);
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new HttpError("Fill in all fields.", 422));
  }

  try {
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) return next(new HttpError("Invalid request.", 400));

    const user = users[userIndex];

    if (user.otp !== otp) {
      return next(new HttpError("Invalid OTP.", 400));
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      return next(new HttpError("OTP has expired. Please request a new one.", 400));
    }

    const hashedPassword = await argon2.hash(newPassword, hashOptions);

    users[userIndex] = {
      ...user,
      password: hashedPassword,
      otp: null,
      otpExpiresAt: null,
      updatedAt: new Date(),
    };

    await writeUsers(users);

    const response = new HttpMessage("Password reset successfully.", 200, null);
    return res.status(response.statusCode).json(response.data);
  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

export {
  me,
  editUser,
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken
};