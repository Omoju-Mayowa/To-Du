import { Router } from "express";
import { body } from "express-validator";
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
import { validateRequest } from "../middleware/validationMiddleware.js";

const router = Router();





// POST ROUTES
router.route("/")
  .post(
    auth, 
    taskLimiter, 
    [
        body('title').notEmpty().withMessage('Title is required').trim().escape(),
        body('body').notEmpty().withMessage('Task description is required').trim().escape(),
        body('priority').isIn(['low', 'medium', 'high', 'utmost']).withMessage('Priority must be low, medium, high or utmost'),
    ],
    validateRequest,
    asyncHandler(createTask)
  )
  .get(auth, taskLimiter, asyncHandler(fetchTasks));

router.post("/:id/reminder", auth, taskLimiter, asyncHandler(sendReminder));
// GET ROUTES
router.route("/:id")
.patch(
  auth, 
  taskLimiter,
  [
      body('title').notEmpty().withMessage('Title is required').trim().escape(),
      body('body').notEmpty().withMessage('Task description is required').trim().escape(),
      body('priority').isIn(['low', 'medium', 'high', 'utmost']).withMessage('Priority must be low, medium, high or utmost'),
  ],
  validateRequest,
  asyncHandler(updateTask)
);
router.patch(
  "/:id/status", 
  auth, 
  taskLimiter, 
  [
    body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('Status must be pending, completed or cancelled')
  ],
  validateRequest,
  asyncHandler(taskStatus)
);
// DELETE ROUTED
router.delete("/:id", auth, taskLimiter, asyncHandler(deleteTask));

export default router;
