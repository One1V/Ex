import createError from 'http-errors';
import { User } from '../models/User.js';

export async function createOrUpdateUser(req, res, next) {
  try {
    const firebaseUid = req.firebaseUid;
    if (!firebaseUid) throw createError(401, 'Unauthorized');
    const data = req.body;
    let user = await User.findOne({ firebaseUid });
    if (user) {
      Object.assign(user, data);
      await user.save();
    } else {
      const hasAdmin = await User.exists({ role: 'admin' });
      user = await User.create({ role: hasAdmin ? 'user' : 'admin', ...data, firebaseUid });
    }
    res.status(201).json({ user });
  } catch (e) { next(e); }
}

export async function getMe(req, res, next) {
  try {
    if (!req.user) throw createError(404, 'User profile not found');
    res.json({ user: req.user });
  } catch (e) { next(e); }
}

// Public (but authenticated) listing of guides with optional filters and proximity
export async function listGuides(req, res, next) {
  try {
    const {
      exam, // string
      city, // string
      lat, // number
      lng, // number
      radiusKm = 50, // default 50km
      limit = 30,
      skip = 0,
    } = req.query;

    // Base filter: only guides
    const match = { role: 'guide' };
    if (exam && exam !== 'All Exams') {
      match['guideExams.examName'] = exam;
    }
    if (city && city !== 'All Cities') {
      match['guideExams.attempts.city'] = city;
    }

    const useGeo = lat && lng;
    let docs;
    if (useGeo) {
      // Aggregation with geoNear must be first stage
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            distanceField: 'distanceMeters',
            maxDistance: Number(radiusKm) * 1000,
            spherical: true,
            key: 'guideExams.attempts.coords',
          }
        },
        { $match: match },
        { $skip: Number(skip) },
        { $limit: Number(limit) },
        {
          $project: {
            name: 1,
            email: 1,
            photoUrl: 1,
            guideExams: 1,
            distanceMeters: 1,
          }
        }
      ];
      docs = await User.aggregate(pipeline);
    } else {
      docs = await User.find(match)
        .sort({ updatedAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .select('name email photoUrl guideExams rating reviewCount');
    }

    // Map to a flatter shape for UI convenience
    const result = docs.map((u) => {
      const exams = Array.from(new Set((u.guideExams || []).map(e => e.examName).filter(Boolean)));
      const attemptCities = [];
      const achievements = [];
      (u.guideExams || []).forEach(g => {
        (g.attempts || []).forEach(a => {
          if (a?.city) attemptCities.push(a.city);
          if (a?.achievement) achievements.push(a.achievement);
        });
      });
      const cities = Array.from(new Set(attemptCities));
      return {
        id: String(u._id),
        name: u.name,
        photoUrl: u.photoUrl || null,
        exams,
        cities,
        achievements,
        rating: u.rating || 0,
        reviewCount: u.reviewCount || 0,
        distanceMeters: u.distanceMeters,
      };
    });

    res.json({ guides: result });
  } catch (e) { next(e); }
}
