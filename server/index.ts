import express from 'express';
import path from 'path';
import './db.js'; // ensure schema is created on import

import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import gardenRoutes from './routes/garden.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/garden', gardenRoutes);

// In production, serve the Vite-built frontend
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback — serves index.html for /garden/:userId and any other client routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
