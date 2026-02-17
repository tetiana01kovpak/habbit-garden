import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db.js';
import { verifyToken } from '../auth.js';
import { calculateStreak } from '../streak.js';

const router = Router();

interface HabitRow {
  id: string;
  name: string;
}

interface CompletionRow {
  completed_date: string;
}

function enrichHabit(habit: HabitRow) {
  const dates = db
    .prepare('SELECT completed_date FROM completions WHERE habit_id = ? ORDER BY completed_date DESC')
    .all(habit.id) as CompletionRow[];

  const completedDates = dates.map(d => d.completed_date);

  return {
    id: habit.id,
    name: habit.name,
    totalCompletions: completedDates.length,
    streakCount: calculateStreak(completedDates),
    lastCompletedDate: completedDates[0] || null,
  };
}

router.get('/', verifyToken, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const habits = db.prepare('SELECT id, name FROM habits WHERE user_id = ?').all(userId) as HabitRow[];
  res.json(habits.map(enrichHabit));
});

router.post('/', verifyToken, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Name required' });
    return;
  }

  const id = crypto.randomUUID();
  db.prepare('INSERT INTO habits (id, user_id, name) VALUES (?, ?, ?)').run(id, userId, name);
  res.json(enrichHabit({ id, name }));
});

router.post('/:id/complete', verifyToken, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const habitId = req.params.id;

  const habit = db.prepare('SELECT id, name FROM habits WHERE id = ? AND user_id = ?').get(habitId, userId) as
    | HabitRow
    | undefined;
  if (!habit) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    db.prepare('INSERT INTO completions (habit_id, completed_date) VALUES (?, ?)').run(habitId, today);
  } catch {
    // UNIQUE constraint — already completed today, that's fine
  }

  res.json(enrichHabit(habit));
});

router.delete('/:id', verifyToken, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const result = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(req.params.id, userId);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Habit not found' });
    return;
  }
  res.json({ ok: true });
});

export default router;
