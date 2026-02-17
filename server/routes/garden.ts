import { Router, Request, Response } from 'express';
import db from '../db.js';
import { calculateStreak } from '../streak.js';

const router = Router();

interface HabitRow {
  id: string;
  name: string;
}

interface CompletionRow {
  completed_date: string;
}

router.get('/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const habits = db.prepare('SELECT id, name FROM habits WHERE user_id = ?').all(userId) as HabitRow[];

  const result = habits.map(habit => {
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
  });

  res.json(result);
});

export default router;
