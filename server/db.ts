import mongoose from 'mongoose';

export async function connectDB() {
  const url = process.env.MONGO_URL;
  if (!url) {
    console.error('MONGO_URL environment variable is not set');
    process.exit(1);
  }
  await mongoose.connect(url);
  console.log('Connected to MongoDB');
}
