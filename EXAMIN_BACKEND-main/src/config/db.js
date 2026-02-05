import mongoose from 'mongoose';
import { env, required } from './env.js';

export async function connectDB() {
  const uri = required('MONGO_URI', env.MONGO_URI);
  await mongoose.connect(uri, { autoIndex: true });
  console.log('MongoDB connected');
}
