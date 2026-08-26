import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  plan: 'pro' | 'team'
) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { userId, plan },
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId, plan }
    }
  })
  return session
}

export async function createPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  })
}

export async function getPlanFromSubscription(subscriptionId: string): Promise<'free' | 'pro' | 'team'> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const plan = sub.metadata?.plan
  if (plan === 'team') return 'team'
  if (plan === 'pro') return 'pro'
  return 'free'
}
