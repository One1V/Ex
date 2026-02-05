import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { uploadSingle } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Auth required to upload
router.post('/upload', authMiddleware, upload.single('file'), uploadSingle);

export default router;
