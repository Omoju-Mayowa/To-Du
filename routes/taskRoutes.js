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
const router = Router();

// POST ROUTES
router.post("/", auth, asyncHandler(createTask));
router.post("/:id/reminder", auth, asyncHandler(sendReminder));
// GET ROUTES
router.get("/", auth, asyncHandler(fetchTasks));
router.get("/:id", auth, asyncHandler(fetchTask));
// PATCH ROUTES
router.patch("/:id", auth, asyncHandler(updateTask));
router.patch("/:id/status", auth, asyncHandler(taskStatus));
// DELETE ROUTED
router.delete("/:id", auth, asyncHandler(deleteTask));

export default router;
