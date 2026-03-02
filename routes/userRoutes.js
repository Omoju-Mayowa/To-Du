import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { me, editUser, registerUser, loginUser, logout, forgotPassword, resetPassword, allUsers } from '../controllers/userController.js'
import auth from '../middleware/authMiddleware.js'
import { loginLimiter, userLimiter } from "../middleware/rateLimiter.js";

const router = Router()

// GET ROUTES
router.get('/', userLimiter, asyncHandler(allUsers))
router.get('/me', auth, userLimiter, asyncHandler(me))
// PATCH ROUTES
router.patch('/edit-me', auth, userLimiter, editUser)
// POST ROUTES
router.post('/register', loginLimiter, asyncHandler(registerUser))
router.post('/login', loginLimiter, asyncHandler(loginUser))
router.post('/logout', auth, userLimiter, logout)
router.post('/forgot-password', userLimiter, asyncHandler(forgotPassword))
router.post('/reset-password', userLimiter, asyncHandler(resetPassword))

export default router