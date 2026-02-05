import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, index: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'admin', 'guide'], default: 'user', index: true },
  phone: { type: String },
  examType: { type: String },
  examCity: { type: String },
  examDate: { type: String },
  examCenterAddress: { type: String },
  admitCardUrl: { type: String },
  supportType: [{ type: String }],
  hotelPriceRange: { type: String },
  travelMode: [{ type: String }],
  travelPreference: [{ type: String }],
  additionalInfo: { type: String },
  photoUrl: { type: String },
  // Guide-specific structured profile
  guideExams: [{
    examName: { type: String, required: true, trim: true },
    totalAttempts: { type: Number, default: 1, min: 1 },
    attempts: [{
      year: { type: Number },
      city: { type: String, required: true, trim: true },
      address: { type: String, trim: true },
      achievement: { type: String, trim: true },
      coords: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: undefined } // [lng, lat]
      }
    }]
  }],
  // Guide ratings and reviews
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  totalRatingPoints: { type: Number, default: 0 }, // Sum of all ratings for avg calculation
}, { timestamps: true });

// Geospatial index to enable proximity queries on attempts coords
userSchema.index({ 'guideExams.attempts.coords': '2dsphere' });
// Helpful indexes for filtering
userSchema.index({ role: 1, 'guideExams.examName': 1 });
userSchema.index({ role: 1, 'guideExams.attempts.city': 1 });

export const User = mongoose.model('User', userSchema);
