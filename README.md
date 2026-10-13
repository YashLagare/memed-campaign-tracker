# Meme’d Campaign Payout Tracker

A full-stack creator marketplace web application built for the **SDE I Technical Assessment**. Meme'd enables brands to launch creator campaigns on Instagram and YouTube with customizable milestone ladders, while creators submit posts and earn automated, incremental payouts strictly constrained by campaign budget caps.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript (Strict Mode), Tailwind CSS, Lucide Icons, React Hook Form, Zod
- **Backend:** Node.js, Express.js, TypeScript (Strict Mode), MongoDB Atlas, Mongoose, JWT, bcryptjs, Zod
- **Testing:** Jest, ts-jest, Supertest
- **Deployment:** Single Vercel Project (Frontend via Next.js + Backend via Vercel Serverless Functions)

---

## 📂 Repository Structure

```text
memed-campaign-tracker/
├── frontend/             # Next.js App Router application
├── backend/              # Express REST API, Mongoose models, and services
│   ├── src/
│   │   ├── config/       # MongoDB connection and environment configuration
│   │   ├── controllers/  # Route controller handlers
│   │   ├── middleware/   # JWT auth, role validation, error handlers
│   │   ├── models/       # Mongoose schemas (User, Campaign, Submission)
│   │   ├── routes/       # Express route definitions
│   │   ├── services/     # Core business logic & payout calculation engine
│   │   └── utils/        # Monetary conversion, validation helpers
│   └── tests/            # Automated Jest unit tests
├── .env.example          # Sample environment variables
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- MongoDB Atlas cluster connection string

### Environment Configuration

Copy `.env.example` to `.env` in both `backend` and `frontend` folders:

```bash
# In backend/.env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# In frontend/.env.local
NEXT_PUBLIC_API_URL=/api
```

---

## 🧪 Testing

Run the automated Jest unit test suite:

```bash
npm test
```
