import createError from 'http-errors';
import { Session } from '../models/Session.js';
import { Message } from '../models/Message.js';

export async function listMessages(req, res, next) {
  try {
    const { sessionId } = req.params;
    const since = req.query.since ? new Date(req.query.since) : null;

    const session = await Session.findById(sessionId);
    if (!session) throw createError(404, 'Session not found');

    // Only participants can view
    const uid = String(req.user._id);
    if (String(session.user) !== uid && String(session.guide) !== uid) {
      throw createError(403, 'Unauthorized');
    }

    const match = { session: session._id };
    if (since) match.createdAt = { $gt: since };

    const messages = await Message.find(match)
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({ messages });
  } catch (e) { next(e); }
}

export async function sendMessage(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw createError(400, 'Message text required');
    }

    const session = await Session.findById(sessionId);
    if (!session) throw createError(404, 'Session not found');

    const uid = String(req.user._id);
    const isGuide = String(session.guide) === uid;
    const isUser = String(session.user) === uid;
    if (!isGuide && !isUser) throw createError(403, 'Unauthorized');

    // Enforce chat mode: one-way allows only guide
    if (session.chatMode === 'one-way' && !isGuide) {
      throw createError(403, 'Only guide can send messages in one-way mode');
    }

    const msg = await Message.create({
      session: session._id,
      sender: uid,
      senderRole: isGuide ? 'guide' : 'user',
      text: text.trim(),
    });

    res.status(201).json({ message: msg });
  } catch (e) { next(e); }
}

export async function setChatMode(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { mode } = req.body; // 'one-way' | 'two-way'
    if (!['one-way', 'two-way'].includes(mode)) {
      throw createError(400, 'Invalid chat mode');
    }

    const session = await Session.findById(sessionId);
    if (!session) throw createError(404, 'Session not found');
    if (String(session.guide) !== String(req.user._id)) {
      throw createError(403, 'Only guide can change chat mode');
    }

    session.chatMode = mode;
    await session.save();

    res.json({ sessionId: session._id, chatMode: session.chatMode });
  } catch (e) { next(e); }
}
