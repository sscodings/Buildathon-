# SevaConnect Backend

REST API for the SevaConnect NGO-Volunteer platform.

## Tech Stack
- **Node.js / Express** — server
- **MongoDB / Mongoose** — database
- **JWT** — authentication
- **bcryptjs** — password hashing
- **Zod** — request validation

---

## Setup

```bash
npm install
cp .env.example .env     # fill in MONGO_URI and JWT_SECRET
npm run dev              # runs with nodemon on port 3000
```

---

## Environment Variables

| Variable     | Description                       |
|--------------|-----------------------------------|
| `PORT`       | Server port (default: 3000)       |
| `MONGO_URI`  | MongoDB connection string         |
| `JWT_SECRET` | Secret for signing JWTs           |

---

## API Reference

Base URL: `http://localhost:3000`

### Auth headers
Protected routes require:
```
Authorization: Bearer <token>
```

---

### User (Volunteer) Routes — `/user`

#### POST `/user/signup`
Register a new volunteer.
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "Secret123",
  "phone": "9876543210",
  "bio": "Passionate about education",
  "skills": ["Teaching", "Communication"]
}
```
**Response:**
```json
{
  "token": "...",
  "user": { "id": "...", "name": "Priya Sharma", "email": "...", "role": "volunteer" }
}
```

#### POST `/user/login`
```json
{ "email": "priya@example.com", "password": "Secret123" }
```

#### GET `/user/all`
Public feed of open needs. Optional query: `?search=teaching`

#### POST `/user/apply/:needId` 🔒 (volunteer)
Apply to a need. No body required.

#### GET `/user/my-applications` 🔒 (volunteer)
Returns all applications for the logged-in volunteer.
```json
[
  {
    "need": { "_id": "...", "title": "...", "category": "...", "organisation": { "name": "..." } },
    "status": "pending",
    "appliedAt": "2025-04-01T..."
  }
]
```

---

### Organisation (NGO) Routes — `/organisation`

#### POST `/organisation/signup`
```json
{
  "name": "Green Earth NGO",
  "email": "contact@greenearth.org",
  "password": "Secure123",
  "phone": "9876543210",
  "description": "Environmental conservation NGO",
  "registrationNumber": "MH-2021-NGO-1234",
  "type": "Environment"
}
```
**Response:**
```json
{
  "token": "...",
  "organization": { "id": "...", "name": "Green Earth NGO", "email": "...", "role": "Organisation" }
}
```

#### POST `/organisation/login`
```json
{ "email": "contact@greenearth.org", "password": "Secure123" }
```

#### POST `/organisation/create` 🔒 (org)
Post a new volunteer need.
```json
{
  "title": "Tree Plantation Drive",
  "description": "Help us plant 500 saplings in Pune.",
  "category": "Volunteer",
  "location": { "city": "Pune", "state": "Maharashtra" },
  "skillsRequired": ["Physical fitness"],
  "requiredCount": 20,
  "deadline": "2025-06-30"
}
```

#### GET `/organisation/my-needs` 🔒 (org)
Returns all needs posted by the organisation, with full applicant details populated.

#### POST `/organisation/needs/:needId/applicant/:userId` 🔒 (org)
Accept or reject an applicant.
```json
{ "status": "accepted" }   // or "rejected"
```

#### PATCH `/organisation/needs/:needId/status` 🔒 (org)
Open or close a need.
```json
{ "status": "Closed" }   // or "Open"
```

---

## Bug Fixes vs Original Backend

| # | Issue | Fix |
|---|-------|-----|
| 1 | Route prefix was `/organistaion` (typo) | Fixed to `/organisation` to match frontend |
| 2 | JWT signed with `userId` key but decoded with `req.userId = decoded.userId` | Normalised to `id` key throughout |
| 3 | Organisation login required phone + registrationNumber — frontend only sends email/password | Login now only matches on email + password |
| 4 | Passwords stored in plain text | All passwords hashed with bcryptjs |
| 5 | `GET /user/all` used `authenticate` middleware (blocks unauthenticated explore) | Made public (no auth required) |
| 6 | `GET /user/my-applications` endpoint missing entirely | Added with proper response shape |
| 7 | No role-aware middleware — any JWT holder could call org-only routes | `authenticateOrg` and `authenticateUser` middlewares added |
| 8 | Organisation signup response had no `role` field | Added `role: "Organisation"` to match `session.js` |
| 9 | Hardcoded MongoDB URI and JWT secret in source | Moved to `.env` via dotenv |
| 10 | No error handler or 404 fallback | Added global error handler in server.js |
