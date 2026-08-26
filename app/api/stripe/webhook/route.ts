import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

// Use service role ONLY here — never expose this to client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Stripe requires the raw body for signature verification — do NOT parse as JSON first
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    // Never log full error to client — could leak internal info
    console.error('[webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      const sub = event.data.object as any
      const userId = sub.metadata?.userId
      const plan = ['pro', 'team'].includes(sub.metadata?.plan) ? sub.metadata.plan : 'free'
      const isActive = sub.status === 'active' || sub.status === 'trialing'

      if (userId && typeof userId === 'string') {
        await supabase.from('profiles').update({
          plan: isActive ? plan : 'free',
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id
        }).eq('id', userId)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as any
      const userId = sub.metadata?.userId
      if (userId && typeof userId === 'string') {
        await supabase.from('profiles').update({ plan: 'free' }).eq('id', userId)
      }
    }
  } catch (err) {
    console.error('[webhook] DB update failed:', err)
    // Return 200 so Stripe doesn't retry — log and alert separately
    return NextResponse.json({ received: true, warning: 'DB update failed' })
  }

  return NextResponse.json({ received: true })
}
