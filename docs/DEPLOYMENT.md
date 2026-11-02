# College OS: Deployment & Operations Guide

## 1. Local Development Setup

### Prerequisites
- Node.js >= 20.x (Recommended: Node 20 LTS or Node 22/24)
- PostgreSQL with `pgvector` extension enabled (or Docker Compose)
- Redis server >= 7.x (or Docker Compose)

### 1. Start Infrastructure via Docker Compose
From the repository root or `Backend/` directory:
```bash
cd Backend
docker-compose up -d
```
This boots:
- PostgreSQL on port `5432` with `vector` extension
- Redis on port `6379`

### 2. Configure Backend Environment
Copy the example configuration:
```bash
cp Backend/.env.example Backend/.env
```
Ensure database connection is set:
```env
DATABASE_URL=postgresql://college:college@localhost:5432/college_os?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=Dev-Jwt-Secret-Min-32-Characters-Long!
JWT_REFRESH_SECRET=Dev-Refresh-Secret-Min-32-Characters-Long!
PORT=3000
CORS_ORIGINS=http://localhost:3001,http://localhost:5173
```

### 3. Run Migrations & Seed Sample College
```bash
cd Backend
npm run prisma:generate
npm run prisma:migrate
SEED_PASSWORD='Dev-Passw0rd-123' npm run seed
```
This generates the Prisma client, runs schema migrations, and populates the database with the `SDIET` demo college, user accounts, and test scenarios.

### 4. Start the NestJS Backend
```bash
cd Backend
npm run start:dev
```
The API is available at `http://localhost:3000/api/v1`.  
Swagger documentation is available at `http://localhost:3000/docs`.

### 5. Start the Next.js Frontend
```bash
cd Frontend
npm run dev -- -p 3001
```
The frontend web application is available at `http://localhost:3001`.

---

## 2. Environment Variables Matrix

| Variable | Target | Type | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Frontend | Client-Safe | Base URL of NestJS API (default: `http://localhost:3000/api/v1`) |
| `NEXT_PUBLIC_SOCKET_URL` | Frontend | Client-Safe | Socket.IO server URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_COLLEGE_NAME` | Frontend | Client-Safe | Official institutional name displayed in header |
| `NEXT_PUBLIC_COLLEGE_SHORT_CODE`| Frontend | Client-Safe | Institutional tenant code (default: `SDIET`) |
| `PORT` | Backend | Server-Only | Port for NestJS HTTP server (default: `3000`) |
| `NODE_ENV` | Backend | Server-Only | Environment (`development` \| `production` \| `test`) |
| `DATABASE_URL` | Backend | Server-Only | PostgreSQL connection string with pgvector |
| `REDIS_URL` | Backend | Server-Only | Redis connection string for sessions and BullMQ |
| `JWT_SECRET` | Backend | Server-Only | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | Backend | Server-Only | Secret key for rotating refresh tokens |
| `JWT_ACCESS_TTL` | Backend | Server-Only | Access token expiration (default: `15m`) |
| `JWT_REFRESH_TTL` | Backend | Server-Only | Refresh token expiration (default: `7d`) |
| `CORS_ORIGINS` | Backend | Server-Only | Comma-separated list of permitted web origins |
| `AI_PROVIDER` | Backend | Server-Only | `openai` \| `gemini` \| `openrouter` \| `local` |
| `OPENAI_API_KEY` | Backend | Server-Only | OpenAI API key (when using OpenAI) |
| `GEMINI_API_KEY` | Backend | Server-Only | Google Gemini API key (when using Gemini) |
| `STORAGE_DRIVER` | Backend | Server-Only | `local` \| `s3` \| `r2` |
| `S3_BUCKET` | Backend | Server-Only | S3/R2 storage bucket name |

---

## 3. Production Deployment Topology ($0 / ₹0 Free-Tier)

A zero-cost, serverless deployment topology using permanent free tiers:

### Frontend: Next.js 15 on Vercel Hobby
- Platform: Vercel Hobby ($0/mo)
- Build Command: `npm run build`
- Output Directory: `.next`
- Environment Variables:
  - `NEXT_PUBLIC_API_URL=https://college-os-backend.vercel.app/api/v1`
  - `NEXT_PUBLIC_SOCKET_URL=https://college-os-backend.vercel.app`
  - `NEXT_PUBLIC_COLLEGE_NAME="Satyug Darshan Institute of Engineering and Technology"`
  - `NEXT_PUBLIC_COLLEGE_SHORT_CODE="SDIET"`

### Backend: NestJS 10 on Vercel Functions
- Platform: Vercel Functions Hobby ($0/mo)
- Entrypoint: `Backend/api/index.ts`
- Configuration: `Backend/vercel.json` (`maxDuration: 15`, memory: 1024)
- Health Probes: `GET /health` and `GET /health/ready`

### Database: Neon Serverless PostgreSQL
- Platform: Neon.tech Free Tier ($0/mo)
- Storage: 0.5 GB with native `pgvector`
- Connection: Pooled connection string (`-pooler.neon.tech?sslmode=require`)

### Redis: Upstash Serverless Redis
- Platform: Upstash Free Tier ($0/mo)
- Limit: 10,000 requests/day with TLS (`rediss://`)

### AI Copilot: Google Gemini 1.5 Flash
- Platform: Google AI Studio Free Tier ($0/mo)
- Limit: 15 RPM / 1M TPM (`AI_PROVIDER=gemini`)
