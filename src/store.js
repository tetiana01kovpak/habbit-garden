const KEY = 'habit-garden';

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
};

const save = (habits) => localStorage.setItem(KEY, JSON.stringify(habits));
const today = () => new Date().toISOString().slice(0, 10);

export const getHabits = () => load();

export const isDoneToday = (habit) => habit.lastCompletedDate === today();

export function addHabit(name) {
  const habits = load();
  const habit = {
    id: crypto.randomUUID(),
    name,
    lastCompletedDate: null,
    streakCount: 0,
    totalCompletions: 0,
  };
  habits.push(habit);
  save(habits);
  return habit;
}

export function completeHabit(id) {
  const habits = load();
  const habit = habits.find(h => h.id === id);
  if (!habit) return null;

  habit.streakCount += 1;
  habit.lastCompletedDate = today();
  habit.totalCompletions += 1;
  save(habits);
  return habit;
}

export function deleteHabit(id) {
  save(load().filter(h => h.id !== id));
}
