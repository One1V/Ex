import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createBlog, listBlogs, getBlog, likeBlog, dislikeBlog, addComment, listComments, geocodeQuery } from '../controllers/blogController.js';

const router = Router();

// Blogs
router.get('/blogs', listBlogs);
router.post('/blogs', authMiddleware, createBlog);
router.get('/blogs/:id', getBlog);
router.post('/blogs/:id/like', authMiddleware, likeBlog);
router.post('/blogs/:id/dislike', authMiddleware, dislikeBlog);

// Comments
router.get('/blogs/:id/comments', listComments);
router.post('/blogs/:id/comments', authMiddleware, addComment);

// Geocode proxy (optional)
router.get('/geocode', geocodeQuery);

export default router;
