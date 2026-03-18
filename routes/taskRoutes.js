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
  sendReminder
} from "../controllers/taskController.js";
import { taskLimiter } from "../middleware/rateLimiter.js";

const router = Router();



// POST ROUTES
router.route("/")
  .post(auth, taskLimiter, asyncHandler(createTask))
  .get(auth, taskLimiter, asyncHandler(fetchTasks));

router.post("/:id/reminder", auth, taskLimiter, asyncHandler(sendReminder));
// GET ROUTES
router.route("/:id")
  .get(auth, taskLimiter, asyncHandler(fetchTask))
  .patch(auth, taskLimiter, asyncHandler(updateTask));
router.patch("/:id/status", auth, taskLimiter, asyncHandler(taskStatus));
// DELETE ROUTED
router.delete("/:id", auth, taskLimiter, asyncHandler(deleteTask));

export default router;
