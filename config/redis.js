import { createClient } from "redis";
import { environment } from "../environment.js";

export const redisClient = createClient({
  url: environment.REDIS_URL,
});

redisClient.on("error", (err) => {
  console.log("Redis Error: ", err)
})

await redisClient.connect()