import jwt from "jsonwebtoken";
import HttpError from "../models/errorModel.js";
import { environment } from "../environment.js";
import { readUsers, writeUsers } from "../utils/fileHelper.js";

const auth = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  // No tokens at all
  if (!accessToken && !refreshToken)
    return next(new HttpError("Unauthorized. Please log in", 401));

  // Try access token first
  try {
    const decoded = jwt.verify(accessToken, environment.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Access token expired or invalid — try refresh token
    if (!refreshToken)
      return next(new HttpError("Unauthorized. Please log in", 401));

    try {
      const decoded = jwt.verify(refreshToken, environment.JWT_REFRESH_SECRET);

      const users = await readUsers();
      const user = users.find((u) => u.id === decoded.id);

      if (!user || user.refreshToken !== refreshToken)
        return next(new HttpError("Unauthorized. Please log in", 401));

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

      req.user = { id: user.id, userName: user.userName, email: user.email };
      return next();
    } catch {
      return next(new HttpError("Unauthorized. Please log in", 401));
    }
  }
};

export default auth;