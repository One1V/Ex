import { Router } from 'express';
import { createOrder, verifyPayment, processRefund } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Create Razorpay order
router.post('/payments/create-order', authMiddleware, createOrder);

// Verify payment after successful transaction
router.post('/payments/verify', authMiddleware, verifyPayment);

// Process refund for cancelled session
router.post('/payments/refund', authMiddleware, processRefund);

export default router;
