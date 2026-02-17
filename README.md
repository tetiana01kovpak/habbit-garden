# Habit Garden

3D habit tracker built with Three.js, Express, and SQLite. Habits grow into unique plants — streaks make them glow.

## Local Development

```bash
cp .env.example .env
npm install
npm run dev
```

Opens Vite on `http://localhost:5173` with API proxy to the Express server on port 3000.

## Deploy on Render

1. Create a **Web Service** connected to this repo.
2. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
3. Add environment variable:
   - `JWT_SECRET` — any random string (e.g. `openssl rand -hex 32`)
4. Deploy.

The server serves both the API and the Vite-built static files from `dist/`.

