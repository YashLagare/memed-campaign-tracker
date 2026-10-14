# Meme’d Campaign Payout Tracker

A full-stack creator marketplace web application built for the **SDE I Technical Assessment**. Meme'd enables brands to launch creator campaigns on Instagram and YouTube with customizable milestone ladders, while creators submit content links and earn automated, incremental payouts strictly constrained by campaign budget caps.

- **Public GitHub Repository:** [https://github.com/YashLagare/memed-campaign-tracker.git](https://github.com/YashLagare/memed-campaign-tracker.git)
- **Deployment Strategy:** Single Vercel Project (Next.js App Router Frontend + Express Serverless API + MongoDB Atlas)

---

## Table of Contents

1. [Architectural Overview](#architectural-overview)
2. [Technology Stack](#technology-stack)
3. [Repository Structure](#repository-structure)
4. [Milestone Payout Engine & Core Business Rules](#milestone-payout-engine--core-business-rules)
5. [Business Assumptions & Edge Case Decisions](#business-assumptions--edge-case-decisions)
6. [API Documentation](#api-documentation)
7. [Authentication & Authorization](#authentication--authorization)
8. [Local Development & Setup](#local-development--setup)
9. [Automated Jest Testing](#automated-jest-testing)
10. [Single Vercel Deployment Guide](#single-vercel-deployment-guide)
11. [Known Limitations](#known-limitations)

---

## 1. Architectural Overview

The application is architected as a clean monorepo separating frontend and backend logic while deploying cohesively to **one public Vercel URL**:

```text
                                  User Browser
                                       │
                                       ▼
                       Vercel Unified Public Deployment
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
         Next.js Frontend                              Express REST API
    (App Router, SSR, UI)                         (Vercel Serverless Function)
                │                                             │
                │        /api/* Rewrites                      │
                └────────────────────────────────────────────►│
                                                              │
                                                              ▼
                                                        MongoDB Atlas
                                                     (Mongoose ODM Pool)
```

- **Client Requests:** Client routes (`/`, `/brand`, `/creator`, `/login`, `/signup`) are served statically/SSR by Next.js.
- **API Requests:** Requests to `/api/*` are handled by the serverless Express API bridge (`/api/index.ts`).
- **Data Persistence:** Reusable cached Mongoose connections prevent connection pool exhaustion during serverless cold/warm execution.
- **Monetary Precision:** All internal financial values are stored as integers in **paise** ($1\text{ INR} = 100\text{ paise}$) to avoid floating-point rounding errors.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI & State:** React 19, Context API
- **Styling:** Tailwind CSS, PostCSS
- **Icons:** Lucide React
- **Language:** TypeScript (Strict Mode)

### Backend
- **Runtime:** Node.js (v20+ / v22+)
- **Server:** Express.js (v4.21)
- **Database:** MongoDB Atlas with Mongoose (v8.13)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Validation:** Zod (v3.24)
- **Testing:** Jest, ts-jest

### Deployment
- **Platform:** Vercel (Unified project hosting both Next.js and Serverless Express)
- **Database:** MongoDB Atlas (Cloud M0 / Shared tier)

---

## 3. Repository Structure

```text
memed-campaign-tracker/
├── api/
│   └── index.ts                 # Vercel serverless function entrypoint (delegates to Express)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts      # Serverless cached Mongoose connection manager
│   │   ├── controllers/         # Express controller handlers (auth, campaign, submission)
│   │   ├── middleware/          # JWT auth, role guard, db connection check
│   │   ├── models/              # Mongoose schemas (User, Campaign, Submission)
│   │   ├── routes/              # Express route declarations (/auth, /campaigns, /submissions, /creators)
│   │   ├── services/            # Core business logic & payout calculation engine
│   │   ├── utils/               # Auth helpers, currency conversion (paise/rupees)
│   │   ├── validators/          # Zod schema validators
│   │   ├── app.ts               # Configured Express application
│   │   ├── server.ts            # Local standalone server entrypoint
│   │   └── serverless.ts        # Serverless export for cloud execution
│   ├── tests/
│   │   └── payout.engine.test.ts # Comprehensive Jest unit test suite (15 mandatory test cases)
│   ├── jest.config.js
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Role-aware login and signup pages
│   │   │   ├── brand/           # Brand campaign management console
│   │   │   ├── creator/         # Creator browse, submit, & interactive view simulator
│   │   │   ├── globals.css      # Tailwind base styles
│   │   │   ├── layout.tsx       # Root layout with AuthProvider & Navbar
│   │   │   └── page.tsx         # Landing page with interactive milestone visualizer
│   │   ├── components/          # Navbar, AuthGuard
│   │   ├── lib/                 # apiClient, AuthContext & state management
│   │   └── types/
│   ├── next.config.js           # API proxy rewrites for local dev
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
├── .env.example                 # Root environment variables guide
├── .gitignore                   # Excludes node_modules, .env, .next, dist
├── package.json                 # Monorepo scripts (dev, build, test)
├── vercel.json                  # Unified Vercel serverless build and routing specification
└── README.md
```

---

## 4. Milestone Payout Engine & Core Business Rules

The payout engine (`backend/src/services/payout.engine.ts`) is implemented as a pure, deterministic TypeScript module:

### Milestone Ladder Logic
A milestone ladder specifies view thresholds and rewards:
```json
[
  { "views": 10000, "payout": 500 },
  { "views": 50000, "payout": 2000 },
  { "views": 100000, "payout": 5000 }
]
```

- **Highest Milestone Earned:** A post receives the payout corresponding to the **highest milestone tier crossed**. Milestones are **never summed**.
  - $5,000\text{ views} \rightarrow ₹0$
  - $10,000\text{ views} \rightarrow ₹500$
  - $30,000\text{ views} \rightarrow ₹500$
  - $50,000\text{ views} \rightarrow ₹2,000$
  - $100,000\text{ views} \rightarrow ₹5,000$

### Incremental Payout Formula
When view counts rise, the engine calculates the difference between newly qualified milestone rewards and previously credited earnings:
$$\text{additionalPayout} = \max(0, \text{milestonePayout} - \text{previouslyCreditedPayout})$$

If the view count does not cross a new milestone, $\text{additionalPayout} = 0$.

### Strict Campaign Budget Protection
A campaign must never exceed its allocated budget:
$$\text{budgetSpent} \le \text{totalBudget}$$

---

## 5. Business Assumptions & Edge Case Decisions

| Ambiguous Scenario | Implementation Decision | Rationale |
| :--- | :--- | :--- |
| **Multiple Milestones Jumped in One Update** | Credited with the highest milestone payout crossed minus previously credited payout. | Fairly awards the creator without requiring sequential telemetry updates. |
| **Repeated View Update** | Zero additional payout ($\text{additionalPayout} = 0$). Status returned: `NO_NEW_MILESTONE`. | Ensures idempotency and completely eliminates double-crediting. |
| **Decreasing View Count** | HTTP `400 Bad Request` rejection. | Social media view counters are strictly monotonically non-decreasing. |
| **Insufficient Remaining Budget** | **All-or-Nothing Policy:** If $\text{remainingBudget} < \text{additionalPayout}$, zero additional payout is credited ($\text{additionalPayout} = 0$). Post views update, but credited payout and campaign budget spent remain intact. Status: `INSUFFICIENT_BUDGET`. | Protects brands from unauthorized overspending and prevents indeterminate partial liability. |
| **Duplicate Post Submissions** | A post URL cannot be submitted more than once to the same campaign (enforced via Mongoose compound unique index `{ campaignId: 1, postUrl: 1 }`). | Prevents duplicate reward tracking for identical content pieces. |
| **View Endpoint Authorization** | `PATCH /api/submissions/:id/views` is public (no user role check required). | Strictly satisfies the assignment PDF specification modeling third-party webhooks/crawlers. |

---

## 6. API Documentation

### Base URL
- **Local:** `http://localhost:5000/api` (or proxied via `http://localhost:3000/api`)
- **Production:** `https://<your-vercel-domain>/api`

### Health Check
- `GET /api/health`: Service liveness check.

---

### Authentication

#### Register Account
`POST /api/auth/signup`
```json
{
  "name": "Yash Lagare",
  "email": "yash@example.com",
  "password": "securepassword123",
  "role": "brand" // or "creator"
}
```
**Response (201 Created):**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "6750...",
    "name": "Yash Lagare",
    "email": "yash@example.com",
    "role": "brand"
  }
}
```

#### User Login
`POST /api/auth/login`
```json
{
  "email": "yash@example.com",
  "password": "securepassword123"
}
```

#### Current User Profile
`GET /api/auth/me`  
*Header:* `Authorization: Bearer <token>`

---

### Brand Campaigns

#### Create Campaign (Brand only)
`POST /api/campaigns`  
*Header:* `Authorization: Bearer <token>`
```json
{
  "name": "Summer Tech Drops 2026",
  "platform": "Instagram",
  "totalBudget": 50000,
  "milestones": [
    { "views": 10000, "payout": 500 },
    { "views": 50000, "payout": 2000 },
    { "views": 100000, "payout": 5000 }
  ]
}
```

#### Browse Live Campaigns (Public / Creators)
`GET /api/campaigns`

#### Brand's Own Campaigns (Brand only)
`GET /api/campaigns/mine`  
*Header:* `Authorization: Bearer <token>`

#### Campaign Details
`GET /api/campaigns/:id`

---

### Creator Submissions & Payouts

#### Submit Post Link (Creator only)
`POST /api/submissions`  
*Header:* `Authorization: Bearer <token>`
```json
{
  "campaignId": "6750...",
  "postUrl": "https://www.instagram.com/p/DB123456789/"
}
```

#### Creator's Submissions (Creator only)
`GET /api/submissions/mine`  
*Header:* `Authorization: Bearer <token>`

#### Creator Total Earnings (Creator only)
`GET /api/creators/earnings`  
*Header:* `Authorization: Bearer <token>`

#### Update Post Views (Simulated Webhook / Crawler — No Role Check)
`PATCH /api/submissions/:id/views`
```json
{
  "views": 50000
}
```
**Response (200 OK):**
```json
{
  "message": "Milestone of 50,000 views reached. Additional payout credited.",
  "submissionId": "6750...",
  "views": 50000,
  "previousViews": 10000,
  "earnedMilestonePayoutRupees": 2000,
  "additionalPayoutCreditedRupees": 1500,
  "totalCreditedPayoutRupees": 2000,
  "campaignBudgetSpentRupees": 2000,
  "campaignRemainingBudgetRupees": 48000,
  "status": "CREDITED",
  "highestMilestoneViews": 50000
}
```

---

## 7. Authentication & Authorization

- JWT tokens are signed using `HS256` with environment variable `JWT_SECRET`.
- Passwords are salted and hashed using `bcryptjs` with 10 salt rounds.
- Role-based authorization middleware (`requireRole('brand')` and `requireRole('creator')`) strictly guards restricted actions.
- Client-side `AuthGuard` redirects unauthenticated or unauthorized users dynamically to their respective portals.

---

## 8. Local Development & Setup

### 1. Clone Repository
```bash
git clone https://github.com/YashLagare/memed-campaign-tracker.git
cd memed-campaign-tracker
```

### 2. Configure Environment Variables
Create `.env` inside `backend/` and `.env.local` inside `frontend/`:

**`backend/.env`:**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secure_jwt_secret_min_32_characters
JWT_EXPIRES_IN=7d
```

**`frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=/api
```

### 3. Install Dependencies
```bash
# In repository root:
npm run install:all
```

### 4. Start Local Development
```bash
npm run dev
```
- Frontend runs at: `http://localhost:3000`
- Backend API runs at: `http://localhost:5000`
- Next.js rewrites `/api/*` requests to the Express server seamlessly.

---

## 9. Automated Jest Testing

The test suite thoroughly exercises all 15 required unit test cases in `backend/tests/payout.engine.test.ts`.

### Run Test Suite
```bash
npm test
```

### Verified Test Cases
```text
PASS tests/payout.engine.test.ts
  Milestone Payout Engine & Budget Cap Protection
    √ Case 1: Views below first milestone yield zero payout
    √ Case 2: Views exactly at first milestone yield first milestone payout
    √ Case 3: Views between milestones yield highest milestone reached (not next tier)
    √ Case 4: Views at second milestone yield second milestone payout
    √ Case 5: Views above highest milestone yield highest tier payout
    √ Case 6: Crossing multiple milestones in a single update pays highest crossed milestone
    √ Case 7: Incremental payout pays difference between new milestone and previously credited
    √ Case 8: Repeated view update results in zero additional payout
    √ Case 9: View count increases within same milestone tier yields zero additional payout
    √ Case 10: Sufficient remaining budget allows full incremental payout
    √ Case 11: Insufficient remaining budget blocks payout without partial credit (all-or-nothing)
    √ Case 12: Budget exactly equal to required payout credits full amount and reaches zero remaining
    √ Case 13: Budget spent can never exceed total budget across repeated calls
    √ Case 14: Invalid view counts are strictly rejected
    √ Case 15: Invalid milestone configurations are detected and rejected
```

---

## 10. Single Vercel Deployment Guide

To deploy the entire application to Vercel under **one single URL**:

1. Push code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import the `memed-campaign-tracker` repository.
4. Keep the **Root Directory** as `.` (root).
5. In **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI
   - `JWT_SECRET`: A secure random 32+ character string
   - `JWT_EXPIRES_IN`: `7d`
   - `NEXT_PUBLIC_API_URL`: `/api`
6. Click **Deploy**. Vercel will compile both the Next.js frontend and Express Serverless API automatically!

---

## 11. Known Limitations

- **Simulated Crawler Data:** Real Instagram Graph API and YouTube Data API v3 integrations are not enabled. View telemetry is simulated via `PATCH /api/submissions/:id/views` as instructed by the assessment brief.
- **Concurrent Updates:** In high-concurrency environments with rapid simultaneous updates to the same campaign, distributed locking or Redis atomic transactions would further harden budget depletion.

---

## 👨‍💻 Author

- **Candidate:** Yash Lagare
- **Portfolio:** [https://portfolio-five-opal-53.vercel.app/](https://portfolio-five-opal-53.vercel.app/)
- **Repository:** [https://github.com/YashLagare/memed-campaign-tracker](https://github.com/YashLagare/memed-campaign-tracker)
