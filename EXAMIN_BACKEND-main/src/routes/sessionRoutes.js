import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  bookSession,
  updatePayment,
  listMySessions,
  listGuideSessions,
  startSession,
  endSession,
  submitFeedback,
} from '../controllers/sessionController.js';
import { listMessages, sendMessage, setChatMode } from '../controllers/messageController.js';

const router = Router();

// All session routes require authentication
router.use(authMiddleware);

// Book a session
router.post('/sessions', bookSession);

// Update payment status
router.patch('/sessions/:sessionId/payment', updatePayment);

// List user's sessions
router.get('/sessions/my', listMySessions);

// List guide's sessions
router.get('/sessions/guide', listGuideSessions);

// Start session (guide only)
router.post('/sessions/:sessionId/start', startSession);

// End session (guide only)
router.post('/sessions/:sessionId/end', endSession);

// Submit feedback
router.post('/sessions/feedback', submitFeedback);

// Chat APIs
router.get('/sessions/:sessionId/messages', listMessages);
router.post('/sessions/:sessionId/messages', sendMessage);
router.patch('/sessions/:sessionId/chat-mode', setChatMode);

export default router;
