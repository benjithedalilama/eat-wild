# Deploying Eat Wild to Vercel

## Prerequisites

1. Vercel account
2. PostgreSQL database (Vercel Postgres, Supabase, or Neon)
3. Stripe account with webhook endpoint configured
4. Resend account with API key

## Step-by-Step Deployment

### 1. Set Up PostgreSQL Database

**Option A: Vercel Postgres (Recommended)**
- Go to your Vercel dashboard
- Navigate to Storage → Create Database → Postgres
- Copy the connection string

**Option B: Supabase**
- Create a project at https://supabase.com
- Go to Project Settings → Database
- Copy the connection string (Connection Pooling recommended)

**Option C: Neon**
- Create a project at https://neon.tech
- Copy the connection string

### 2. Deploy to Vercel

#### Via Vercel CLI:
```bash
npm i -g vercel
vercel
```

#### Via GitHub:
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel will auto-detect Next.js

### 3. Configure Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Resend
RESEND_API_KEY=re_your_api_key_here

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Important:** Use your **live** Stripe keys for production, not test keys.

### 4. Set Up Production Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter webhook URL: `https://your-domain.vercel.app/api/webhook`
4. Select event: `checkout.session.completed`
5. Click "Add endpoint"
6. Click "Reveal" under "Signing secret"
7. Copy the `whsec_` secret and add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

### 5. Initialize Production Database

After first deployment, you need to push the schema and seed the database:

```bash
# Set your production DATABASE_URL locally
export DATABASE_URL="postgresql://..."

# Push schema to production database
npx prisma db push

# Seed the database with the SF Mussels event
npm run seed
```

Or use Vercel's terminal:
1. Go to your project on Vercel
2. Click on the deployment
3. Click "..." → "Redeploy" → Check "Use existing Build Cache"

### 6. Configure Custom Domain (Optional)

1. Go to your Vercel project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Update Stripe webhook URL to use custom domain

### 7. Update Resend Email Domain (Optional)

For production, configure a custom email domain:

1. Go to https://resend.com/domains
2. Add your domain
3. Add DNS records
4. Update `app/api/webhook/route.ts`:
   ```typescript
   from: 'Eat Wild <bookings@yourdomain.com>'
   ```

### 8. Switch to Live Stripe Keys

When ready to accept real payments:

1. Get live keys from https://dashboard.stripe.com/apikeys
2. Update `STRIPE_SECRET_KEY` in Vercel with live key (starts with `sk_live_`)
3. Create new webhook endpoint in Stripe using live mode
4. Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

## Database Migration Notes

**Local Development (SQLite):**
- Update `.env.local`: `DATABASE_URL="file:./dev.db"`
- Update `prisma/schema.prisma`: `provider = "sqlite"`
- Run: `npx prisma db push`

**Production (PostgreSQL):**
- Schema is already set for PostgreSQL
- Vercel uses `DATABASE_URL` from environment variables

## Troubleshooting

**Build fails with Prisma error:**
- Make sure `postinstall` script runs: `"postinstall": "prisma generate"`
- Check DATABASE_URL is set in Vercel environment variables

**Webhooks not working:**
- Verify `STRIPE_WEBHOOK_SECRET` matches your production webhook
- Check webhook endpoint URL is correct: `https://yourdomain.com/api/webhook`
- Test webhook in Stripe Dashboard → Send test webhook

**Emails not sending:**
- Verify `RESEND_API_KEY` is set
- For custom domain emails, verify DNS records in Resend

**Database connection issues:**
- For Vercel Postgres, use connection pooling
- For Supabase, use the "Transaction" pooling connection string
- Ensure database allows connections from Vercel IPs

## Monitoring

- View logs in Vercel dashboard → Deployments → Function Logs
- Check Stripe Dashboard → Webhooks for webhook delivery status
- Monitor email delivery in Resend dashboard

## Local Development After Production Setup

To continue local development with SQLite:

1. Keep a local `.env.local` with SQLite:
   ```
   DATABASE_URL="file:./dev.db"
   ```

2. Temporarily switch schema for local dev:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

3. Run `npx prisma db push` locally
