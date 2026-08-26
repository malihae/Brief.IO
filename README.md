# BriefOS — Deployment Guide

## Stack
- **Frontend + API**: Next.js 14 on Vercel
- **Database + Auth**: Supabase
- **AI**: Anthropic Claude API
- **Payments**: Stripe
- **Voice**: ElevenLabs
- **Integrations**: Google (Calendar + Gmail), Slack, Notion

---

## Deploy in 5 Steps

### 1. Supabase Setup
1. Create project at supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. In Auth → Providers, enable **Google** OAuth
4. Copy: Project URL, anon key, service role key

### 2. Google OAuth Setup
1. console.cloud.google.com → New project → Enable **Calendar API** + **Gmail API**
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Scopes: `calendar.readonly`, `gmail.readonly`, `email`, `profile`

### 3. Stripe Setup
1. Create products in Stripe Dashboard:
   - **BriefOS Pro** — $12/mo recurring → copy price ID
   - **BriefOS Team** — $49/mo recurring → copy price ID
2. Set up webhook → endpoint: `https://yourdomain.com/api/stripe/webhook`
   Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 4. Deploy to Vercel
```bash
git init
git add .
git commit -m "Initial BriefOS deploy"
npm i -g vercel
vercel --prod
```
Add all env vars from `.env.local.example` in Vercel dashboard.

### 5. Go Live Checklist
- [ ] Supabase schema applied
- [ ] Google OAuth working (test sign-in)
- [ ] Stripe test checkout works
- [ ] Stripe webhook verified
- [ ] ElevenLabs key added (Pro feature)
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Add production domain to Google OAuth allowed origins

---

## Local Development
```bash
cp .env.local.example .env.local
# Fill in your keys
npm install
npm run dev
# Open http://localhost:3000
```

## Revenue Model
| Plan | Price | Stripe Price ID Env |
|------|-------|---------------------|
| Pro  | $12/mo | `STRIPE_PRO_PRICE_ID` |
| Team | $49/5 seats/mo | `STRIPE_TEAM_PRICE_ID` |

14-day free trial on all paid plans (configured in Stripe).
