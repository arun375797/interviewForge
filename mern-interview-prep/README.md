# InterviewForge — MERN Interview Prep

A full-stack MERN app built from your four question banks (JS, React, Node.js, DSA) with topic-wise questions, interview-style answers, and full CRUD — no authentication.

## Local setup

```bash
# Backend
cd backend
cp .env.example .env   # set MONGO_URI (include a DB name in the path)
npm install
npm run seed           # optional if DB is empty — server also auto-seeds
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Login

The app requires authentication. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` — the admin account is created on first boot from those values.

Use a strong `JWT_SECRET` (32+ characters) before deploying to production.

## Deploy on Vercel (Frontend + Backend separately)

Vercel works best as **two projects**: one Static/Vite frontend, one Node API.

### 0. Seed MongoDB Atlas first (important)

Vercel serverless functions time out before seeding ~7,000 questions. Seed once from your PC:

```bash
cd backend
# .env must have your Atlas MONGO_URI
npm run seed
```

Also in Atlas → **Network Access** → allow `0.0.0.0/0`.

### 1. Push code to GitHub

Do **not** commit `backend/.env`.

### 2. Deploy the Backend

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your GitHub repo  
2. Configure:

| Setting | Value |
|--------|--------|
| Project name | `interviewforge-api` (any name) |
| Root Directory | `mern-interview-prep/backend` *(or `backend` if that folder is the repo root)* |
| Framework Preset | Other |
| Build Command | leave empty / `echo skip` |
| Output Directory | leave empty |
| Install Command | `npm install` |

3. **Environment Variables** (Production):

| Key | Value |
|-----|--------|
| `MONGO_URI` | `mongodb+srv://.../mern_interview_prep?retryWrites=true&w=majority` |
| `JWT_SECRET` | long random string |
| `JWT_EXPIRES` | `7d` |
| `ADMIN_EMAIL` | your admin email |
| `ADMIN_PASSWORD` | strong password (12+ chars in production) |
| `ADMIN_NAME` | `Admin` |
| `CLIENT_URL` | *(set after frontend deploy — your frontend URL)* |
| `SKIP_AUTO_SEED` | `true` |
| `NODE_ENV` | `production` |

4. Deploy → copy the URL, e.g. `https://interviewforge-api.vercel.app`  
5. Test: open `https://interviewforge-api.vercel.app/api/health` → should show `{ ok: true, ... }`

### 3. Deploy the Frontend

1. **Add New Project** again from the **same repo**  
2. Configure:

| Setting | Value |
|--------|--------|
| Project name | `interviewforge` |
| Root Directory | `mern-interview-prep/frontend` *(or `frontend`)* |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

3. **Environment Variables**:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://interviewforge-api.vercel.app/api` *(your real backend URL + `/api`)* |

4. Deploy → copy frontend URL, e.g. `https://interviewforge.vercel.app`

`frontend/vercel.json` already rewrites all routes to `index.html`, so **refresh on `/practice` etc. will not 404**.

### 4. Connect CORS

Go back to the **backend** project → Settings → Environment Variables → set:

| Key | Value |
|-----|--------|
| `CLIENT_URL` | `https://interviewforge.vercel.app` |

Redeploy the backend (Deployments → … → Redeploy).

### 5. Login

Open the frontend URL → sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your backend env.

---

## Deploy on Render (optional: one Web Service)

This project is set up so **Express serves the React build**. That means:

- One Render URL for both UI and API
- **Refresh on `/subject/react`, `/practice`, etc. works** (SPA fallback)
- Frontend calls `/api/...` on the same origin (no CORS issues)

### 1. MongoDB Atlas

1. Create a free cluster
2. Database Access → user + password
3. Network Access → allow `0.0.0.0/0` (or Render IPs)
4. Connect → Drivers → copy URI and **include a database name**:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/mern_interview_prep?retryWrites=true&w=majority
```

### 2. Push this repo to GitHub

Make sure `.env` is **not** committed (it is in `.gitignore`).

### 3. Create a Web Service on Render

| Setting | Value |
|--------|--------|
| Root Directory | `mern-interview-prep` (if repo root is parent folder) **or** leave blank if this folder is the repo root |
| Runtime | Node |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

**Environment variables:**

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `SERVE_FRONTEND` | `true` |
| `MONGO_URI` | your Atlas URI (with DB name) |
| `JWT_SECRET` | long random string |
| `ADMIN_EMAIL` | your admin email |
| `ADMIN_PASSWORD` | strong password (12+ chars in production) |
| `CLIENT_URL` | *(optional)* leave empty when UI is served from the same service |

On first boot, if the database is empty, the server **auto-seeds** ~7,135 questions (may take 1–2 minutes). Health check still passes because the server listens first.

### 4. Optional: Blueprint

`render.yaml` is included — you can use **Blueprint** deploy from the Render dashboard and set `MONGO_URI` when prompted.

### Two-service option (Static Site + API)

If you prefer separate services:

**API Web Service**

- Root: `backend` (or `mern-interview-prep/backend`)
- Build: `npm install`
- Start: `npm start`
- Env: `NODE_ENV=production`, `MONGO_URI=...`, `CLIENT_URL=https://your-frontend.onrender.com`
- Do **not** set `SERVE_FRONTEND=true`

**Static Site**

- Root: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Env: `VITE_API_URL=https://your-api.onrender.com/api`
- **Redirects / Rewrites:** add a rewrite rule so all routes serve `index.html` (required for refresh):

  - Source: `/*`
  - Destination: `/index.html`
  - Action: Rewrite

## Scripts

| Script | What it does |
|--------|----------------|
| `npm run build` | Install + build frontend, install backend deps |
| `npm start` | Start Express (serves API + `frontend/dist` in production) |
| `npm run seed` | Force re-seed (clears and reloads all questions) |

## Notes

- Never commit real Mongo credentials. Rotate the password if it was ever pushed to git.
- Free Render services spin down when idle; the first request after sleep can be slow.
- Auto-seed runs only when the questions collection is empty.
