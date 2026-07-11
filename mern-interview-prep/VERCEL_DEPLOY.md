# Host InterviewForge on Vercel

Use **two Vercel projects** from the same GitHub repo.

## Before you start

1. MongoDB Atlas ready (URI includes `/mern_interview_prep`)
2. Atlas Network Access allows `0.0.0.0/0`
3. Seed data from your PC (Vercel cannot seed 7k questions in time):

```bash
cd backend
npm install
npm run seed
```

4. Code pushed to GitHub (no `.env` file)

---

## A) Backend API

1. Vercel → **Add New… → Project** → select repo  
2. **Root Directory** → `mern-interview-prep/backend`  
3. Framework: **Other**  
4. Build Command: empty  
5. Install: `npm install`  
6. Env vars:

```
MONGO_URI=mongodb+srv://USER:PASS@cluster.../mern_interview_prep?retryWrites=true&w=majority
JWT_SECRET=generate-a-long-random-secret-at-least-32-characters
JWT_EXPIRES=7d
ADMIN_EMAIL=your-admin@example.com
ADMIN_PASSWORD=choose-a-strong-password-12chars-min
ADMIN_NAME=Admin
ADMIN_EMAILS=your-admin@example.com
SKIP_AUTO_SEED=true
NODE_ENV=production
CLIENT_URL=https://YOUR-FRONTEND.vercel.app
```

7. Deploy  
8. Open `https://YOUR-API.vercel.app/api/health` — must return `ok: true`

---

## B) Frontend

1. Vercel → **Add New… → Project** → same repo  
2. **Root Directory** → `mern-interview-prep/frontend`  
3. Framework: **Vite**  
4. Build: `npm run build`  
5. Output: `dist`  
6. Env var:

```
VITE_API_URL=https://YOUR-API.vercel.app/api
```

7. Deploy  
8. Copy frontend URL, e.g. `https://YOUR-APP.vercel.app`

SPA refresh is handled by `frontend/vercel.json` (rewrite → `index.html`).

---

## C) Finish CORS

In the **backend** project, set:

```
CLIENT_URL=https://YOUR-APP.vercel.app
```

Redeploy backend.

---

## D) Use the app

1. Open frontend URL  
2. Login with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your backend env vars.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Frontend loads but API fails | Check `VITE_API_URL` ends with `/api` and redeploy frontend |
| CORS error in browser | Set `CLIENT_URL` on backend to exact frontend origin, redeploy API |
| 401 on every request | Login again; JWT may be missing |
| Empty questions | Run `npm run seed` locally against Atlas |
| Refresh 404 on frontend | Confirm `frontend/vercel.json` is deployed |
| API 500 | Check Vercel function logs + `MONGO_URI` |
