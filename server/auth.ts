import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } satisfies AuthPayload, SECRET, { expiresIn: '30d' });
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), SECRET) as AuthPayload;
    (req as any).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
