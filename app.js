import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api", (req, res) => {
  res.status(200).send("Hi there, welcome to to-du");
});

app.use((err, req, res, next) => {
  const statusCode = Number.isInteger(err?.code) ? err.code : 500;
  const message = err?.message || "Internal Server Error";

  res.status(statusCode).json({ message });
});

export default app;
