import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { me, editUser, registerUser, loginUser, forgotPassword, resetPassword, logoutUser } from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';
import { loginLimiter, userLimiter } from "../middleware/rateLimiter.js";

const router = Router();

// GET ROUTES
router.get('/me', auth, asyncHandler(me))
// PATCH ROUTES
router.patch('/edit-me', auth, userLimiter, asyncHandler(editUser))
// POST ROUTES
router.post('/register', loginLimiter, asyncHandler(registerUser))
router.post('/login', loginLimiter, asyncHandler(loginUser))
router.post('/logout', auth, userLimiter, asyncHandler(logoutUser))
router.post('/forgot-password', userLimiter, asyncHandler(forgotPassword))
router.post('/reset-password', userLimiter, asyncHandler(resetPassword))

export default router;