# Eat Wild Event Management Setup

## Prerequisites

- Node.js 18+ installed
- Stripe account (using the same account as rest-rec)
- Resend account for sending emails

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The `.env.local` file has been created with your Stripe credentials from rest-rec. You need to add:

#### Resend API Key (for email confirmations)

1. Go to https://resend.com/api-keys
2. Create a new API key
3. Add it to `.env.local`:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```

#### Stripe Webhook Secret (for payment confirmations)

You'll need to set up a Stripe webhook to receive payment confirmation events:

**For local development (using Stripe CLI):**

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

**For production:**

1. Go to https://dashboard.stripe.com/webhooks
2. Create a new webhook endpoint: `https://yourdomain.com/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret and add to production environment variables

### 3. Database Setup

The database has already been created and seeded with the SF Sunset Mussels event. If you need to re-seed:

```bash
DATABASE_URL="file:./dev.db" npm run seed
```

### 4. Verify Resend Email Domain

To send emails from a custom domain:

1. Go to https://resend.com/domains
2. Add your domain (e.g., eatwild.co)
3. Add the DNS records provided by Resend
4. Update the webhook email sender in `app/api/webhook/route.ts`:
   ```typescript
   from: 'Eat Wild <bookings@yourdomain.com>'
   ```

For testing, you can use Resend's test domain which sends emails to your verified email address.

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 6. Testing the Booking Flow

1. Navigate to the homepage
2. Click "book" on the SF Sunset Mussels experience
3. Fill out the booking form
4. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
5. Complete checkout
6. Check that:
   - You're redirected to the success page
   - The ticket is created in the database
   - You receive a confirmation email (if Resend is configured)

### 7. Production Deployment

When deploying to production:

1. Update `NEXT_PUBLIC_APP_URL` to your production URL
2. Set up production Stripe webhook (see step 2 above)
3. Ensure all environment variables are set in your hosting platform
4. Use a production database (PostgreSQL recommended instead of SQLite)

## Key Files

- `/app/page.tsx` - Homepage with experiences list
- `/app/events/[id]/page.tsx` - Event booking page
- `/app/api/checkout/route.ts` - Creates Stripe checkout session
- `/app/api/webhook/route.ts` - Handles payment confirmations and sends emails
- `/app/api/events/[id]/route.ts` - Returns event details with availability
- `/prisma/schema.prisma` - Database schema
- `/lib/prisma.ts` - Prisma client setup

## Database Schema

**Event**
- id: Event identifier
- title: Event name
- description: Event description
- date: Event date/time
- location: Event location
- price: Price per ticket (in dollars)
- maxCapacity: Maximum number of tickets (20 for SF Mussels event)

**Ticket**
- id: Ticket identifier
- eventId: Related event
- customerName: Buyer's name
- customerEmail: Buyer's email
- stripeSessionId: Stripe checkout session ID
- purchasedAt: Purchase timestamp
