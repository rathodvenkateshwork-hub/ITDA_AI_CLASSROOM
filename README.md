# Engage Learn Monitor

Project is split into frontend and backend for separate deployment targets.

## Folder Split

```
frontend/   # Vite + React app (deploy to Vercel)
backend/    # Express API server (deploy to Render)
```

## Local Development

1. Install all dependencies (from repo root):

```sh
npm run install:all
```

2. Run frontend:

```sh
npm run dev:frontend
```

3. Run backend:

```sh
npm run dev:backend
```

Frontend default: `http://localhost:5173`  
Backend default: `http://localhost:3001`

## Deployment Targets

- **Frontend (Vercel)**
	- Root Directory: `frontend`
	- Build Command: `npm run build`
	- Output Directory: `dist`
	- Env: `VITE_API_URL=<your-render-backend-url>`

- **Backend (Render)**
	- Root Directory: `backend`
	- Build Command: `npm install`
	- Start Command: `npm start`
	- Env: values from `backend/.env.example`

## Database Note

Backend now uses MongoDB via Mongoose in `backend/server/index.js`.
Configure `MONGODB_URI` and `MONGODB_DB` in `backend/.env`.

### Seed/Migrate SQL exports into MongoDB

From project root:

```sh
npm run seed:sql --prefix backend
```

To reseed from scratch (drops current Mongo DB first):

```sh
npm run seed:sql:drop --prefix backend
```

Notes:
- SQL files are read from `backend/database/*.sql`
- You can pass specific files, e.g.:
	`node scripts/seed-from-sql.mjs --files chapters-topics-syllabus.sql,teacher_effectiveness-table.sql`
