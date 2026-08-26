import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'
import { Errors, safeParseBody, isValidPlan, isValidEmail } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Errors.unauthorized()

  // Rate limit: 5 checkout attempts per hour (prevent abuse)
  const limit = rateLimit({ key: `checkout:${user.id}`, limit: 5, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return Errors.tooMany()

  const body = await safeParseBody<{ plan: unknown }>(req)
  if (!body || !isValidPlan(body.plan)) return Errors.badRequest('Invalid plan')

  // Validate email from auth (not from client input)
  const email = user.email
  if (!email || !isValidEmail(email)) return Errors.badRequest('Invalid account email')

  const priceId = body.plan === 'team'
    ? process.env.STRIPE_TEAM_PRICE_ID!
    : process.env.STRIPE_PRO_PRICE_ID!

  if (!priceId) {
    console.error('[stripe/checkout] Missing price ID env var')
    return Errors.serverError()
  }

  try {
    const session = await createCheckoutSession(user.id, email, priceId, body.plan)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout POST]', err)
    return Errors.serverError()
  }
}
