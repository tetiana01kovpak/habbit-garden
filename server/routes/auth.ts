import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { signToken } from '../auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const id = crypto.randomUUID();
    const password_hash = bcrypt.hashSync(password, 10);

    try {
      await User.create({ _id: id, email, password_hash });
    } catch (err: any) {
      if (err.code === 11000) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }
      throw err;
    }

    res.json({ token: signToken(id), userId: id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const user = await User.findOne({ email }).lean();

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    res.json({ token: signToken(user._id), userId: user._id });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
