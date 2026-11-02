# College OS: Production Deployment Guide ($0 / ₹0 Free-Tier)

**Tenant Target:** Satyug Darshan Institute of Engineering and Technology (`SDIET`)  
**Frontend Platform:** Vercel Hobby (Next.js 15 App Router)  
**Backend Platform:** Vercel Functions (NestJS 10 + Express Adapter)  
**Database:** Neon Serverless PostgreSQL with `pgvector` (Free Tier)  
**Cache / Queues:** Upstash Redis (Free Tier)  
**Object Storage:** Cloudflare R2 (10 GB / Month Free Tier)  
**AI Copilot Model:** Google Gemini 1.5 Flash (Free Tier: 15 RPM / 1M TPM)  
**Monthly Infrastructure Cost:** $0 / ₹0 per month  

---

## 1. Architecture Overview

```
                               ┌────────────────────────────────────────┐
                               │              Browser / User            │
                               └───────────────────┬────────────────────┘
                                                   │
                       ┌───────────────────────────┴───────────────────────────┐
                       │                                                       │
             HTTPS Requests                                        API Calls (JWT)
                       │                                                       │
                       ▼                                                       ▼
        ┌─────────────────────────────┐                         ┌─────────────────────────────┐
        │       Vercel Hobby          │                         │       Vercel Functions      │
        │   Next.js 15 App Router     │                         │      NestJS 10 REST API     │
        │ (college-os.vercel.app)     │                         │ (college-api.vercel.app)    │
        └─────────────────────────────┘                         └──────────────┬──────────────┘
                                                                               │
                                    ┌──────────────────────────────────────────┼──────────────────────────────────┐
                                    │                                          │                                  │
                                    ▼                                          ▼                                  ▼
                     ┌─────────────────────────────┐            ┌─────────────────────────────┐    ┌─────────────────────────────┐
                     │          Neon DB            │            │        Upstash Redis        │    │        Cloudflare R2        │
                     │  PostgreSQL 16 + pgvector   │            │   Serverless Redis (TLS)    │    │   S3-Compatible Storage     │
                     │    Pooled Connection        │            │  Sessions, Rate Limiting    │    │      Documents & Uploads    │
                     └─────────────────────────────┘            └─────────────────────────────┘    └─────────────────────────────┘
```

---

## 2. Free Tier Services Matrix

| Component | Provider | Free Tier Specification | Cost | Configuration Details |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Vercel Hobby | Unlimited deployments, global Edge CDN, auto HTTPS | $0 | Connect GitHub repo, Root Directory: `Frontend` |
| **Backend** | Vercel Functions | 100 GB-hrs compute, 1M invocations/mo, 15s max duration | $0 | Connect GitHub repo, Root Directory: `Backend` |
| **Database** | Neon.tech | 0.5 GB storage, pooled compute, native `pgvector` | $0 | PostgreSQL 16 connection with `?sslmode=require` |
| **Redis** | Upstash | 10,000 requests/day, 256 MB storage, TLS (`rediss://`) | $0 | Serverless Redis for session revoking & throttling |
| **Object Storage**| Cloudflare R2 | 10 GB storage/month, zero egress bandwidth fees | $0 | S3-compatible credentials and bucket |
| **AI LLM** | Google AI Studio | Gemini 1.5 Flash: 15 Requests Per Minute free | $0 | `AI_PROVIDER=gemini` with `GEMINI_API_KEY` |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Provision Free Database (Neon.tech)
1. Sign up for a free account at [neon.tech](https://neon.tech).
2. Create a new project named `college-os`.
3. In the Neon Console SQL Editor, verify `pgvector` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy the **Pooled Connection String** from the Neon dashboard:
   ```
   postgresql://[user]:[password]@[ep-xyz]-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   *(Note: Use the connection string with `-pooler` to ensure serverless functions don't exhaust database connection pools).*

### Step 2: Apply Migrations & Seed Baseline Data
Run migrations from your terminal against the Neon database:
```bash
cd Backend
DATABASE_URL="your-neon-pooled-connection-string" npm run prisma:deploy
DATABASE_URL="your-neon-pooled-connection-string" npm run db:harden
DATABASE_URL="your-neon-pooled-connection-string" SEED_PASSWORD="Admin-Initial-Password-123!" npm run seed
```

### Step 3: Provision Free Redis (Upstash)
1. Sign up for a free account at [upstash.com](https://upstash.com).
2. Create a Redis database named `college-os-redis` in the same region as your Neon database.
3. Copy the **Node.js (ioredis)** connection URL:
   ```
   rediss://default:[password]@[endpoint].upstash.io:6379
   ```

### Step 4: Deploy NestJS Backend to Vercel Functions
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select your `college-os` GitHub repository.
3. Configure project settings:
   - **Project Name:** `college-os-backend`
   - **Framework Preset:** Other
   - **Root Directory:** `Backend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables in Vercel:
   ```env
   NODE_ENV=production
   PORT=3000
   LOG_LEVEL=info
   CORS_ORIGINS=https://college-os-frontend.vercel.app,http://localhost:3000,http://localhost:3001
   DATABASE_URL=postgresql://[user]:[password]@[host]-pooler.neon.tech/neondb?sslmode=require
   REDIS_URL=rediss://default:[password]@[endpoint].upstash.io:6379
   JWT_SECRET=production-secure-random-jwt-secret-minimum-32-chars
   JWT_REFRESH_SECRET=production-secure-random-refresh-secret-minimum-32-chars
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=7d
   THROTTLE_TTL_SECONDS=60
   THROTTLE_LIMIT=120
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key
   STORAGE_DRIVER=local
   ```
5. Click **Deploy**. Vercel will build the NestJS server and deploy `api/index.ts` as a serverless function.
6. Note down your backend URL (e.g. `https://college-os-backend.vercel.app`). Test health at:
   `https://college-os-backend.vercel.app/health`

### Step 5: Deploy Next.js Frontend to Vercel
1. In Vercel, click **Add New Project** again.
2. Select the same `college-os` GitHub repository.
3. Configure project settings:
   - **Project Name:** `college-os-frontend`
   - **Framework Preset:** Next.js
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Add Environment Variables in Vercel:
   ```env
   NEXT_PUBLIC_API_URL=https://college-os-backend.vercel.app/api/v1
   NEXT_PUBLIC_SOCKET_URL=https://college-os-backend.vercel.app
   NEXT_PUBLIC_COLLEGE_NAME="Satyug Darshan Institute of Engineering and Technology"
   NEXT_PUBLIC_COLLEGE_SHORT_CODE="SDIET"
   ```
5. Click **Deploy**.
6. Once deployed, copy your frontend production URL (e.g. `https://college-os-frontend.vercel.app`).
7. Update the `CORS_ORIGINS` variable in your Backend Vercel project to include this exact frontend URL!

---

## 4. Local Development Setup

To run locally with Docker:
```bash
# 1. Start database & cache
cd Backend
docker-compose up -d

# 2. Configure Backend environment
cp .env.example .env

# 3. Setup database & seed
npm run prisma:generate
npm run prisma:migrate
npm run seed

# 4. Start NestJS
npm run start:dev

# 5. In another terminal, start Next.js
cd ../Frontend
npm run dev -- -p 3001
```
Access points:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000/api/v1`
- Swagger Docs: `http://localhost:3000/docs`
- Health Checks: `http://localhost:3000/health`

---

## 5. Security & Authentication Configuration

- **Tokens:** Access token lives in client state for Authorization Bearer headers (expires in 15 minutes).
- **Refresh Token Rotation:** Handled automatically when access tokens expire.
- **Data Protection:** Passwords hashed with bcryptjs (salt rounds 10).
- **Multi-Tenancy:** Strictly scoped by `collegeId` and `collegeCode` (`SDIET`).
- **Headers:** Helmet enabled for secure headers (`X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options`).
- **Rate Limiting:** Managed via NestJS Throttler backed by Redis / in-memory window.

---

## 6. Troubleshooting & Operational Runbook

### Issue: CORS origin rejected
- **Symptom:** `Access-Control-Allow-Origin` error in browser console.
- **Fix:** Ensure the exact Frontend Vercel URL (e.g. `https://college-os-frontend.vercel.app`, without trailing slash) is included in the Backend Vercel project's `CORS_ORIGINS` environment variable. Redeploy backend after updating.

### Issue: Database connection timeouts on serverless cold starts
- **Symptom:** `PrismaClientInitializationError: Can't reach database server`.
- **Fix:** Ensure you are using Neon's **pooled** connection string (contains `-pooler` in the hostname) and append `?sslmode=require&connect_timeout=15`.

### Issue: Function duration exceeds Hobby limit
- **Symptom:** Vercel deployment fails with `maxDuration: 60 exceeds 15s limit`.
- **Fix:** Keep `maxDuration: 15` in `Backend/vercel.json`.

---

## 7. Rollback Strategy

1. **Frontend Rollback:** In the Vercel Dashboard, select **Deployments**, locate the last known working deployment, click the three-dots menu, and choose **Instant Rollback**.
2. **Backend Rollback:** Same procedure in Vercel for the backend function.
3. **Database Migrations:** Schema migrations are backward-compatible. In the rare event of a database rollback:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```
