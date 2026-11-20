# WorkCrew — Centralized Workforce Management Platform

WorkCrew is a production-oriented, mobile-first workforce management platform engineered for organizations employing field workers across multiple physical project sites and decentralized operational units.

---

## 1. High-Level Architecture

WorkCrew unifies three discrete, role-governed portals into a single responsive application:
1. **Admin Console** (`/admin/*`) — Full organizational control: roster management, team structures, geofenced job sites, attendance governance, analytics, and audit logging.
2. **Team Leader Portal** (`/leader/*`) — Field operational dispatch: manage assigned team rosters, register field workers, dispatch multi-step work orders, monitor active jobs, and verify manual/GPS attendance.
3. **Worker Mobile App** (`/worker/*`) — 4-tab mobile-first interface (`Home`, `My Work`, `Attendance`, `Profile`): live interactive GPS geofenced punch clock, job schedule directions, task completion notes, and leave applications.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          WORKCREW FRONTEND                             │
│       React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons       │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│   Admin Console (/admin) │ Leader Portal (/leader)  │ Worker (/worker) │
└──────────────────────────┴──────────────────────────┴──────────────────┘
                                   │ HTTP/REST API
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          WORKCREW BACKEND                              │
│                Node.js + Express.js + TypeScript REST API              │
├────────────────────────────────────────────────────────────────────────┤
│ • Auth & Role Authorization Middleware                                 │
│ • Monotonic Worker ID Generator (`WC-YYYY-001`)                        │
│ • GPS Geofence Engine (Haversine formula + accuracy buffer)            │
│ • Dual Data Driver: Dual Firestore / Local JSON Persistence Engine     │
│ • Immutable Attendance Audit Event Log                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. GPS Geofence Engine

WorkCrew implements an authoritative server-side GPS validation engine:
1. When a worker taps **Check In (GPS)**, the browser captures their coordinates (`latitude`, `longitude`, `accuracy`).
2. The coordinates are securely sent to the backend endpoint `POST /api/attendance/check-in`.
3. The server resolves the assigned location's coordinates and configured geofence radius (e.g. 100 meters).
4. The server calculates the exact geodesic distance using the **Haversine formula**:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
5. If $d \le \text{radius} + \min(\text{accuracy} \times 0.2, 20\text{m})$, attendance is confirmed with `verificationStatus: 'VERIFIED'`. If outside, the record is stored as `verificationStatus: 'FLAGGED'` with distance evidence preserved for team leader audit.
6. A test simulator slider is provided directly in the worker interface for instant demo testing inside/outside the geofence without requiring physical transit!

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Lucide React, PWA Manifest + Service Worker.
- **Backend**: Node.js, Express 5, TypeScript (`tsx`), Firebase Admin SDK, Zod, UUID, CORS, Dotenv.
- **Database Architecture**: Firestore schema design with local JSON persistence engine (`server/data/store.json`).
- **Timezone**: Default `Asia/Kolkata` (configurable in settings).

---

## 4. Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
From the project root:
```bash
# 1. Install root dependencies
npm install

# 2. Install server dependencies
cd server
npm install
cd ..

# 3. Install client dependencies
cd client
npm install
cd ..
```

### Running the Application
To run both backend API (Port 5000) and frontend client (Port 3000) concurrently:
```bash
npm run dev
```

Visit the frontend in your browser:
**`http://localhost:3000`**

---

## 5. Pre-Seeded Pilot Accounts

The application includes realistic seed records and a top **Role Switcher Toolbar** for instant testing:

| Persona | Name | Role | Email / Identifier | Credentials |
|---|---|---|---|---|
| **Organization Administrator** | Rajesh Sharma | `ADMIN` | `admin@workcrew.com` | `password123` |
| **Team Leader** | Vikram Malhotra | `TEAM_LEADER` | `leader1@workcrew.com` | `password123` |
| **Field Worker** | Amit Kumar | `WORKER` | `+91 98765 43210` | `password123` |

You can either sign in with these credentials on the Login screen or use the one-click persona buttons on the Login page and the top role switcher toolbar!

---

## 6. End-to-End Acceptance Tests

An automated test suite validates all 18 acceptance criteria specified in Section 21:
```bash
npm test
```

Tests executed:
- `TEST 1`: Admin creates team leader
- `TEST 2 & 3`: Team leader registers worker with unique `WC-YYYY-001` ID
- `TEST 4`: Team leader creates team and manages roster
- `TEST 5`: Team leader configures geofenced work location
- `TEST 6`: Team leader dispatches work assignment to team
- `TEST 7 & 8`: Worker sees assigned job on mobile Home screen
- `TEST 9 & 10`: Worker GPS check-in validates geofence and creates verified record
- `TEST 11`: Team leader audits attendance
- `TEST 12`: Team leader records manual attendance with audit reason
- `TEST 13 & 14`: Worker checks out and system computes working duration
- `TEST 15`: Admin views organization-wide reports
- `TEST 16`: Unauthorized worker cannot access admin or leader routes
- `TEST 17`: Team leader cannot access teams outside authorized scope
- `TEST 18`: Attendance corrections preserve original records and audit trail
