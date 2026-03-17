import { Router, Request, Response } from 'express';
import { User, Habit } from '../models/index.js';
import { calculateStreak } from '../streak.js';

const router = Router();

router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const habits = await Habit.find({ user_id: userId }).lean();

    const result = habits.map(habit => {
      const completedDates = [...habit.completions].sort().reverse();

      return {
        id: habit._id,
        name: habit.name,
        totalCompletions: completedDates.length,
        streakCount: calculateStreak(completedDates),
        lastCompletedDate: completedDates[0] || null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
