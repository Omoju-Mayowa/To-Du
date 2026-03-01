import HttpError from "../models/errorModel.js";

import argon2 from "argon2";
import { readUsers, writeUsers } from "../utils/fileHelper.js";
import HttpMessage from "../models/sucessModel.js";
import jwt from "jsonwebtoken";
import sendCookie from "../utils/sendCookie.js";

const secret = process.env.JWT_SECRET;

const hashOptions = {
  type: argon2.argon2id, // For added security
  memoryCost: 2 ** 16, // Uses 64mb of memory to hash password
  hashLength: 48, // Number of characters in the hash
  timeCost: 5, // Number of iterations to hash the password
  parallelism: 5, // Amount of threads used for hashing
};

const me = async (req, res, next) => {
  res.status(200).send("Heyy, it's you!");
};

const editUser = async (req, res, next) => {
  res.status(200).send("Finna be edited!");
};

const registerUser = async (req, res, next) => {
  const { userName, email, password } = req.body;
  const users = await readUsers();

  if (!userName || !email || !password) {
    const message = new HttpError("Fill in all fields.", 400);
    return next(message);
  }

  try {
    const hash = await argon2.hash(password, hashOptions);

    const hashed = await argon2.hash(password, hash);

    const newUser = {
      id: users.length + 1,
      userName: userName,
      email: email,
      password: hashed,
    };

    if (users.some((u) => u.email === email)) {
      const message = new HttpError("Email in use.", 400);
      return next(message);
    }

    users.push(newUser);
    await writeUsers(users);

    const response = new HttpMessage("User Created Sucessfully.", 201, newUser);
    return res.status(response.statusCode).json(response.data);
  } catch (error) {
    const message = new HttpError(error.message, 500);
    return next(message);
  }
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;
  let user;
  const users = await readUsers();

  if (!email || !password) {
    const message = new HttpError("Fill in all fields.", 400);
    return next(message);
  }

  try {
    user = users.find((t) => t.email === email);

    if (!user) {
      const message = new HttpError("Invalid Credentials.", 401);
      return next(message);
    }

    const passwordMatch = await argon2.verify(user.password, password);

    if (!passwordMatch) {
      const message = new HttpError("Invalid Credentials.", 401);
      return next(message);
    }

    // Removed since we pass through sendCookie
    // delete user.password;
    // console.log(user);

    // const response = new HttpMessage("Successfully Logged In.", 200, user)

    const token = jwt.sign(
      { id: user.id, userName: user.userName, email: user.email },
      secret,
      { expiresIn: "1d" },
    );

    // console.log(token);

    return sendCookie(res, token, 200, {
      id: user.id,
      userName: user.userName,
      email: user.email,
      token: token
    });
    
  } catch (err) {
    const message = new HttpError(err.message, 500);
    return next(message);
  }

  return res.json(user);
};

const logout = async (req, res, next) => {
  res.status(200).send("I have to leave!");
};

const forgotPassword = async (req, res, next) => {
  res.status(200).send("Ummm, I forgot!");
};

const allUsers = async (req, res, next) => {
  res.status(200).send("Shhhh! It's all our users");
};

const resetPassword = async (req, res, next) => {
  res.status(200).send("I got the code, I just wanna change it!");
};

export {
  me,
  editUser,
  registerUser,
  loginUser,
  logout,
  forgotPassword,
  resetPassword,
  allUsers,
};
