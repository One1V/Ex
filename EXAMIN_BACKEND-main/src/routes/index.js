import { Router } from 'express';
import userRoutes from './userRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import blogRoutes from './blogRoutes.js';
import adminRoutes from './adminRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import paymentRoutes from './paymentRoutes.js';

const router = Router();

router.use('/api', userRoutes);
router.use('/api', uploadRoutes);
router.use('/api', blogRoutes);
// Mount admin routes under /api/admin to avoid applying admin middleware to all /api/* requests
router.use('/api/admin', adminRoutes);
router.use('/api', sessionRoutes);
router.use('/api', paymentRoutes);

export default router;
