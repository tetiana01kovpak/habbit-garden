import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  _id: String,
  user_id: { type: String, required: true, index: true },
  name: { type: String, required: true },
  completions: { type: [String], default: [] },
  created_at: { type: Date, default: Date.now },
});

export const Habit = mongoose.model('Habit', habitSchema);
