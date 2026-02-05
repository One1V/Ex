import createError from 'http-errors';
import { Blog } from '../models/Blog.js';
import { Comment } from '../models/Comment.js';
import { geocode } from '../utils/geocode.js';

// Helper to parse near param "lat,lng"
function parseNear(near) {
  if (!near) return null;
  const parts = near.split(',').map(p => parseFloat(p.trim()));
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  return { lat: parts[0], lng: parts[1] };
}

export async function createBlog(req, res, next) {
  try {
    if (!req.user) throw createError(401, 'Unauthorized');
    const { title, content, location, lat, lng, examCenterAddress } = req.body;
    if (!title || !content) throw createError(400, 'Title & content required');
    if (!location || !lat || !lng) throw createError(400, 'Location selection required');
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) throw createError(400, 'Invalid coordinates');
    const blog = new Blog({
      title,
      content,
      author: req.user._id,
      location,
      examCenterAddress: examCenterAddress || undefined,
      locationCoords: { type: 'Point', coordinates: [longitude, latitude] }
    });
    await blog.save();
    res.status(201).json(formatBlog(blog));
  } catch (e) { next(e); }
}

export async function listBlogs(req, res, next) {
  try {
    const { search, location, minLikes, maxLikes, minComments, near, radiusKm, sortLikes } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    // Build like size expressions allowing both min & max simultaneously
    const likeExprs = [];
    if (minLikes) {
      likeExprs.push({ $gte: [{ $size: '$likes' }, parseInt(minLikes, 10) || 0] });
    }
    if (maxLikes) {
      likeExprs.push({ $lte: [{ $size: '$likes' }, parseInt(maxLikes, 10) || 0] });
    }
    if (likeExprs.length === 1) filter.$expr = likeExprs[0];
    if (likeExprs.length === 2) filter.$expr = { $and: likeExprs };
    if (minComments) {
      filter.commentsCount = { $gte: parseInt(minComments, 10) || 0 };
    }
    const nearPoint = parseNear(near);
    if (nearPoint) {
      const radiusMeters = (parseFloat(radiusKm) || 5) * 1000;
      filter.locationCoords = {
        $near: {
          $geometry: { type: 'Point', coordinates: [nearPoint.lng, nearPoint.lat] },
          $maxDistance: radiusMeters
        }
      };
    }
    // If sort by likes requested and no $near geospatial filter, use aggregation for accurate sorting
    if (sortLikes && !filter.locationCoords) {
      const order = (typeof sortLikes === 'string' && sortLikes.toLowerCase() === 'asc') ? 1 : -1;
      const pipeline = [
        { $match: filter },
        { $addFields: { likesCount: { $size: '$likes' } } },
        { $sort: { likesCount: order, createdAt: -1 } },
        { $limit: 100 }
      ];
      const agg = await Blog.aggregate(pipeline).exec();
      // agg returns plain objects; map to formatBlog-like shape
      const formatted = agg.map(b => ({
        id: b._id.toString(),
        title: b.title,
        content: b.content,
        author: b.author?.toString?.() || (b.author && b.author.toString()),
        location: b.location,
        examCenterAddress: b.examCenterAddress,
        coordinates: b.locationCoords?.coordinates ? { lng: b.locationCoords.coordinates[0], lat: b.locationCoords.coordinates[1] } : null,
        likes: (b.likes && b.likes.length) || b.likesCount || 0,
        dislikes: (b.dislikes && b.dislikes.length) || 0,
        commentsCount: b.commentsCount,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));
      return res.json(formatted);
    }

    // Default path (including when near geospatial filter is used)
    const blogs = await Blog.find(filter).sort({ createdAt: -1 }).limit(100).exec();
    let formatted = blogs.map(b => formatBlog(b));
    if (sortLikes) {
      const asc = (typeof sortLikes === 'string' && sortLikes.toLowerCase() === 'asc');
      formatted = formatted.sort((a, b) => asc ? a.likes - b.likes : b.likes - a.likes);
    }
    res.json(formatted);
  } catch (e) { next(e); }
}

export async function getBlog(req, res, next) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw createError(404, 'Blog not found');
    res.json(formatBlog(blog));
  } catch (e) { next(e); }
}

export async function likeBlog(req, res, next) {
  try {
    if (!req.user) throw createError(401, 'Unauthorized');
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw createError(404, 'Blog not found');
    const uid = req.user._id;
    const liked = blog.likes.some(id => id.equals(uid));
    if (liked) {
      blog.likes = blog.likes.filter(id => !id.equals(uid));
    } else {
      blog.likes.push(uid);
      blog.dislikes = blog.dislikes.filter(id => !id.equals(uid));
    }
    await blog.save();
    res.json(formatBlog(blog));
  } catch (e) { next(e); }
}

export async function dislikeBlog(req, res, next) {
  try {
    if (!req.user) throw createError(401, 'Unauthorized');
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw createError(404, 'Blog not found');
    const uid = req.user._id;
    const disliked = blog.dislikes.some(id => id.equals(uid));
    if (disliked) {
      blog.dislikes = blog.dislikes.filter(id => !id.equals(uid));
    } else {
      blog.dislikes.push(uid);
      blog.likes = blog.likes.filter(id => !id.equals(uid));
    }
    await blog.save();
    res.json(formatBlog(blog));
  } catch (e) { next(e); }
}

export async function addComment(req, res, next) {
  try {
    if (!req.user) throw createError(401, 'Unauthorized');
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw createError(404, 'Blog not found');
    const { content, parentComment } = req.body;
    if (!content) throw createError(400, 'Content required');
    // If replying to a comment, ensure it exists and belongs to same blog
    let parent = null;
    if (parentComment) {
      parent = await Comment.findById(parentComment);
      if (!parent) throw createError(404, 'Parent comment not found');
      if (!parent.blog.equals(blog._id)) throw createError(400, 'Parent comment belongs to a different blog');
    }
    const comment = new Comment({ blog: blog._id, author: req.user._id, content, parentComment: parent ? parent._id : null });
    await comment.save();
    blog.commentsCount += 1;
    await blog.save();
    res.status(201).json(formatComment(comment));
  } catch (e) { next(e); }
}

export async function listComments(req, res, next) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) throw createError(404, 'Blog not found');
    const comments = await Comment.find({ blog: blog._id }).sort({ createdAt: 1 }).limit(500).lean().exec();
    // Build nested tree
    const byId = new Map();
    const roots = [];
    comments.forEach(c => {
      byId.set(c._id.toString(), { ...formatComment(c), replies: [] });
    });
    comments.forEach(c => {
      const node = byId.get(c._id.toString());
      const parentId = c.parentComment ? c.parentComment.toString() : null;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId).replies.push(node);
      } else {
        roots.push(node);
      }
    });
    // Optionally, reverse to have newest first at each level? We'll keep ascending chronological order.
    res.json(roots);
  } catch (e) { next(e); }
}

export async function geocodeQuery(req, res, next) {
  try {
    const { q } = req.query;
    const results = await geocode(q || '');
    res.json(results);
  } catch (e) { next(e); }
}

function formatBlog(blog) {
  return {
    id: blog._id.toString(),
    title: blog.title,
    content: blog.content,
    author: blog.author?.toString(),
    location: blog.location,
    examCenterAddress: blog.examCenterAddress,
    coordinates: blog.locationCoords?.coordinates ? { lng: blog.locationCoords.coordinates[0], lat: blog.locationCoords.coordinates[1] } : null,
    likes: blog.likes.length,
    dislikes: blog.dislikes.length,
    commentsCount: blog.commentsCount,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
  };
}

function formatComment(c) {
  return {
    id: c._id.toString(),
    blog: c.blog.toString(),
    author: c.author.toString(),
    content: c.content,
    createdAt: c.createdAt,
  };
}
