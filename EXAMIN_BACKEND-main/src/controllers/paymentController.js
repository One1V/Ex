import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { ok, fail } from '../utils/response.js';

/**
 * Create Razorpay order for session payment
 */
export const createOrder = async (req, res) => {
  try {
    const { sessionId } = req.body;
    // Ensure we compare Mongo ObjectId string
    const userId = req.user?._id?.toString();

    const session = await Session.findById(sessionId);
    if (!session) {
      return fail(res, 'Session not found', 404);
    }

    if (!userId || session.user.toString() !== userId) {
      return fail(res, 'Unauthorized', 403);
    }

    if (session.paymentStatus === 'completed') {
      return fail(res, 'Payment already completed', 400);
    }

    // Create Razorpay order
    const options = {
      amount: session.totalAmount * 100, // Amount in paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: `session_${sessionId}`,
      notes: {
        sessionId: sessionId,
        userId: userId,
        guideId: session.guide.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    // Update session with order ID
    session.razorpayOrderId = order.id;
    await session.save();

    ok(res, {
      orderId: order.id,
      amount: session.totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
    });
  } catch (error) {
    console.error('Create order error:', error);
    fail(res, error.message);
  }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionId } = req.body;
    const userId = req.user?._id?.toString();

    const session = await Session.findById(sessionId);
    if (!session) {
      return fail(res, 'Session not found', 404);
    }

    if (!userId || session.user.toString() !== userId) {
      return fail(res, 'Unauthorized', 403);
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'your_key_secret';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      session.paymentStatus = 'failed';
      await session.save();
      return fail(res, 'Payment verification failed', 400);
    }

    // Update session payment status
    session.paymentStatus = 'completed';
    session.razorpayPaymentId = razorpay_payment_id;
    session.paidAt = new Date();
    await session.save();

    ok(res, {
      message: 'Payment verified successfully',
      session: {
        id: session._id,
        status: session.status,
        paymentStatus: session.paymentStatus,
      },
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    fail(res, error.message);
  }
};

/**
 * Process refund for cancelled session
 */
export const processRefund = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const firebaseUid = req.user?.firebaseUid;

    const session = await Session.findById(sessionId).populate('user guide');
    if (!session) {
      return fail(res, 'Session not found', 404);
    }

    // Only user or guide can request refund
    if (session.user.firebaseUid !== firebaseUid && session.guide.firebaseUid !== firebaseUid) {
      return fail(res, 'Unauthorized', 403);
    }

    if (session.paymentStatus !== 'completed') {
      return fail(res, 'No payment to refund', 400);
    }

    if (!session.razorpayPaymentId) {
      return fail(res, 'Payment ID not found', 400);
    }

    // Create refund
    const refund = await razorpay.payments.refund(session.razorpayPaymentId, {
      amount: session.totalAmount * 100, // Full refund in paise
      notes: {
        reason: 'Session cancelled',
        sessionId: sessionId,
      },
    });

    // Update session
    session.paymentStatus = 'refunded';
    session.razorpayRefundId = refund.id;
    session.status = 'cancelled';
    await session.save();

    ok(res, {
      message: 'Refund processed successfully',
      refundId: refund.id,
    });
  } catch (error) {
    console.error('Process refund error:', error);
    fail(res, error.message);
  }
};

/**
 * Transfer payment to guide (called after session completion)
 */
export const transferToGuide = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId).populate('guide');
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.paymentStatus !== 'completed') {
      throw new Error('Payment not completed');
    }

    if (session.paymentTransferred) {
      throw new Error('Payment already transferred');
    }

    // In production, you would:
    // 1. Use Razorpay Route/Transfer API to send money to guide's account
    // 2. Or store guide's bank details and process transfers in batch
    // 3. Generate payment receipt PDF

    // For now, just mark as transferred
    session.paymentTransferred = true;
    session.transferredAt = new Date();
    await session.save();

    // TODO: Implement actual transfer logic
    // Example:
    // const transfer = await razorpay.transfers.create({
    //   account: session.guide.razorpayAccountId,
    //   amount: session.guideAmount * 100,
    //   currency: 'INR',
    //   notes: {
    //     sessionId: sessionId,
    //   },
    // });

    console.log(`Payment transferred to guide: Session ${sessionId}, Amount: ₹${session.guideAmount}`);
    
    return {
      success: true,
      guideAmount: session.guideAmount,
      adminFee: session.adminFee,
    };
  } catch (error) {
    console.error('Transfer to guide error:', error);
    throw error;
  }
};
