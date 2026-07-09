# Website Report: InterviewForge / thinkMern

## 1. Project Overview

**InterviewForge** is a full-stack MERN interview preparation website. The UI branding in the app is **thinkMern**, while the package and backend service use the `mern-interview-prep` / InterviewForge naming.

The website is designed for MERN stack interview preparation with question banks for:

- JavaScript
- React
- Node.js
- DSA

The application provides topic-wise learning, random practice, timed mock interviews, bookmarks, code practice, study plans, and admin tools for adding or editing questions and answers.

## 2. Repository Location

Main app folder:

```text
e:\Brototype\site cursor\mern-interview-prep
```

Important top-level folders:

```text
mern-interview-prep/
├── backend/        # Express, MongoDB, JWT API
├── frontend/       # React, Vite single-page app
├── package.json    # Root scripts for build/start/dev
├── README.md       # Setup and deployment notes
└── render.yaml     # Render deployment blueprint
```

There is also an `extract-temp/` folder in the workspace. It appears to be a separate PDF extraction utility and is not part of the running website.

## 3. Technology Stack

### Frontend

| Area | Technology |
| --- | --- |
| Framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Linting | Oxlint |
| Dev server | Vite, usually `http://localhost:5173` |

Key frontend files:

- `frontend/src/App.jsx` - main app routes
- `frontend/src/api.js` - API client, auth token handling, request cache
- `frontend/src/context/AuthContext.jsx` - authentication state
- `frontend/vite.config.js` - Vite configuration and local API proxy
- `frontend/index.html` - page title and app shell

### Backend

| Area | Technology |
| --- | --- |
| Runtime | Node.js |
| Framework | Express 4 |
| Database | MongoDB |
| ODM | Mongoose 8 |
| Authentication | JWT with `jsonwebtoken` |
| Password hashing | `bcryptjs` |
| Middleware | CORS, Morgan, JSON body parser |
| Default port | `5000` |

Key backend files:

- `backend/src/app.js` - Express app, CORS, boot logic, API mounting
- `backend/src/server.js` - local/production server listener
- `backend/api/index.js` - Vercel serverless API entry
- `backend/src/routes/` - route definitions
- `backend/src/controllers/` - API business logic
- `backend/src/models/` - MongoDB models
- `backend/data/parsed-questions.json` - seeded question data

## 4. Main Features

The website includes the following user-facing features:

| Feature | Description |
| --- | --- |
| Login | Email/password login using JWT authentication |
| Dashboard | Subject cards, counts, progress summaries, and quick navigation |
| Subject pages | Browse interview questions by subject and topic |
| Learn mode | Structured learning flow with learned-question progress |
| Code mode | Code-practice question lists and workspace |
| Code workspace | In-browser JavaScript editor with saved code and completion tracking |
| Study plans | 3, 5, 10, or 15 day plans for study or code practice |
| Random practice | Random single-question practice with answer reveal |
| Mock interview | Timed mock interview mode with random batches |
| Bookmarks | Save and revisit important questions |
| Add question | Create new questions from the UI |
| Admin answers | Bulk/manual answer editing and answer management |

## 5. Frontend Routes

All routes except `/login` are protected by `ProtectedRoute`.

| Route | Purpose |
| --- | --- |
| `/login` | Login page |
| `/` | Home dashboard |
| `/subject/:subject` | Topic-wise questions for one subject |
| `/learn` | Learn mode overview |
| `/learn/:subject` | Learn mode for one subject |
| `/code` | Code practice overview |
| `/code/:subject` | Code questions for one subject |
| `/code/:subject/:id` | Code workspace for one question |
| `/plan` | Study/code plan generator |
| `/practice` | Random practice |
| `/mock` | Timed mock interview |
| `/bookmarks` | Bookmarked questions |
| `/add` | Add new question |
| `/admin` | Admin answer editor |
| `*` | Not found page |

## 6. API Structure

The canonical backend API is mounted under `/api`.

The app also exposes aliases without `/api`:

- `/auth`
- `/questions`
- `/plans`

This helps if the frontend API URL is configured without the `/api` suffix.

### Public Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Basic service information |
| `GET` | `/api/health` | Health check |

### Auth Endpoints

| Method | Endpoint | Auth Required | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | No | Login and receive JWT token |
| `GET` | `/api/auth/me` | Yes | Get current authenticated user |

### Question Endpoints

All `/api/questions` endpoints require JWT authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/questions/subjects` | Get subjects with counts |
| `GET` | `/api/questions/subjects/:subject/topics` | Get topics for a subject |
| `GET` | `/api/questions/stats` | Get global question stats |
| `GET` | `/api/questions/learn/progress` | Get learn-mode progress |
| `GET` | `/api/questions/code/progress` | Get code-mode progress |
| `GET` | `/api/questions/code/topics` | Get code-practice topics |
| `GET` | `/api/questions/code` | Get code-practice questions |
| `GET` | `/api/questions/code/:id` | Get one code-practice question |
| `GET` | `/api/questions/code/:id/saved-code` | Get saved code for a question |
| `PATCH` | `/api/questions/code/:id/completed` | Toggle code-completed status |
| `PUT` | `/api/questions/code/:id/save` | Save code for a question |
| `GET` | `/api/questions/random/batch` | Get random batch for mock mode |
| `GET` | `/api/questions/random` | Get one random question |
| `GET` | `/api/questions` | Get paginated/filtered questions |
| `GET` | `/api/questions/:id` | Get question by ID |
| `POST` | `/api/questions` | Create a question |
| `PUT` | `/api/questions/:id` | Update a question |
| `DELETE` | `/api/questions/:id` | Delete a question |
| `PATCH` | `/api/questions/:id/bookmark` | Toggle bookmark |
| `PATCH` | `/api/questions/:id/mastered` | Toggle mastered |
| `PATCH` | `/api/questions/:id/learned` | Toggle learned |

### Plan Endpoints

All `/api/plans` endpoints require JWT authentication.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/plans/active` | Get active study/code plans |
| `POST` | `/api/plans/start` | Start a new plan |
| `PATCH` | `/api/plans/:id/disable` | Disable a plan |

## 7. Database Models

### Question

Defined in `backend/src/models/Question.js`.

Main fields:

- `subject`
- `topic`
- `topicOrder`
- `question`
- `answer`
- `answerManuallyAdded`
- `keyPoints`
- `difficulty`
- `tags`
- `codeOnly`
- `bookmarked`
- `mastered`
- `learned`
- `codeCompleted`
- `savedCode`
- `savedCodeUpdatedAt`
- `notes`
- `order`

Supported subjects:

- `javascript`
- `react`
- `nodejs`
- `dsa`

The model includes indexes for text search, subject/topic ordering, and code progress queries.

### User

Defined in `backend/src/models/User.js`.

Used for the admin login account. Passwords are hashed with bcrypt before storage.

Main fields:

- `email`
- `password`
- `name`

### Plan

Defined in `backend/src/models/Plan.js`.

Main fields:

- `mode` - `study` or `code`
- `subject`
- `days` - `3`, `5`, `10`, or `15`
- `startDate`
- `endDate`
- `active`
- `totalQuestions`
- `planDays`

Each plan day contains a day number, date, and question IDs.

### Subject

Defined in `backend/src/models/Subject.js`.

Main fields:

- `key`
- `label`
- `color`
- `description`
- `questionCount`
- `topicCount`

## 8. Authentication Flow

The app uses JWT authentication.

1. The backend ensures an admin user exists on boot.
2. The user logs in through `/api/auth/login`.
3. The backend validates the password with bcrypt.
4. The backend returns a JWT and user object.
5. The frontend stores the token in `localStorage`.
6. API requests include `Authorization: Bearer <token>`.
7. Protected routes call `/api/auth/me` to validate the session.
8. If an API request returns `401`, the frontend clears the session and redirects to `/login`.

There is no public registration flow and no role-based access control. Any authenticated user can access the admin and CRUD features.

## 9. Environment Variables

Only variable names are listed here. Do not place real secrets in documentation.

### Backend

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend server port |
| `NODE_ENV` | Runtime environment |
| `SERVE_FRONTEND` | Serve built React app from Express when enabled |
| `MONGO_URI` | MongoDB connection string |
| `CLIENT_URL` | Allowed frontend origin or origins |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES` | JWT expiry duration |
| `ADMIN_EMAIL` | Bootstrap admin email |
| `ADMIN_PASSWORD` | Bootstrap admin password |
| `ADMIN_NAME` | Bootstrap admin display name |
| `SKIP_AUTO_SEED` | Skip auto-seeding on boot |
| `FORCE_SEED` | Force seed in Vercel/serverless mode |
| `VERCEL` | Vercel runtime flag |

### Frontend

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base URL, usually ending in `/api` for deployed backend |

The frontend defaults to `/api` when `VITE_API_URL` is not set.

## 10. Scripts

### Root Scripts

Defined in `package.json`.

| Script | Purpose |
| --- | --- |
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run build` | Install and build frontend, then install backend production dependencies |
| `npm start` | Start backend |
| `npm run seed` | Seed database from backend |
| `npm run server` | Start backend in development mode |
| `npm run client` | Start frontend in development mode |
| `npm run start:backend` | Start backend |
| `npm run start:frontend` | Start frontend dev server |

### Backend Scripts

Defined in `backend/package.json`.

| Script | Purpose |
| --- | --- |
| `npm start` | Run `node src/server.js` |
| `npm run dev` | Run backend with Node watch mode |
| `npm run seed` | Seed database |
| `npm run refresh-answers` | Regenerate or refresh answers |
| `npm run upsert-code-practice` | Upsert code-practice questions |

### Frontend Scripts

Defined in `frontend/package.json`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build production frontend |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview production build |

## 11. Local Development Setup

### Backend

```bash
cd "e:\Brototype\site cursor\mern-interview-prep\backend"
npm install
npm run seed
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### Frontend

Open another terminal:

```bash
cd "e:\Brototype\site cursor\mern-interview-prep\frontend"
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` requests to the backend.

## 12. Deployment

### Render Deployment

The repo includes `render.yaml` for Render.

The Render setup can run as one web service where Express serves both:

- Backend API
- Built React frontend from `frontend/dist`

Important Render environment values:

- `NODE_ENV=production`
- `SERVE_FRONTEND=true`
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CLIENT_URL`

### Vercel Deployment

The README recommends deploying as two Vercel projects:

1. Backend project from `mern-interview-prep/backend`
2. Frontend project from `mern-interview-prep/frontend`

Important Vercel notes:

- The backend uses `backend/api/index.js` as the serverless entry point.
- The frontend should set `VITE_API_URL` to the deployed backend URL ending in `/api`.
- MongoDB should be seeded before deploying because serverless functions may time out while seeding thousands of questions.
- The frontend includes SPA rewrites so refreshing nested routes works.

## 13. Data and Seeding

The backend seed data lives in:

```text
backend/data/parsed-questions.json
```

The app contains approximately 7,135 questions across JavaScript, React, Node.js, and DSA.

The backend boot process connects to MongoDB, ensures the admin user exists, and auto-seeds the database when appropriate.

Auto-seeding can be controlled with:

- `SKIP_AUTO_SEED`
- `FORCE_SEED`

## 14. Security and Production Notes

Important points before production use:

- Use a strong `JWT_SECRET` in production.
- Do not commit `backend/.env` or real MongoDB credentials.
- Rotate credentials if secrets were ever committed or shared.
- Replace default admin credentials with environment-specific credentials.
- Add role-based access control if more than one user will access the app.
- Limit admin routes if the site becomes public.
- Use a strict `CLIENT_URL` in production instead of allowing all origins.
- Ensure MongoDB Atlas network access and database user permissions are configured carefully.

## 15. Current Risks and Gaps

| Risk / Gap | Severity | Details |
| --- | --- | --- |
| Default admin fallback credentials | High | The code/README include default admin credentials. Production must override them. |
| Missing backend env example | Low | README references `backend/.env.example`, but only `frontend/.env.example` was found. |
| README mismatch | Low | README says "no authentication" near the top, but the app now requires JWT login. |
| No role-based access control | Medium | Any authenticated user can access admin and CRUD features. |
| No automated tests found | Medium | No clear unit/integration/e2e test suite was found. |
| Serverless seeding limitation | Medium | Seeding thousands of questions on Vercel can time out, so Atlas should be pre-seeded. |
| Local `.env` present | High | A backend `.env` exists locally. Keep it uncommitted and rotate values if exposed. |

## 16. Recommended Improvements

1. Add `backend/.env.example` with safe placeholder values.
2. Update the README to remove the old "no authentication" statement.
3. Remove or minimize hardcoded default admin credentials.
4. Add role-based access control for admin routes.
5. Add automated tests for auth, question CRUD, plan generation, and frontend route protection.
6. Add deployment checklist documentation.
7. Add CI for linting and builds.
8. Consider moving per-user progress into user-specific collections if multiple users are planned.

## 17. Summary

InterviewForge / thinkMern is a MERN interview-prep platform with a React/Vite frontend and Express/MongoDB backend. It includes protected study, practice, mock interview, code workspace, bookmarks, study plans, and admin management features.

The project is close to deployment-ready for a personal or admin-only interview prep tool. Before production use, the most important work is to secure environment values, replace default credentials, fix the README/env-example mismatch, and add tests or CI checks.
