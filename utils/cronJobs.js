import cron from "node-cron";
import { readTasks, readUsers, writeTasks } from "./fileHelper.js";
import sendEmail from "./sendEmail.js";
import { getReminderLimit } from "./reminderHelper.js";
import HttpError from "../models/errorModel.js";

export const reminderJob = async () => {
  try {
    const tasks = await readTasks();
    const users = await readUsers();

    const now = Date.now();

    for (const task of tasks) {
      const limit = getReminderLimit(task.priority);
      if (task.status !== "pending") continue;

      if (!task.nextReminderAt) continue;

      if (now >= new Date(task.nextReminderAt).getTime()) {
        const user = users.find((u) => u.id === task.userID);
        if (!user) continue;
        const intervalHours = 24 / getReminderLimit(task.priority);
        
        try {
          await sendEmail({
            to: user.email,
            subject: "Task Reminder",
            html: `
                    <h1>${task.title}</h1>
                    <p>Have you already forgotten about this task of yours? It is of <b style="color: red;">${task.priority}</b> priority.</p>
                    <span>You even described it as:
                        <p><${task.body}.</p>
                    </span>
                    <p>Don't forget to complete it beforethe end of the day.</p>
                    <p>You set ${limit} hours reminder</p>
                    <p>Next reminder will be sent in ${intervalHours} hours.</p>
                  `,
          });
          console.log("Email sent sucessfully.");
          console.log(`You have ${limit} per day. Email is sent every ${intervalHours} hours. User ${user.userName} sent reminder.`);
        } catch(err) {
          let eMessage = new HttpError(`Could not send email. Error: ${err}`)
          return next(eMessage)
        }


        task.nextReminderAt = new Date(
          Date.now() + intervalHours * 60 * 60 * 1000,
        );
      }
    }

    await writeTasks(tasks);
  } catch (err) {
    console.log(err);
  }
};

const startReminderJob = () => {
  reminderJob();

  cron.schedule("* * * * *", reminderJob);
};

export default startReminderJob;
