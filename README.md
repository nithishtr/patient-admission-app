# Ward Desk – Patient Admission Management App

A web app for hospital staff to manage admitted patients: add, view, search, filter, edit, discharge and delete.
Built for the DScribe (Unriddle Technologies) Software Engineer Intern – Round 1 task.

**Live app:** `<PASTE FRONTEND URL>`
**Backend API:** `<PASTE BACKEND URL>/api/patients`

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 (Vite) – plain CSS, responsive for mobile / tablet / desktop |
| Backend | Java 17, Spring Boot 3 (Web, Data JPA, Validation) |
| Database | H2 file database locally, PostgreSQL in production (data persists across restarts) |

## Features

1. Add a patient  2. List all patients  3. Filter by ward, department, doctor  4. Search by name
5. Edit  6. Delete (with confirmation dialog)  7. Mark as Discharged  8. Responsive design (table on desktop, cards on mobile)

## Validation (frontend **and** backend)

| Field | Rule |
|---|---|
| Name | Required, letters only (spaces between words allowed) |
| Age | Required, whole number 0–120 |
| Gender, Ward, Department, Doctor | Required, must be a value from the list |
| Admission date | Required, cannot be in the future |

The backend returns `400` with a clear message, e.g.

```json
{ "message": "Name must contain letters only; Age must be between 0 and 120",
  "errors": { "name": "Name must contain letters only", "age": "Age must be between 0 and 120" } }
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/options` | Dropdown lists (genders, wards, departments, doctors) |
| GET | `/api/patients?search=&ward=&department=&doctor=` | List / search / filter |
| POST | `/api/patients` | Add patient |
| PUT | `/api/patients/{id}` | Edit patient |
| PATCH | `/api/patients/{id}/discharge` | Mark as Discharged |
| DELETE | `/api/patients/{id}` | Delete patient |

## Run locally

Requirements: Java 17+, Maven 3.9+, Node 18+.

```bash
# 1. Backend  (http://localhost:8080)
cd backend
mvn spring-boot:run

# 2. Frontend (http://localhost:5173) – in a second terminal
cd frontend
npm install
npm run dev
```

Locally the backend stores data in `backend/data/` (H2 file DB), so records survive restarts.
The Vite dev server proxies `/api` to port 8080, so no extra config is needed.

## Environment variables (no secrets are committed)

**Backend:** `DB_URL`, `DB_USER`, `DB_PASSWORD` (omit for local H2), `CORS_ORIGINS` (frontend URL), `PORT`
**Frontend:** `VITE_API_URL` (backend URL, build-time)

## Deployment (free tiers)

1. **Database – Neon (Postgres):** create a project; note host, db, user, password.
2. **Backend – Render:** New Web Service → this repo → Root Directory `backend`, Runtime *Docker*. Env vars:
   `DB_URL=jdbc:postgresql://<host>/<db>?sslmode=require`, `DB_USER`, `DB_PASSWORD`, `CORS_ORIGINS=https://<your-frontend-url>`.
3. **Frontend – Vercel/Netlify:** Root Directory `frontend`, build `npm run build`, output `dist`, env `VITE_API_URL=https://<your-render-url>`.

Note: Render's free tier sleeps when idle, so the first request after a pause can take ~30–60 s.

## Screenshots

| Desktop | Mobile |
|---|---|
| ![Desktop](screenshots/desktop.png) | ![Mobile](screenshots/mobile.png) |

## Project structure

```
backend/   Spring Boot API (controller, entity, repository, validation, error handler)
frontend/  React app (App.jsx, api.js, styles.css)
```
