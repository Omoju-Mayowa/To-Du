import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

const createStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix,
  });

const authKey = (req) => req.user?.id || ipKeyGenerator(req);

export const taskLimiter = rateLimit({
  store: createStore("rl:tasks:"),
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: authKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      message: "Too many task-related attempts. Try again later."
    });
  }
});

export const loginLimiter = rateLimit({
  store: createStore("rl:login:"),
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      message: "Too many login attempts. Try again later."
    });
  }
});

export const userLimiter = rateLimit({
  store: createStore("rl:user:"),
  windowMs: 5 * 60 * 1000,
  limit: 10,
  keyGenerator: authKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 429,
      message: "Too many user-related attempts. Try again later."
    });
  }
});