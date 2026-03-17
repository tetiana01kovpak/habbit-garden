import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: String,
  email: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const User = mongoose.model('User', userSchema);
