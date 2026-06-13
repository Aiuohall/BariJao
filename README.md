# BariJao — Safe Eid Ticket Exchange 🎟️

A community marketplace for safely buying and reselling travel tickets in Bangladesh.
Built with **React + Vite** (frontend) and **Express + TypeScript** (backend).

The app is **self-contained**: with no external configuration it runs on a local
SQLite database, so you can clone and run it immediately. You can optionally switch
to Supabase (Postgres) and add a Google Gemini key for the AI description feature.

## Tech stack
- Frontend: React 19, Vite 6, Tailwind CSS 4, Framer Motion, React Router
- Backend: Express 4, JWT auth, bcrypt, Multer uploads, `tsx` runtime
- Database: SQLite by default (`better-sqlite3`), Supabase optional
- AI: Google Gemini (optional)

## Run locally
```bash
npm install
cp .env.example .env   # optional; defaults work out of the box
npm run dev            # starts API + Vite on http://localhost:3000
```
`npm run dev` runs the Express server with Vite middleware. The frontend is proxied
through the same port, so just open http://localhost:3000.

## Production build / start
```bash
npm run build          # builds the frontend into dist/
NODE_ENV=production npm start
```
In production mode the server serves the built frontend from `dist/` and the API
from the same port (`process.env.PORT`, default 3000).

## Environment variables
All optional — see `.env.example`. Leave Supabase vars empty to use SQLite.

| Variable | Purpose |
|---|---|
| `SUPABASE_URL`, `SUPABASE_KEY` | Use Supabase instead of SQLite |
| `VITE_GOOGLE_AI_API_KEY` / `GEMINI_API_KEY` | Enable the AI description feature |
| `JWT_SECRET` | Secret used to sign login tokens |
| `PORT` | Server port (default 3000) |

## Deploy (Render — free)
This repo includes `render.yaml`, so deployment is one click:
1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint** → select this repo.
3. Render reads `render.yaml`, builds, and deploys. `JWT_SECRET` is auto-generated.
4. (Optional) In the service's **Environment** tab, add `VITE_GOOGLE_AI_API_KEY` for AI,
   or `SUPABASE_URL` / `SUPABASE_KEY` to use Supabase.

> **Note on the free tier:** Render's free instances have an ephemeral filesystem, so
> the SQLite database and uploaded images reset when the service restarts/redeploys.
> For permanent storage, attach a Render persistent disk (paid) or switch to Supabase.

## Notes
- Login uses a one-time code (OTP). There is no email provider wired in, so during
  development the OTP is printed to the **server console** — copy it from there.
- This is a prototype. Before any real-world/public use, add proper email delivery,
  payment escrow, identity verification, and abuse/fraud safeguards.
