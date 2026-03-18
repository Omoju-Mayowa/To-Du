export const environment = {
  PORT: process.env.PORT,
  EMAIL_TOKEN: process.env.EMAIL_TOKEN,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE,
  REDIS_URL: process.env.REDIS_URL,
  MONGODB_URL: process.env.MONGODB_URL,
}

export const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000        // 15 mins
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000  // 7 days
