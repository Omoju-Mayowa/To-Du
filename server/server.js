import "dotenv/config";
import express from "express";
import chalk from "chalk";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;

import argon2 from "argon2";


app.use(express.json())

// Routes
app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);
app.use("/", (req, res) => {
  res.status(200).send('Hi there, welcome to to-du')
})


app.listen(PORT, async () => {
  try {
    console.log(chalk.green(`Server running on port ${PORT}`));
  } catch (err) {
    console.log(chalk.red(`Error: ${err}`));
  }
});
