'use client'
import Link from 'next/link'
import { useState } from 'react'

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    tagline: 'Try it, no card needed',
    cta: 'Get started free',
    href: '/auth?signup=true',
    features: [
      '1 AI brief per day',
      'Up to 3 meetings',
      'Google Calendar + Gmail',
      '5 priority tasks',
    ],
    locked: ['Meeting prep briefs', 'Voice summary', 'Email drafting', 'Slack, Notion, Asana']
  },
  {
    name: 'Pro',
    price: { monthly: 12, annual: 10 },
    tagline: 'For busy professionals',
    cta: 'Start 14-day free trial',
    featured: true,
    features: [
      'Unlimited daily briefs',
      'All meetings covered',
      '6 integrations incl. Slack, Notion',
      'Per-meeting prep briefs',
      'Voice summary (60-sec audio)',
      'AI email drafting from brief',
      'Unlimited tasks',
      'Priority support'
    ]
  },
  {
    name: 'Team',
    price: { monthly: 49, annual: 39 },
    tagline: 'Shared context, less meetings',
    cta: 'Talk to us',
    href: 'mailto:hello@briefos.app',
    note: '5 seats included',
    features: [
      'Everything in Pro',
      'Shared team context layer',
      'Manager overview brief',
      'Auto stand-up notes',
      'Slack digest for whole team',
      'Admin dashboard',
      'SSO + SAML (coming soon)'
    ]
  }
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  async function handleCheckout(plan: string) {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: plan.toLowerCase() })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else window.location.href = '/auth?signup=true'
  }

  return (
    <main className="min-h-screen bg-surface-0">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <Link href="/" className="text-base font-medium tracking-tight">Brief<span className="text-brand-600">OS</span></Link>
        <Link href="/auth" className="text-sm text-gray-500 hover:text-gray-800">Sign in</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-gray-900 mb-3">Simple, honest pricing</h1>
          <p className="text-gray-500 text-base">Start free. Upgrade when BriefOS saves you more time than it costs.</p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm ${!annual ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-10 h-5 rounded-full relative transition-colors ${annual ? 'bg-brand-600' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${annual ? 'left-5' : 'left-0.5'}`}></div>
            </button>
            <span className={`text-sm ${annual ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Annual</span>
            {annual && <span className="badge badge-ok text-xs">Save 20%</span>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`bg-white rounded-card p-6 flex flex-col ${plan.featured ? 'border-2 border-brand-500' : 'border border-gray-100'}`}
            >
              {plan.featured && (
                <span className="badge badge-info self-start mb-3 text-xs">Most popular</span>
              )}
              <h2 className="text-base font-medium text-gray-900">{plan.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">{plan.tagline}</p>

              <div className="mb-1">
                <span className="text-3xl font-medium text-gray-900">
                  ${annual ? plan.price.annual : plan.price.monthly}
                </span>
                <span className="text-sm text-gray-400"> / mo</span>
              </div>
              {plan.note && <p className="text-xs text-gray-400 mb-4">{plan.note}</p>}
              {annual && plan.price.annual > 0 && (
                <p className="text-xs text-gray-400 mb-4">Billed ${plan.price.annual * 12}/year</p>
              )}
              {!plan.note && !annual && <div className="mb-4"></div>}

              <hr className="border-gray-100 my-3" />

              <ul className="flex-1 flex flex-col gap-2 mb-5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>{f}
                  </li>
                ))}
                {plan.locked?.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="mt-0.5 shrink-0">✗</span>{f}
                  </li>
                ))}
              </ul>

              {plan.href ? (
                <Link href={plan.href}
                  className={`text-center py-2.5 rounded text-sm font-medium transition-colors ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </Link>
              ) : (
                <button
                  onClick={() => handleCheckout(plan.name)}
                  className={`py-2.5 rounded text-sm font-medium transition-colors ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
