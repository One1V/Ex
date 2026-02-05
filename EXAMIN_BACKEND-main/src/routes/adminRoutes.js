import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { listUsers, createUser, updateUserRole, deleteUser, adminListBlogs, adminUpdateBlog, adminDeleteBlog } from '../controllers/adminController.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, requireAdmin);

// Users management (mounted under /api/admin)
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Blogs management (mounted under /api/admin)
router.get('/blogs', adminListBlogs);
router.patch('/blogs/:id', adminUpdateBlog);
router.delete('/blogs/:id', adminDeleteBlog);

export default router;
