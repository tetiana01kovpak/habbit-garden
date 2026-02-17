import type { Habit } from './plant.js';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuth(token: string, userId: string): void {
  localStorage.setItem('token', token);
  localStorage.setItem('userId', userId);
}

export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
}

export function getUserId(): string | null {
  return localStorage.getItem('userId');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...opts.headers as Record<string, string> };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function register(email: string, password: string): Promise<void> {
  const data = await apiFetch<{ token: string; userId: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuth(data.token, data.userId);
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiFetch<{ token: string; userId: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuth(data.token, data.userId);
}

export async function getHabits(): Promise<Habit[]> {
  return apiFetch<Habit[]>('/api/habits');
}

export async function addHabit(name: string): Promise<Habit> {
  return apiFetch<Habit>('/api/habits', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function completeHabit(id: string): Promise<Habit> {
  return apiFetch<Habit>(`/api/habits/${id}/complete`, { method: 'POST' });
}

export async function deleteHabit(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/api/habits/${id}`, { method: 'DELETE' });
}

export async function getPublicGarden(userId: string): Promise<Habit[]> {
  return apiFetch<Habit[]>(`/api/garden/${userId}`);
}
