⚡ QuickAI — AI-Powered SaaS Platform

Most developers never ship their ideas. I did.

QuickAI is a full-stack AI SaaS platform built solo on the PERN stack — featuring an AI article writer, blog title generator, image background remover, user dashboard, community gallery, and subscription billing. All deployed. All live. All built by me.
🔗 Live Demo → quick-ai-client-opal.vercel.app

🔥 Features

AI Article Writer — Generate full-length articles on any topic with customizable length
Blog Title Generator — SEO-friendly titles by keyword and category in seconds
Background Remover — Remove image backgrounds instantly using AI
User Dashboard — Track and manage every creation you've made
Community Gallery — Browse and like publicly published creations
Subscription Billing — Free vs Premium plans powered by Clerk billing
JWT-Secured REST API — Every protected route is locked behind auth middleware


⚡ Tech Stack
LayerTechnologyFrontendReact.js, Vite, Tailwind CSSBackendNode.js, Express.jsDatabasePostgreSQL (Neon Serverless)Auth & PaymentsClerk (authentication + subscription billing)Image StorageCloudinaryDeploymentVercel (client + server, decoupled)Version ControlGitHub

🏗️ Architecture
┌─────────────────────────────────┐
│     React + Vite (Vercel)       │  ← Frontend
│  Tailwind · Clerk · Axios       │
└────────────┬────────────────────┘
             │ REST API calls
┌────────────▼────────────────────┐
│   Express.js API (Vercel)       │  ← Backend
│  CORS · Auth · Rate Limiting    │
│  Zod Validation · Error Handler │
└──────┬──────────────┬───────────┘
       │              │
┌──────▼──────┐ ┌─────▼──────────┐
│  PostgreSQL  │ │   Cloudinary   │  ← Data & Storage
│    (Neon)    │ │  Image Store   │
└─────────────┘ └────────────────┘

📁 Project Structure
quickai/
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Dashboard, WriteArticle, etc.
│   │   ├── lib/
│   │   │   └── axiosInstance.js  # Centralized axios config
│   │   └── main.jsx
│   └── vite.config.js
│
└── server/                   # Express backend
    ├── config/
    │   ├── db.js             # Neon PostgreSQL connection
    │   └── cloudinary.js
    ├── controllers/
    │   ├── userController.js
    │   └── aiController.js
    ├── middleware/
    │   └── auth.js           # JWT + Clerk auth middleware
    ├── routes/
    │   ├── userRoute.js
    │   └── aiRoutes.js
    ├── server.js             # Express app entry point
    └── vercel.json

🚀 Getting Started
Prerequisites

Node.js 18+
PostgreSQL database (Neon recommended)
Clerk account
Cloudinary account

1. Clone the repo
bashgit clone https://github.com/yourusername/quickai.git
cd quickai
2. Setup the server
bashcd server
npm install
Create a .env file in /server:
envDATABASE_URL=your_neon_postgres_url
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
bashnpm run dev
3. Setup the client
bashcd client
npm install
Create a .env file in /client:
envVITE_BASE_URL=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
bashnpm run dev

🔐 Auth & Middleware Flow
Every protected API request passes through this chain:
Request → CORS → Rate Limiter → Auth (Clerk/JWT) → Route Handler → Error Handler

CORS handles preflight OPTIONS requests before Clerk runs
Auth middleware skips OPTIONS requests automatically
Global error handler catches all thrown errors and returns clean JSON


🌐 Deployment
Both client and server are deployed independently on Vercel.
ProjectURLFrontendquick-ai-client-opal.vercel.appBackendquick-ai-server-omega-neon.vercel.app
Key deployment lessons learned the hard way:

Always bypass OPTIONS preflight in auth middleware — it silently blocks every request
Never use axios.defaults.baseURL in multiple files — centralize it in one instance
Vercel env variables require a full redeploy to take effect
A single syntax error in server.js crashes your entire deployment with no helpful message


💡 What I Learned Building This

It's not the features that take the longest. It's the invisible stuff — CORS policies, environment variables, serverless cold starts, broken deployments, and syntax errors that crash everything silently.


Decoupled frontend/backend deployment on Vercel with serverless functions
CORS preflight handling with Express middleware ordering
Clerk integration for both authentication and subscription billing
Neon serverless PostgreSQL with connection pooling
Centralized Axios configuration for multi-environment deployments


🗺️ Roadmap

 Add AI image generation feature
 Add usage analytics per user
 TypeScript migration (backend)
 Add Redis caching for AI responses
 Mobile app (React Native)


📬 Connect
Built by Muhammad Afzaal Hassan

LinkedIn → linkedin.com/in/afzaalhassan
Email → muhammadafzaalhassan51@gmail.com



If you're waiting until you're "ready" to build your SaaS idea — you'll wait forever.
Start ugly. Ship fast. Learn everything.

⭐ Star this repo if it inspired you to build something!
