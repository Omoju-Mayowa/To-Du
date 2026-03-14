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
  let currentUserID = req.user.id;

  if (!title || !body || !priority) {
    eMessage = new HttpError("Fill in all fields.", 422);
    return next(eMessage);
  }

  if (!PRIORITIES.includes(priority)) {
    return next(new HttpError(`Invalid Priority. Must be one of ${PRIORITIES.join(", ")}`, 400))
  }

  const intervalHours = 24 / getReminderLimit(priority);

  const newTask = {
    id: `task-${uuid().replace(/-/g, "")}`,
    title: title,
    body: body,
    priority: priority,
    status: "pending",
    userID: currentUserID,
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
  try {
    const { status, priority, search } = req.query;
    let tasks = await readTasks();
    let currentUserID = req.user?.id;
  
    if (search) {
      const searchT = search.toLowerCase();
      tasks = tasks.filter(
        (t) => t.title && t.title.toLowerCase().includes(searchT) && t.userID === currentUserID
      );
    }
  
    if (priority) {
      tasks = tasks.filter((t) => t.priority === priority && t.userID === currentUserID);
    }
  
    if (status) {
      tasks = tasks.filter((t) => t.status === status && t.userID === currentUserID);
    }
  
    tasks = tasks.filter((t) => t.userID === currentUserID);
 
    const response = new HttpMessage("Task Fetched Sucessfully", 200, tasks);
    return res.status(response.statusCode).json(response.data);
  } catch(err) {
      const error = new HttpError("An error occurred while fetching tasks.");
      return next(error);
  }
};

const fetchTask = async (req, res, next) => {
  const { id } = req.params;
  let tasks = await readTasks();
  let task;
  const currentUserID = req.user?.id

  if (!id) {
    const response = new HttpError("Task ID required.", 400);
    return next(response);
  }

  task = tasks.filter((t) => t.id === id)[0];

  if (!task) {
    const response = new HttpError("Task does not exist.");
    return next(response);
  }
  
  if(currentUserID !== task.userID) return next(new HttpError("Unauthorized.", 403))

  const response = new HttpMessage("Task found.", 201, task);
  return res.status(response.statusCode).json(response.data);
};

const updateTask = async (req, res, next) => {
  const { id } = req.params;
  const currentUserID = req.user?.id
  const { title, body, priority } = req.body
  
  if (!title && !body && !priority) {
    return next(new HttpError("Fill in at least one field.", 422))
  } 
  if (priority && !PRIORITIES.includes(priority)) {
    return next(new HttpError(`Invalid Priority. Must be one of ${PRIORITIES.join(", ")}`, 400))
  }
  
  const reminderPriority = priority ?? oldTask.priority;
  const intervalHours = 24 / getReminderLimit(reminderPriority);

  
  let tasks = await readTasks();

  const taskIndex = tasks.findIndex((t) => t.id === id)

  if(taskIndex === -1) return next(new HttpError("Task not found.", 404))

  const oldTask = tasks[taskIndex];

  if(currentUserID !== oldTask.userID) {
    return next(new HttpError("Unauthorized.", 400))
  }

  const updatedTask = {
    ...oldTask,
    title: title ?? oldTask.title,
    body: body ?? oldTask.body,
    priority: priority ?? oldTask.priority,
    status: "pending",
    userID: currentUserID,
    updatedAt: new Date(),
    nextReminderAt: new Date(Date.now() + intervalHours * 60 * 60 * 1000)
  }

  tasks[taskIndex] = updatedTask
  await writeTasks(tasks);

  const response = new HttpMessage("Task Updated Sucessfully", 200, updatedTask);
  return res.status(response.statusCode).json(response.data);

};

const deleteTask = async (req, res, next) => {
  const { id } = req.params;
  const currentUserID = req.user?.id
  let tasks = await readTasks();
    
  const taskExists = tasks.find((t) => t.id === id);

  if (!taskExists) return next(new HttpError("Task not found.", 404));
  if(currentUserID.toString() !== taskExists.userID) return next(new HttpError("Unauthorized.", 403))
  
  const updatedTasks = tasks.filter((t) => t.id !== id);

  await writeTasks(updatedTasks);

  const response = new HttpMessage("Task deleted successfully.", 200, null);
  return res.status(response.statusCode).json(response.data);
};

// Changing status
const taskStatus = async (req, res, next) => {
  const { id } = req.params;
  const currentUserID = req.user?.id;
  const { status } = req.body;

  if (!status) return next(new HttpError("Please provide a status.", 422));

  if (!TASK_STATUS.includes(status)) {
    return next(new HttpError(`Invalid status. Must be one of: ${TASK_STATUS.join(", ")}`, 400));
  }

  let tasks = await readTasks();

  const taskIndex = tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) return next(new HttpError("Task not found.", 404));

  const oldTask = tasks[taskIndex];

  if (currentUserID !== oldTask.userID) {
    return next(new HttpError("Unauthorized.", 403));
  }

  if (oldTask.status === status) {
    return next(new HttpError(`Task is already ${status}.`, 400));
  }

  const updatedTask = {
    ...oldTask,
    status,
    updatedAt: new Date(),
  };

  tasks[taskIndex] = updatedTask;
  await writeTasks(tasks);

  const response = new HttpMessage(`Task marked as ${status}.`, 200, updatedTask);
  return res.status(response.statusCode).json(response.data);
};
// TODO
const sendReminder = async (req, res, next) => {
  try {
    const tasks = await readTasks();
    const users = await readUsers();
    const currentUserID = req.user?.id
    const { id } = req.params;
    let message;
    let eMessage;

    const task = tasks.find((t) => t.id === id);
  
    if (!task) return next(new HttpError("Task not found.", 404));
    if(currentUserID !== task.userID) return next(new HttpError("Unauthorized.", 403))

    // Ensure user owns the task
    if (task.userID !== req.user.id) {
      eMessage = new HttpError("Unauthorized.", 403);
      return next(eMessage);
    }

    const user = users.find((u) => u.id === task.userID);

    if (!user) {
      eMessage = new HttpError("User not found.", 404);
      return next(eMessage);
    }

    const limit = getReminderLimit(task.priority);
    // Optional: reset next reminder time
    const intervalHours = 24 / getReminderLimit(task.priority);
    task.nextReminderAt = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
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
    
    message = new HttpMessage("Reminder sent successfully.", 200, null);
    console.log("Email sent sucessfully.")

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
  fetchAllTasks
};
