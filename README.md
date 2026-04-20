# ReviewPulse — Shopify Google Review Automation App

Automatically send Google Review request emails after each fulfilled order.

## Architecture

```
reviewpulse/
├── backend/      Node.js + Express + Prisma + PostgreSQL  → Railway
└── frontend/     React + Shopify Polaris + App Bridge      → Vercel
```

---

## Setup Guide

### 1. Shopify Partner App

1. Go to [partners.shopify.com](https://partners.shopify.com) → Apps → Create app
2. Set **App URL**: `https://your-backend.railway.app`
3. Set **Allowed redirection URLs**: `https://your-backend.railway.app/auth/callback`
4. Copy your **API key** and **API secret key**
5. Set **Scopes** (in configuration): `read_orders, read_customers`

### 2. Stripe Setup

1. Create a product in Stripe Dashboard: **ReviewPulse Pro** → $15/month recurring
2. Copy the **Price ID** (`price_xxx`)
3. Create a webhook endpoint: `https://your-backend.railway.app/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy the **Webhook signing secret** (`whsec_xxx`)

### 3. Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key
4. Set `RESEND_FROM_EMAIL` to `noreply@yourdomain.com`

### 4. Railway (Backend)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

cd backend
railway init   # create new project
railway add    # add PostgreSQL plugin

# Set environment variables in Railway dashboard or:
railway variables set SHOPIFY_API_KEY=...
railway variables set SHOPIFY_API_SECRET=...
# ... (see .env.example for full list)

npm install
railway up
```

After deploy, run migrations:
```bash
railway run npx prisma migrate deploy
```

### 5. Vercel (Frontend)

```bash
npm install -g vercel
cd frontend
npm install

# Set environment variables in Vercel dashboard:
# VITE_SHOPIFY_API_KEY = your API key
# VITE_API_URL = https://your-backend.railway.app

vercel --prod
```

---

## Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npx prisma db push     # sync schema to local DB
npm run dev            # starts on :3001

# Terminal 2 — Frontend
cd frontend
cp .env.example .env
npm install
npm run dev            # starts on :3000
```

Use [ngrok](https://ngrok.com) to expose local backend for Shopify webhooks:
```bash
ngrok http 3001
# Update HOST= in backend/.env with the ngrok URL
```

---

## How It Works

```
Shopify order fulfilled
        │
        ▼
POST /webhooks/orders-fulfilled
        │  Creates ReviewRequest (status=pending, pendingAt=now+delay)
        ▼
Cron job (every 2 min)
        │  Finds pending requests where pendingAt <= now
        │  Shop must have: isActive, googleReviewUrl, active/trialing subscription
        ▼
Resend API → customer email with tracking link
        │
        ▼
Customer clicks link → GET /track/click/:id
        │  Updates status to "clicked", redirects to Google Review URL
        ▼
Google Review page
```

---

## Database Schema

| Model | Key fields |
|-------|-----------|
| `Shop` | shopDomain, accessToken, googleReviewUrl, emailDelay |
| `ReviewRequest` | orderId, customerEmail, pendingAt, status (pending/sent/clicked/bounced) |
| `Subscription` | stripeCustomerId, stripeSubscriptionId, status |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/begin?shop=` | — | Start OAuth flow |
| GET | `/auth/callback` | — | OAuth callback |
| POST | `/webhooks/orders-fulfilled` | HMAC | Order fulfilled hook |
| POST | `/webhooks/app-uninstalled` | HMAC | App uninstall hook |
| GET | `/api/shop` | JWT | Get shop settings |
| PUT | `/api/shop` | JWT | Update shop settings |
| GET | `/api/review-requests` | JWT | List review requests |
| GET | `/api/analytics` | JWT | Stats + daily chart |
| POST | `/billing/create-checkout` | JWT | Stripe checkout |
| POST | `/billing/portal` | JWT | Stripe portal |
| POST | `/billing/webhook` | Stripe sig | Stripe events |
| GET | `/track/click/:id` | — | Click tracking + redirect |
| GET | `/health` | — | Health check |
