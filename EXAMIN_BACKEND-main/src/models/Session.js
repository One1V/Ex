import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  // Guide who will conduct the session
  guide: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // User who booked the session
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Session preferences selected (can be multiple)
  preferences: [{
    type: { type: String, required: true }, // e.g., "Travel & Stay", "Exam Day Support", "Strategy Session"
    price: { type: Number, required: true },
  }],
  
  // Total amount and payment details
  totalAmount: { type: Number, required: true },
  adminFee: { type: Number, default: 0 }, // 5% of total
  guideAmount: { type: Number, default: 0 }, // 95% of total
  paymentId: { type: String }, // Legacy field (kept for backward compatibility)
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending', index: true },
  
  // Razorpay payment details
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpayRefundId: { type: String },
  paidAt: { type: Date },
  
  // Payment transfer to guide
  paymentTransferred: { type: Boolean, default: false },
  transferredAt: { type: Date },
  
  // Session timing
  scheduledAt: { type: Date, required: true, index: true },
  duration: { type: Number, required: true }, // in minutes
  
  // Session status
  status: { 
    type: String, 
    enum: ['booked', 'in-progress', 'completed', 'cancelled'], 
    default: 'booked',
    index: true
  },
  
  // Video session details
  roomId: { type: String, unique: true, sparse: true }, // Video room identifier
  startedAt: { type: Date },
  endedAt: { type: Date },
  
  // Feedback after session
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  feedbackAt: { type: Date },

  // Chat mode: 'one-way' (guide-only) or 'two-way' (guide and user)
  chatMode: { type: String, enum: ['one-way', 'two-way'], default: 'two-way' },
  
  // Receipt
  receiptUrl: { type: String },
  
}, { timestamps: true });

// Indexes for efficient queries
sessionSchema.index({ guide: 1, status: 1, scheduledAt: -1 });
sessionSchema.index({ user: 1, status: 1, scheduledAt: -1 });
sessionSchema.index({ scheduledAt: 1, duration: 1 });

export const Session = mongoose.model('Session', sessionSchema);
