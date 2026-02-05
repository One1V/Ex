import createError from 'http-errors';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { transferToGuide } from './paymentController.js';

// Book a new session
export async function bookSession(req, res, next) {
  try {
    const userId = req.user._id;
    const { guideId, preferences, scheduledAt, duration } = req.body;

    if (!guideId || !preferences?.length || !scheduledAt || !duration) {
      throw createError(400, 'Missing required fields');
    }

    // Verify guide exists and has role 'guide'
    const guide = await User.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      throw createError(404, 'Guide not found');
    }

    // Calculate total amount
    const totalAmount = preferences.reduce((sum, pref) => sum + (pref.price || 0), 0);
    const adminFee = Math.round(totalAmount * 0.05 * 100) / 100; // 5%
    const guideAmount = totalAmount - adminFee;

    // Create session (payment will be completed separately)
    const session = await Session.create({
      guide: guideId,
      user: userId,
      preferences,
      totalAmount,
      adminFee,
      guideAmount,
      scheduledAt: new Date(scheduledAt),
      duration,
      status: 'booked',
      paymentStatus: 'pending',
    });

    res.status(201).json({ session });
  } catch (e) { next(e); }
}

// Update payment status after payment gateway confirmation
export async function updatePayment(req, res, next) {
  try {
    const { sessionId, paymentId, status } = req.body;
    
    const session = await Session.findById(sessionId);
    if (!session) throw createError(404, 'Session not found');
    
    // Verify user owns this session
    if (String(session.user) !== String(req.user._id)) {
      throw createError(403, 'Unauthorized');
    }

    session.paymentId = paymentId;
    session.paymentStatus = status;
    await session.save();

    res.json({ session });
  } catch (e) { next(e); }
}

// List sessions for current user
export async function listMySessions(req, res, next) {
  try {
    const userId = req.user._id;
    const { status } = req.query;
    
    const match = { user: userId };
    if (status) match.status = status;

    const sessions = await Session.find(match)
      .populate('guide', 'name email photoUrl rating reviewCount')
      .sort({ scheduledAt: -1 })
      .limit(50);

    res.json({ sessions });
  } catch (e) { next(e); }
}

// List sessions for guide (booked sessions with their guide)
export async function listGuideSessions(req, res, next) {
  try {
    const guideId = req.user._id;
    const { status } = req.query;
    
    const match = { guide: guideId };
    if (status) match.status = status;

    const sessions = await Session.find(match)
      .populate('user', 'name email photoUrl phone')
      .sort({ scheduledAt: -1 })
      .limit(50);

    res.json({ sessions });
  } catch (e) { next(e); }
}

// Start a session (guide only)
export async function startSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    
    if (!session) throw createError(404, 'Session not found');
    if (String(session.guide) !== String(req.user._id)) {
      throw createError(403, 'Only the guide can start this session');
    }
    if (session.status !== 'booked') {
      throw createError(400, 'Session cannot be started');
    }

    // Generate unique room ID and ensure Daily room exists via API
    const roomId = `session-${sessionId}-${Date.now()}`;
    // Create Daily room via REST API (idempotent)
    try {
      const apiKey = process.env.DAILY_API_KEY;
      if (!apiKey) {
        console.warn('DAILY_API_KEY not set; room will not be created on Daily. Join may fail if room is required to pre-exist.');
      } else {
        const resp = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: roomId,
            properties: {
              enable_screenshare: true,
              enable_chat: true,
              start_audio_off: false,
              start_video_off: false
            }
          })
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          // 409 means room already exists, which is fine
          if (resp.status !== 409) {
            console.error('Failed to create Daily room', resp.status, data);
          }
        }
      }
    } catch (roomErr) {
      console.error('Daily room creation error:', roomErr);
      // Do not fail starting session if room creation fails; client may retry/join later
    }

    session.roomId = roomId;
    session.status = 'in-progress';
    session.startedAt = new Date();
    await session.save();

    res.json({ session, roomId });
  } catch (e) { next(e); }
}

// End a session (guide only)
export async function endSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    
    if (!session) throw createError(404, 'Session not found');
    if (String(session.guide) !== String(req.user._id)) {
      throw createError(403, 'Only the guide can end this session');
    }
    if (session.status !== 'in-progress') {
      throw createError(400, 'Session is not in progress');
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    // Trigger payment distribution (5% admin, 95% guide)
    try {
      if (session.paymentStatus === 'completed' && !session.paymentTransferred) {
        await transferToGuide(sessionId);
      }
    } catch (transferError) {
      console.error('Payment transfer error:', transferError);
      // Don't fail the session end if transfer fails - can be retried later
    }

    res.json({ session });
  } catch (e) { next(e); }
}

// Submit feedback after session completion
export async function submitFeedback(req, res, next) {
  try {
    const { sessionId, rating, feedback } = req.body;
    
    if (!sessionId || !rating || rating < 1 || rating > 5) {
      throw createError(400, 'Invalid feedback data');
    }

    const session = await Session.findById(sessionId);
    if (!session) throw createError(404, 'Session not found');
    if (String(session.user) !== String(req.user._id)) {
      throw createError(403, 'Unauthorized');
    }
    if (session.status !== 'completed') {
      throw createError(400, 'Can only rate completed sessions');
    }
    if (session.rating) {
      throw createError(400, 'Feedback already submitted');
    }

    // Update session with feedback
    session.rating = rating;
    session.feedback = feedback || '';
    session.feedbackAt = new Date();
    await session.save();

    // Update guide's average rating
    const guide = await User.findById(session.guide);
    if (guide) {
      guide.totalRatingPoints = (guide.totalRatingPoints || 0) + rating;
      guide.reviewCount = (guide.reviewCount || 0) + 1;
      guide.rating = Math.round((guide.totalRatingPoints / guide.reviewCount) * 10) / 10;
      await guide.save();
    }

    res.json({ session });
  } catch (e) { next(e); }
}
