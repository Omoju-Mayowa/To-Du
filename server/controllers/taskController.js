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
import { response } from "express"

const createTask = async (req, res, next) => {
  const tasks = await readTasks();
  const { title, body, priority } = req.body;

  if (!title || !body || !priority) {
    // Will fill in later
  }
  const newTask = {
    id: `task-${uuid().replace(/-/g, "")}`,
    title: title,
    body: body,
    priority: priority,
    status: "pending",
    userID: `user-${uuid().replace(/-/g, "")}`,
    createdAt: new Date(),
  };

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
    tasks = tasks.filter((t) => {
      t.title && t.title.toLowerCase().includes(searchT);
    });
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
  console.log(id)
  let tasks = await readTasks();

  const taskExists = tasks.find(t => t.id === id);
  
  if (!taskExists) {
    return next(new HttpError("This task does not exist.", 404));
  }
  
  const updatedTasks = tasks.filter(t => t.id !== id);

  await writeTasks(updatedTasks);

  const response = new HttpMessage("Found the task", 201, null);
  return res.status(response.statusCode).json(response);
};

// Changing status
const taskStatus = async (req, res, next) => {
  res.status(200).send("Task Re-opened.");
};

// TODO
const sendReminder = async (req, res, next) => {
  const tasks = await readTasks();
  const { id } = req.params;

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const limit = getReminderLimit(task.priority);

  const response = new HttpMessage("Reminder set", 201, task);
  // Get to work on this logic
  if (response.data.priority === "low") {
    return res.status(response.statusCode).json(response.data);
  } else {
    // Testing the route logic
    // return res.status(200).send("No need")
  }
  // will use node cron job for daily reminder
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
