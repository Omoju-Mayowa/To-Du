import jwt from 'jsonwebtoken'
import HttpError from '../models/errorModel.js';

const secret = process.env.JWT_SECRET

const auth = (req, res, next) => {
  const token = req.cookies?.accessToken
  let eMessage;
  if (!token) {
    eMessage = new HttpError("Unauthorized. Please log in", 404)
    return next(eMessage)
  }
  
  try {
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    // console.log("Decoded: ", req.user)
    next()
  } catch {
    eMessage = new HttpError("Unauthorized. Please log in", 404)
    return next(eMessage)
  }
  
  
};

export default auth;
