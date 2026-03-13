import HttpError from "../models/errorModel.js";

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return next(new HttpError("Access denied. Admins only.", 403));
};

export default admin;