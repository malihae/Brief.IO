import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <span className="text-lg font-medium tracking-tight">Brief<span className="text-brand-600">OS</span></span>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Pricing</Link>
          <Link href="/auth" className="btn-secondary text-sm">Sign in</Link>
          <Link href="/auth?signup=true" className="btn-primary text-sm">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="badge badge-info mb-6 mx-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          AI-powered · No setup required
        </div>
        <h1 className="text-5xl font-medium tracking-tight text-gray-900 leading-tight mb-6">
          Your day, briefed in<br />
          <span className="text-brand-600">60 seconds</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
          BriefOS reads your calendar, emails, and tasks — then tells you exactly what matters today, what decisions need you, and what to prep for each meeting.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/auth?signup=true" className="btn-primary px-6 py-3 text-base">
            Start for free — no card needed
          </Link>
          <Link href="/pricing" className="btn-secondary px-6 py-3 text-base">
            See pricing
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free forever · Pro from $12/mo · 14-day trial</p>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Connect your tools', body: 'Google Calendar, Gmail, Slack, Notion — one-click OAuth. No API keys, no config.' },
            { step: '02', title: 'Get your brief', body: 'Every morning at 8AM, BriefOS reads your day and writes a sharp 60-second summary.' },
            { step: '03', title: 'Stay ahead', body: 'Per-meeting prep briefs, flagged decisions, email drafts — all from one dashboard.' }
          ].map(({ step, title, body }) => (
            <div key={step} className="card">
              <div className="text-xs font-mono text-brand-500 mb-3">{step}</div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-2xl font-medium text-gray-800 leading-snug mb-2">
            "I stopped missing context in meetings the day I started using BriefOS."
          </p>
          <p className="text-sm text-gray-400">— Early beta user, Product Manager</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center">
        <p className="text-sm text-gray-400">© 2026 BriefOS · <Link href="/pricing" className="hover:text-gray-600">Pricing</Link> · <Link href="/auth" className="hover:text-gray-600">Sign in</Link></p>
      </footer>
    </main>
  )
}
