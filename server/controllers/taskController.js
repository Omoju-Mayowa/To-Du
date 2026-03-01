import {
  PRIORITIES,
  TASK_STATUS,
  REMINDERS_PER_DAY,
} from "../utils/constants.js";
import { getReminderLimit } from "../utils/reminderHelper.js";
import { v4 as uuid } from "uuid";
import {
  readTasks,
  readUsers,
  writeTasks,
  writeUsers,
} from "../utils/fileHelper.js";
import HttpError from "../models/errorModel.js";
import HttpMessage from "../models/sucessModel.js";
import { reminderJob } from "../utils/cronJobs.js";
import sendEmail from "../utils/sendEmail.js";

const createTask = async (req, res, next) => {
  const tasks = await readTasks();
  const { title, body, priority } = req.body;

  let eMessage;
  let userID = req.user.id;

  if (!title || !body || !priority) {
    eMessage = new HttpError("Fill in all fields.", 400);
    return next(eMessage);
  }

  if (!PRIORITIES.includes(priority)) {
    eMessage = new HttpError(
      "Invalid Priority. You can only use low, medium, high, utmost",
      400,
    );
    return next(eMessage);
  }

  const intervalHours = 24 / getReminderLimit(priority);

  const newTask = {
    id: `task-${uuid().replace(/-/g, "")}`,
    title: title,
    body: body,
    priority: priority,
    status: "pending",
    userID: userID,
    createdAt: new Date(),
    nextReminderAt: new Date(Date.now() + intervalHours * 60 * 60 * 1000),
  };

  // console.log(userID)

  tasks.push(newTask);
  await writeTasks(tasks);

  const response = new HttpMessage("Task Created Sucessfully", 200, newTask);
  return res.status(response.statusCode).json(response.data);
};

const fetchTasks = async (req, res, next) => {
  const { status, priority, search } = req.query;
  let tasks = await readTasks();

  if (search) {
    const searchT = search.toLowerCase();
    tasks = tasks.filter(
      (t) => t.title && t.title.toLowerCase().includes(searchT),
    );
  }

  if (priority) {
    tasks = tasks.filter((t) => t.priority === priority);
  }

  if (status) {
    tasks = tasks.filter((t) => t.status === status);
  }

  const response = new HttpMessage("Task Fetched Sucessfully", 200, tasks);
  return res.status(response.statusCode).json(response.data);
};

const fetchTask = async (req, res, next) => {
  const { id } = req.params;
  let tasks = await readTasks();
  let task;

  if (!id) {
    const response = new HttpError("Task ID required.", 400);
    return next(response);
  }

  task = tasks.filter((t) => t.id === id)[0];

  if (!task) {
    const response = new HttpError("Task does not exist.");
    return next(response);
  }

  const response = new HttpMessage("Task found.", 201, task);
  return res.status(response.statusCode).json(response.data);
};

const updateTask = async (req, res, next) => {
  res.status(200).send("Task updated");
};

const deleteTask = async (req, res, next) => {
  const { id } = req.params;
  console.log(id);
  let tasks = await readTasks();

  const taskExists = tasks.find((t) => t.id === id);

  if (!taskExists) {
    return next(new HttpError("This task does not exist.", 404));
  }

  const updatedTasks = tasks.filter((t) => t.id !== id);

  await writeTasks(updatedTasks);

  const response = new HttpMessage("Found the task", 201, null);
  return res.status(response.statusCode).json(response.data);
};

// Changing status
const taskStatus = async (req, res, next) => {
  res.status(200).send("Task Re-opened.");
};

// TODO
const sendReminder = async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const users = await readUsers();
    const { id } = req.params;
    let message
    let eMessage

    const task = tasks.find((t) => t.id === id);

    if (!task) {
      eMessage = new HttpError("Task not found.", 404)
      return next(eMessage);
    }

    // Ensure user owns the task
    if (task.userID !== req.user.id) {
      eMessage = new HttpError("Unauthorized.", 403)
      return next(eMessage);
    }

    const user = users.find((u) => u.id === task.userID);

    if (!user) {
      eMessage = new HttpError("User not found.", 404)
      return next(eMessage);
    }

    const limit = getReminderLimit(task.priority)
    // Optional: reset next reminder time
    const intervalHours = 24 / getReminderLimit(task.priority);
    task.nextReminderAt = new Date(
      Date.now() + intervalHours * 60 * 60 * 1000
    );
    // Send email immediately
    await sendEmail({
      to: user.email,
      subject: "Manual Task Reminder",
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


    await writeTasks(tasks);
    
    message = new HttpMessage("Reminder sent successfully.", 200, null)
    return res.status(200).json(message);

  } catch (err) {
    return next(new HttpError(err.message, 500));
  }
};

export {
  createTask,
  fetchTask,
  fetchTasks,
  updateTask,
  deleteTask,
  taskStatus,
  sendReminder,
};
