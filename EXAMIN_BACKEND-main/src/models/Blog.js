import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Location now mandatory and always set via geocoding autocomplete
  location: { type: String, required: true, trim: true },
  examCenterAddress: { type: String, trim: true }, // optional full exam center address user can supply
  locationCoords: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentsCount: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure geospatial index when coords present
blogSchema.index({ locationCoords: '2dsphere' });

export const Blog = mongoose.model('Blog', blogSchema);
