# AFCIS — Academic Feedback & Continuous Improvement System

Role-based system for managing academic feedback and continuous improvement across Students, Faculty, Department Admins, and System Admins.

- Frontend: React 18 (CRA), Material UI, React Router, Chart.js/Recharts, xlsx
- Backend: Node.js/Express, MongoDB (Mongoose), JWT, bcryptjs, multer, express-validator, cors

## Features

- **Students**
  - View active feedback forms for enrolled sections
  - Submit feedback and view submission history
- **Faculty**
  - Create and manage feedback forms (lecture/unit/semester)
  - View responses and analytics; create action items with evidence
- **Department Admin**
  - Manage courses, offerings, faculty assignments
  - Department-wide analytics, performance, and insights
- **System Admin**
  - User management (CRUD, bulk creation via Excel)
  - Global configuration and system-wide analytics

## Monorepo Structure

```
AFCIS/
├─ backend/                 # Express API
│  ├─ config/               # Database config
│  ├─ controllers/          # Request handlers
│  ├─ middleware/           # Auth & error middleware
│  ├─ models/               # Mongoose schemas
│  ├─ routes/               # API routes
│  ├─ utils/                # Seed/ensure admin helpers
│  ├─ API_DOCUMENTATION.md  # Detailed API docs
│  ├─ package.json
│  └─ server.js
├─ src/                     # React app
│  ├─ components/
│  ├─ context/              # Auth context
│  ├─ pages/
│  ├─ services/             # API service layer
│  ├─ App.js
│  └─ index.js
├─ package.json             # CRA scripts
├─ start.ps1                # Windows quick-start
└─ README.md
```

## Prerequisites

- Node.js v14+ (v16+ recommended)
- npm
- MongoDB running locally on default port (or a URI you provide)

## Setup

1) Start MongoDB

```powershell
mongod
```

2) Backend setup

```powershell
# From repo root
cd backend

# Install dependencies
npm install

# Create backend .env (see "Environment Variables" below)
# Seed database (WARNING: this clears existing data)
npm run seed

# Start backend (nodemon)
npm run dev
```

Backend runs at http://localhost:5000

3) Frontend setup

```powershell
# In a new terminal, from repo root
npm install
npm start
```

Frontend runs at http://localhost:3000

Alternatively, use the quick-start script on Windows:

```powershell
.\start.ps1
```

This will check MongoDB, install deps, seed, start backend and frontend, and open the app.

## Environment Variables

Create a `.env` file in `backend/`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stack_hack_db
JWT_SECRET=change_me_in_production
JWT_EXPIRE=7d
NODE_ENV=development

# CORS: comma-separated allowed origins
CLIENT_URL=http://localhost:3000

# System Admin credentials enforced at server startup
SYSTEM_ADMIN_EMAIL=admin@vignan.ac.in
SYSTEM_ADMIN_PASSWORD=admin@123
```

Create a `.env` in repo root (frontend):

```
REACT_APP_API_URL=http://localhost:5000/api
```

Notes:
- `CLIENT_URL` accepts a comma-separated list if you run multiple frontends.
- `SYSTEM_ADMIN_*` ensures the admin account is present/updated on each server start.
- The seed script also creates a system admin but `ensureAdmin` will standardize credentials to env values on server start. Prefer setting env to avoid confusion.

## Seeding and Default Admin

- `npm run seed` (in `backend/`) clears all collections and creates ONLY a System Admin.
- On server start, the app ensures/updates System Admin using `SYSTEM_ADMIN_EMAIL` and `SYSTEM_ADMIN_PASSWORD`.
- Additional users (students, faculty, dept admins) should be created via the Admin UI (Bulk User Creation) using the Excel template.

## How It Works

- Auth: JWT in `Authorization: Bearer <token>`
- Frontend stores token in `localStorage` and sends it via `src/services/api.js`
- Protected routes and role checks handled in `AuthContext` and `App.js`
- Health check: `GET http://localhost:5000/api/health`

## Common Scripts

- Root (frontend)
  - `npm start` — start React dev server
  - `npm run build` — production build
- Backend
  - `npm run dev` — start API with nodemon
  - `npm run start` — start API with node
  - `npm run seed` — reset DB and seed System Admin

## API

See full API reference in `backend/API_DOCUMENTATION.md`.

Key route mounts:
- `/api/auth` — login, register, profile, change-password
- `/api/users` — users, bulk creation, toggles
- `/api/courses` — courses, offerings, assignments
- `/api/feedback` — forms, responses, analytics
- `/api/feedback/department` — dept analytics and admin operations
- `/api/announcements` — post/ack/archive announcements
- `/api` — action items (`/actions`), insights (`/insights`), notifications

## Troubleshooting

- MongoDB connection errors
  - Ensure `mongod` is running and `MONGODB_URI` is correct.
- CORS issues
  - Set `CLIENT_URL` to include your frontend origin(s) (comma-separated).
- Login fails
  - Confirm backend is running and DB was seeded.
  - Ensure `JWT_SECRET` is set.
- Ports in use
  - Backend default: 5000, Frontend default: 3000 (CRA can auto-switch).

## Security Notes

- Change all default secrets and admin credentials for any non-local environment.
- Seed script clears existing data. Do not run in production.

## License

Add your preferred license (e.g., MIT) in a `LICENSE` file.
