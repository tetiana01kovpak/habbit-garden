import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { Habit } from '../models/index.js';
import { verifyToken } from '../auth.js';
import { calculateStreak } from '../streak.js';

const router = Router();

function enrichHabit(habit: { _id: string; name: string; completions: string[] }) {
  const completedDates = [...habit.completions].sort().reverse();

  return {
    id: habit._id,
    name: habit.name,
    totalCompletions: completedDates.length,
    streakCount: calculateStreak(completedDates),
    lastCompletedDate: completedDates[0] || null,
  };
}

router.get('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const habits = await Habit.find({ user_id: userId }).lean();
    res.json(habits.map(enrichHabit));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name required' });
      return;
    }

    const id = crypto.randomUUID();
    const habit = await Habit.create({ _id: id, user_id: userId, name, completions: [] });
    res.json(enrichHabit({ _id: habit._id, name: habit.name, completions: habit.completions }));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/complete', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const habitId = req.params.id;
    const today = new Date().toISOString().slice(0, 10);

    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, user_id: userId },
      { $addToSet: { completions: today } },
      { new: true },
    ).lean();

    if (!habit) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }

    res.json(enrichHabit(habit));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const result = await Habit.deleteOne({ _id: req.params.id, user_id: userId });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Habit not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
