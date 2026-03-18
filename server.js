import chalk from "chalk";
import app from "./app.js";
import startReminderJob from "./utils/cronJobs.js";
import { environment } from "./environment.js";


const PORT = process.env.PORT || 5001;

startReminderJob();

app.listen(PORT, () => {
  try {
    console.log(chalk.green(`Server running on port ${PORT}`));
  } catch (err) {
    console.log(chalk.red(`Error: ${err}`));
  }
})