import { Router } from "express";
import auth from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createTask,
  fetchTask,
  fetchTasks,
  updateTask,
  deleteTask,
  taskStatus,
  sendReminder,
  fetchAllTasks
} from "../controllers/taskController.js";
import { taskLimiter } from "../middleware/rateLimiter.js";

const router = Router();



// POST ROUTES
router.post("/", auth, taskLimiter, asyncHandler(createTask));
router.post("/:id/reminder", auth, taskLimiter, asyncHandler(sendReminder));
// GET ROUTES
router.get("/", auth, taskLimiter, asyncHandler(fetchTasks));
router.get("/:id", auth, taskLimiter, asyncHandler(fetchTask));
// PATCH ROUTES
router.patch("/:id", auth, taskLimiter, asyncHandler(updateTask));
router.patch("/:id/status", auth, taskLimiter, asyncHandler(taskStatus));
// DELETE ROUTED
router.delete("/:id", auth, taskLimiter, asyncHandler(deleteTask));

export default router;
