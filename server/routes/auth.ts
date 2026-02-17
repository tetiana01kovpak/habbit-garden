import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../db.js';
import { signToken } from '../auth.js';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const id = crypto.randomUUID();
  const password_hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)').run(id, email, password_hash);

  res.json({ token: signToken(id), userId: id });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as
    | { id: string; password_hash: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  res.json({ token: signToken(user.id), userId: user.id });
});

export default router;
