import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { me, editUser, registerUser, loginUser, logout, forgotPassword, resetPassword } from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';

const router = Router();

// GET ROUTES
router.get('/me', auth, asyncHandler(me))
// PATCH ROUTES
router.patch('/edit-me', auth, asyncHandler(editUser))
// POST ROUTES
router.post('/register', asyncHandler(registerUser))
router.post('/login', asyncHandler(loginUser))
router.post('/logout', auth, asyncHandler(logout))
router.post('/forgot-password', asyncHandler(forgotPassword))
router.post('/reset-password', asyncHandler(resetPassword))

export default router;