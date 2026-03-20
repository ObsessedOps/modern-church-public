# Modern.Church — Public Demo

Live demo of the **Modern.Church** church operations intelligence platform.

> AI-powered engagement insights, attendance intelligence, and ministry automation for church leaders.

## What's in the demo

- **Dashboard** — KPIs, attendance trends, giving charts, alert feed, activity log
- **Grace AI** — Church intelligence assistant (static demo conversation)
- **People** — Member profiles, engagement scores, life events, family mapping
- **Groups** — Small group management with health scores
- **Giving** — Fund tracking, donor analytics, trend visualization
- **Volunteers** — Team management, burnout risk indicators
- **Alerts** — AI-detected engagement, giving, and attendance anomalies
- **Growth Track** — Discipleship pipeline (Connect → Discover → Serve)
- **Staff & RBAC** — Role-based access control with bitfield permissions
- **Multi-campus** — Campus comparison and per-campus filtering
- **Integrations** — PCO, Stripe, Mailchimp, Twilio connection management

All data is synthetic. Write operations are disabled. No real AI API calls are made.

## Stack

- **Next.js 14** (App Router, Server Components)
- **Prisma** + PostgreSQL
- **NextAuth.js v5** (bypassed in demo mode)
- **Tailwind CSS** with dark mode
- **Recharts** for data visualization
- **Zustand** for client state
- **Zod** for validation

## Deploy on Railway

1. Create a new project on [Railway](https://railway.com)
2. Add a **PostgreSQL** service
3. Add a **GitHub** service pointing to this repo
4. Set environment variables:
   - `DATABASE_URL` — from the Railway Postgres service
   - `AUTH_SECRET` — any random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your Railway deployment URL
5. Run initial setup: `npm run db:setup`

Build command: `npm run build`
Start command: `npm run start`

## Local development

```bash
cp .env.example .env
# Edit .env with your local Postgres connection string
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## License

Proprietary — Modern.Church by ObsessedOps. Demo provided for evaluation purposes.
