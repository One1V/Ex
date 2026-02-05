import { Router } from 'express';
import { createOrUpdateUser, getMe, listGuides } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Create or update profile after signup
router.post('/users', authMiddleware, createOrUpdateUser);
// Get current user profile
router.get('/me', authMiddleware, getMe);
// List guides (requires auth)
router.get('/guides', authMiddleware, listGuides);

export default router;
