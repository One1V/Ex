import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderRole: { type: String, enum: ['guide', 'user'], required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

messageSchema.index({ session: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
