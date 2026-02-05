import createError from 'http-errors';
import { firebaseAuth } from '../config/firebaseAdmin.js';
import { User } from '../models/User.js';

export async function authMiddleware(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next(createError(401, 'Missing bearer token'));
  const token = header.substring(7);
  try {
    const decoded = await firebaseAuth.verifyIdToken(token);
    req.firebaseUid = decoded.uid;
    req.user = await User.findOne({ firebaseUid: decoded.uid });
    next();
  } catch (e) {
    next(createError(401, 'Invalid token'));
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(createError(401, 'Unauthorized'));
  if (req.user.role !== 'admin') return next(createError(403, 'Admin only'));
  next();
}
