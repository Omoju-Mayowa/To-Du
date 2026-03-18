import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { me, editUser, registerUser, loginUser, forgotPassword, resetPassword, logoutUser } from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';
import { loginLimiter, userLimiter } from "../middleware/rateLimiter.js";
import { body } from 'express-validator'
import { validateRequest } from '../middleware/validationMiddleware.js'


const router = Router();

// GET ROUTES
router.get('/me', auth, asyncHandler(me))
// PATCH ROUTES
router.patch(
    '/edit-me', 
    auth, 
    userLimiter, 
    [
        body('userName').notEmpty().withMessage('Username is required').trim().escape(),
        body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    validateRequest,
    asyncHandler(editUser)
)
// POST ROUTES
router.post(
    '/register', loginLimiter, [
        body('userName').notEmpty().withMessage('Username is required').trim().escape(),
        body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    validateRequest, asyncHandler(registerUser)
)

router.post(
    '/login', loginLimiter, [
        body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
        body('password').notEmpty().withMessage('Password required'),
    ],
    validateRequest, asyncHandler(loginUser)
)
router.post('/logout', auth, userLimiter, asyncHandler(logoutUser))
router.post('/forgot-password', userLimiter, asyncHandler(forgotPassword))
router.post('/reset-password', userLimiter, asyncHandler(resetPassword))

export default router;