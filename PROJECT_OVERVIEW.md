# NBAC Report — Project Overview

> **Purpose of this document:** A comprehensive briefing so any LLM can immediately understand this codebase — its goals, architecture, data models, business logic, APIs, and how to run it.

---

## 1. What Is This Project?

**NBAC** stands for **NBA Accreditation** (National Board of Accreditation). This is a full-stack web application built to help engineering colleges automate the **OBE (Outcome-Based Education)** workflow required for NBA accreditation.

### Core Problem It Solves
Engineering colleges in India must submit detailed OBE reports to the NBA for accreditation. These reports require:
- Defining **Course Outcomes (COs)** for each course
- Mapping COs to **Program Outcomes (POs)** via a CO-PO matrix
- Recording student marks per assessment type
- Collecting student feedback
- Calculating **CO Attainment** (direct + indirect) and **PO Attainment**
- Generating a final **NAAC/NBA report** with attainment levels and grades

This platform automates all of the above, end-to-end.

---

## 2. Tech Stack

### Backend (`nbac-backend/`)
| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js 4.x |
| Database | MongoDB (via Mongoose 8.x) |
| Auth | JWT (access: 15 min, refresh: 7 days) |
| Password Hash | bcryptjs (12 salt rounds) |
| Validation | express-validator |
| File Uploads | Multer (Excel files) |
| Excel Parsing | xlsx library |
| Entry Point | `server.js` → `app.js` |

### Frontend (`nbac-frontend/`)
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| State Management | Zustand |
| Data Fetching | TanStack React Query + Axios |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Dev port | `localhost:3000` |

---

## 3. Project Structure

```
NBAC-Report-main/
├── nbac-backend/              # Express + MongoDB REST API
│   ├── server.js              # Entry point (starts Express server)
│   ├── app.js                 # Middleware, route mounting
│   ├── .env                   # Environment variables (MongoDB URI, JWT secrets)
│   ├── seed.js                # Seeds database with demo data
│   ├── models/                # Mongoose schemas (7 models)
│   │   ├── User.model.js
│   │   ├── Course.model.js
│   │   ├── CourseOutcome.model.js
│   │   ├── POMatrix.model.js
│   │   ├── Marks.model.js
│   │   ├── Feedback.model.js
│   │   └── Attainment.model.js
│   ├── controllers/           # Route handlers (9 controllers)
│   ├── routes/                # Express routers (9 route files)
│   ├── services/
│   │   └── attainment.service.js   # Core attainment calculation logic
│   ├── middleware/            # Auth, error handling, validation
│   ├── utils/                 # Helpers (response, token, etc.)
│   └── config/                # Grading schema config
│
├── nbac-frontend/             # Next.js frontend
│   └── src/
│       ├── app/               # Next.js App Router pages
│       │   ├── login/         # Login page
│       │   ├── admin/         # Admin role pages
│       │   │   ├── dashboard/
│       │   │   ├── courses/
│       │   │   ├── users/
│       │   │   └── reports/
│       │   ├── faculty/       # Faculty role pages
│       │   │   ├── dashboard/
│       │   │   └── courses/   # CO management, marks upload, feedback, matrix
│       │   └── student/       # Student role pages
│       ├── components/        # Shared UI components
│       │   ├── layout/        # Sidebar, navbar, shell
│       │   ├── charts/        # Recharts wrappers
│       │   ├── shared/        # Reusable form components
│       │   └── ui/            # shadcn/ui base components (48 files)
│       ├── api/               # Frontend API client functions (Axios)
│       ├── store/             # Zustand state stores
│       ├── hooks/             # Custom React hooks
│       └── lib/               # Utility functions
│
├── NBAC_API_Documentation.md  # Complete API reference (all endpoints)
├── attainment-methodology.md  # Step-by-step attainment calculation logic
├── implementation_steps.md    # How to run the project locally
└── PROJECT_OVERVIEW.md        # This file
```

---

## 4. User Roles & Access Control

There are **3 roles**, each with distinct permissions:

| Role | Access |
|---|---|
| **Admin** | Full system access — manage users, all courses, view all reports |
| **Faculty** | Manage their own courses — define COs, upload marks, set CO-PO matrix, view attainment |
| **Student** | View enrolled courses, submit feedback on COs |

### Default Login Credentials (from seed data)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@nbac.edu` | `admin123` |
| Faculty | (seeded faculty email) | `faculty123` |
| Student | (seeded student email) | `student123` |

---

## 5. Database Models (MongoDB / Mongoose)

### `User`
Fields: `name`, `email`, `password` (hashed), `role` (admin/faculty/student), `department`, `year` (students), `section` (students), `rollNumber` (students), `isActive`, `isApproved`, `refreshToken`

### `Course`
Fields: `courseCode`, `courseName`, `department`, `semester` (1–8), `academicYear` (YYYY-YY format), `facultyId` (ref User), `enrolledStudents` (array of User refs), `credits`, `description`, `isActive`

### `CourseOutcome` (CO)
Fields: `courseId` (ref Course), `coNumber` (CO1, CO2…), `coCode`, `description`, `bloomsLevel` (Remember/Understand/Apply/Analyze/Evaluate/Create), `createdBy` (ref User)

### `POMatrix` (CO-PO Mapping)
Fields: `courseId`, `coId`, `poMappings` (object `{ PO1: 0–3, PO2: 0–3, … PO12: 0–3 }`)
- Correlation values: `0` = no mapping, `1` = low, `2` = medium, `3` = high

### `Marks`
Fields: `courseId`, `studentId`, `assessmentType` (Internal1/Internal2/Assignment/External), `questions` (array of `{ questionNumber, coId, marksObtained, maxMarks }`), `uploadedBy`, `uploadedAt`

### `Feedback`
Two types stored:
1. **CO Feedback** — student rates each CO on 1–5 scale per course
2. **Infrastructure Feedback** — student rates Library/Transport/Canteen facilities

### `Attainment`
Cached calculation result per course:
- `coAttainments`: array of `{ coId, successPercentage, directAttainment, indirectAttainment, finalAttainment }`
- `poAttainments`: array of `{ poNumber, attainmentValue }`
- `overallAttainmentPercentage`, `naacGrade`
- `calculatedAt`, `calculatedBy`

---

## 6. Core Business Logic — Attainment Calculation

This is the heart of the system. All logic lives in `nbac-backend/services/attainment.service.js`.

### Step 1: Success % per CO (from Marks)
```
studentCOScore% = (marksObtained / maxMarks) × 100
A student attains a CO if their score ≥ 60% (threshold)
successPercentage = (studentsWhoAttained / totalStudents) × 100
```

### Step 2: Direct Attainment Level
```
successPercentage ≥ 70%  →  Direct Attainment = 3
successPercentage ≥ 60%  →  Direct Attainment = 2
successPercentage ≥ 50%  →  Direct Attainment = 1
successPercentage < 50%  →  Direct Attainment = 0
```

### Step 3: Indirect Attainment Level (from Student Feedback)
Students rate each CO 1–5. Average is normalized:
```
averageRating ≥ 4.5  →  Indirect Attainment = 3
averageRating ≥ 3.5  →  Indirect Attainment = 2
averageRating ≥ 2.5  →  Indirect Attainment = 1
averageRating < 2.5  →  Indirect Attainment = 0
```

### Step 4: Final CO Attainment (Weighted)
```
Final CO Attainment = (0.75 × Direct) + (0.25 × Indirect)
```
Direct assessment (marks) = 75% weight; Indirect (feedback) = 25% weight.

### Step 5: PO Attainment (from CO-PO Matrix)
```
PO Attainment = Σ(CO Attainment × correlation) / Σ(correlations)
```
If no COs map to a PO → `attainmentValue = null`.

### Step 6: NAAC Grade
```
overallAttainmentPercentage = (averageCOAttainment / 3) × 100
```
| % | Grade |
|---|---|
| ≥ 90% | A++ |
| ≥ 85% | A+ |
| ≥ 80% | A |
| ≥ 75% | B++ |
| ≥ 70% | B+ |
| ≥ 60% | B |
| ≥ 0% | C |

---

## 7. API Summary

**Base URL:** `http://localhost:5000/api`  
**Auth:** JWT Bearer Token in `Authorization` header  
**Content-Type:** `application/json`

| Module | Base Path | Key Operations |
|---|---|---|
| Authentication | `/api/auth` | Register, Login, Logout, Refresh Token, Get/Update Profile |
| Users | `/api/users` | CRUD users, restore, reset password, get unenrolled students |
| Courses | `/api/courses` | CRUD courses, enroll/unenroll students, activate/deactivate |
| Course Outcomes | `/api/co` | CRUD COs per course |
| CO-PO Matrix | `/api/matrix` | Set/update/get CO-PO correlation matrix |
| Marks | `/api/marks` | Upload marks (Excel), manual entry, view by course/student |
| Feedback | `/api/feedback` | Submit/view CO feedback, infrastructure feedback |
| Attainment | `/api/attainment` | Calculate attainment, get results per course |
| Reports | `/api/reports` | Generate NBA/NAAC report for a course |

> Full detailed API docs (request/response examples for every endpoint) are in `NBAC_API_Documentation.md`.

---

## 8. Frontend Pages & Navigation

### Admin Pages
- `/admin/dashboard` — Overview stats (total users, courses, departments)
- `/admin/users` — Manage all users (create, edit, deactivate)
- `/admin/courses` — View/manage all courses across departments
- `/admin/reports` — Generate and download NAAC reports

### Faculty Pages
- `/faculty/dashboard` — Summary of own courses with attainment status
- `/faculty/courses` — List of own courses
- `/faculty/courses/[id]` — Course detail with sub-sections:
  - **CO Management** — Define/edit Course Outcomes
  - **CO-PO Matrix** — Set correlation (0–3) for each CO-PO pair
  - **Marks Upload** — Upload Excel files or enter marks manually
  - **Feedback** — View student feedback ratings per CO
  - **Attainment** — Calculate and view CO/PO attainment results

### Student Pages
- `/student/courses` — View enrolled courses
- `/student/courses/[id]` — View marks, submit CO feedback

### Common
- `/login` — Unified login for all roles (role-based redirect after login)

---

## 9. Environment Configuration

**Backend** `.env` (located at `nbac-backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=<MongoDB Atlas connection string>
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12
MAX_FILE_SIZE_MB=5
UPLOAD_DIR=uploads
```

---

## 10. How to Run Locally

```bash
# 1. Start Backend
cd nbac-backend
npm install
node server.js        # Runs on http://localhost:5000

# 2. Start Frontend (new terminal)
cd nbac-frontend
npm install
npm run dev           # Runs on http://localhost:3000

# 3. Open browser → http://localhost:3000
# Login as: admin@nbac.edu / admin123
```

Optionally seed the database with demo data:
```bash
cd nbac-backend
node seed.js
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| JWT with short-lived access tokens (15 min) | Security — limits exposure if token is stolen |
| Refresh token stored in DB | Allows server-side invalidation (logout) |
| Soft delete for users | Data preservation — deactivate rather than hard delete |
| Attainment cached in `Attainment` collection | Avoid recalculating expensive aggregations on every request |
| Excel upload for marks | Matches faculty workflow — they already maintain Excel grade sheets |
| 75/25 direct/indirect split | Follows standard NBA OBE guidelines |
| Correlation 0–3 in CO-PO matrix | Matches NBA standard 3-level scale (None/Low/Medium/High) |

---

## 12. Edge Cases and Warnings the System Handles

| Scenario | Behavior |
|---|---|
| No marks mapped to a CO | `successPercentage = 0`, warning generated |
| No feedback submitted | `indirectAttainment = 0`, no penalty |
| < 5 feedback responses | Warning about statistical insignificance |
| `maxMarks = 0` (division by zero) | Skipped gracefully |
| PO with no CO mapping | `attainmentValue = null` |
| Duplicate infrastructure rating | Unique index → 409 Conflict returned |
| Missing grading config | Falls back to "C" grade |

---

*This document was auto-generated from the codebase for handoff purposes.*
