import createError from 'http-errors';
import { User } from '../models/User.js';
import { Blog } from '../models/Blog.js';
import { firebaseAuth } from '../config/firebaseAdmin.js';

// Users
export async function listUsers(_req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(500).exec();
    res.json(users);
  } catch (e) { next(e); }
}

export async function createUser(req, res, next) {
  try {
    const { email, password, name, role = 'user' } = req.body;
    if (!email || !password || !name) throw createError(400, 'name, email, password required');
    if (!['user', 'admin', 'guide'].includes(role)) throw createError(400, 'invalid role');
    // Create in Firebase
    const fbUser = await firebaseAuth.createUser({ email, password, displayName: name });
    // Create in Mongo
    const user = await User.create({ firebaseUid: fbUser.uid, email, name, role });
    res.status(201).json({ user });
  } catch (e) { next(e); }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params; // Mongo _id
    const { role } = req.body;
    if (!['user', 'admin', 'guide'].includes(role)) throw createError(400, 'invalid role');
    const user = await User.findById(id);
    if (!user) throw createError(404, 'User not found');
    user.role = role;
    await user.save();
    res.json({ user });
  } catch (e) { next(e); }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw createError(404, 'User not found');
    // Optional: prevent deleting self (admin)
    if (req.user && user._id.equals(req.user._id)) throw createError(400, 'Cannot delete yourself');
    await User.deleteOne({ _id: id });
    if (user.firebaseUid) {
      try { await firebaseAuth.deleteUser(user.firebaseUid); } catch { /* ignore */ }
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
}

// Blogs
export async function adminListBlogs(_req, res, next) {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }).limit(500).exec();
    res.json(blogs);
  } catch (e) { next(e); }
}

export async function adminUpdateBlog(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const blog = await Blog.findById(id);
    if (!blog) throw createError(404, 'Blog not found');
    if (title) blog.title = title;
    if (content) blog.content = content;
    await blog.save();
    res.json(blog);
  } catch (e) { next(e); }
}

export async function adminDeleteBlog(req, res, next) {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) throw createError(404, 'Blog not found');
    await Blog.deleteOne({ _id: id });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
