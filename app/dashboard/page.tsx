'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Plan = 'free' | 'pro' | 'team'

interface DashState {
  brief: string | null
  meetings: any[]
  emails: any[]
  tasks: any[]
  plan: Plan
  userName: string
  loading: boolean
  briefLoading: boolean
  error: string | null
}

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [state, setState] = useState<DashState>({
    brief: null, meetings: [], emails: [], tasks: [],
    plan: 'free', userName: '', loading: true, briefLoading: false, error: null
  })
  const [prepResult, setPrepResult] = useState<{ [key: string]: string }>({})
  const [prepLoading, setPrepLoading] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()

      setState(s => ({
        ...s,
        loading: false,
        plan: profile?.plan || 'free',
        userName: user.user_metadata?.full_name?.split(' ')[0] || 'there'
      }))

      fetchBrief()
    }
    init()
  }, [])

  async function fetchBrief() {
    setState(s => ({ ...s, briefLoading: true, error: null }))
    try {
      const res = await fetch('/api/brief')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setState(s => ({
        ...s,
        brief: data.brief,
        meetings: data.meetings,
        emails: data.emails,
        tasks: data.tasks || [],
        briefLoading: false
      }))
    } catch (e: any) {
      setState(s => ({ ...s, briefLoading: false, error: e.message }))
    }
  }

  async function getMeetingPrep(meeting: any) {
    if (state.plan === 'free') return
    setPrepLoading(meeting.id)
    const res = await fetch('/api/brief/prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting, emails: state.emails })
    })
    const data = await res.json()
    setPrepResult(p => ({ ...p, [meeting.id]: data.prep }))
    setPrepLoading(null)
  }

  async function upgradeToProPlan() {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: 'pro' })
    })
    const { url } = await res.json()
    window.location.href = url
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading your brief...</div>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Topbar */}
      <nav className="flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-white sticky top-0 z-50">
        <span className="text-base font-medium tracking-tight">Brief<span className="text-brand-600">OS</span></span>
        <div className="flex items-center gap-3">
          <span className={`badge ${state.plan === 'free' ? 'badge-info' : 'badge-pro'}`}>
            {state.plan === 'free' ? 'Free plan' : state.plan === 'pro' ? '✦ Pro' : '✦ Team'}
          </span>
          <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-700">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-3 gap-5">
        {/* Left — main content */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* Daily brief */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Today's brief</p>
                <p className="text-sm text-gray-500">{today}</p>
              </div>
              <button
                onClick={fetchBrief}
                disabled={state.briefLoading}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                {state.briefLoading ? 'Generating...' : '↻ Regenerate'}
              </button>
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-100 rounded p-3 text-sm text-red-700 mb-4">
                {state.error}
                {state.error.includes('Upgrade') && (
                  <button onClick={upgradeToProPlan} className="ml-2 underline font-medium">Upgrade to Pro →</button>
                )}
              </div>
            )}

            {state.briefLoading && (
              <div className="flex flex-col gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${70 + i * 10}%` }}></div>
                ))}
              </div>
            )}

            {state.brief && !state.briefLoading && (
              <p className="text-sm text-gray-700 leading-relaxed">{state.brief}</p>
            )}
          </div>

          {/* Meetings */}
          <div className="card">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Today's meetings</p>
            {state.meetings.length === 0 && (
              <p className="text-sm text-gray-400">No meetings today — enjoy the focus time.</p>
            )}
            <div className="flex flex-col divide-y divide-gray-50">
              {state.meetings.map((m, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <span className="text-xs text-gray-400 w-12 shrink-0 pt-0.5">{m.time}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{m.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{m.duration}min · {m.attendees.length} attendees</p>
                        {prepResult[m.id] && (
                          <p className="text-xs text-gray-600 mt-2 bg-blue-50 rounded p-2 leading-relaxed">{prepResult[m.id]}</p>
                        )}
                      </div>
                    </div>
                    {state.plan !== 'free' ? (
                      <button
                        onClick={() => getMeetingPrep(m)}
                        disabled={prepLoading === m.id}
                        className="text-xs text-brand-600 hover:text-brand-700 shrink-0 font-medium"
                      >
                        {prepLoading === m.id ? 'Prepping...' : '⚡ Prep brief'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">Pro only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Meetings', value: state.meetings.length },
              { label: 'Open tasks', value: state.tasks.length },
              { label: 'Flagged emails', value: state.emails.length },
              { label: 'Briefs generated', value: '—' }
            ].map(({ label, value }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-card p-4">
                <div className="text-xl font-medium text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">

          {/* Tasks */}
          <div className="card">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Priority tasks</p>
            {state.tasks.length === 0 && (
              <p className="text-sm text-gray-400">No open tasks.</p>
            )}
            <div className="flex flex-col gap-2">
              {state.tasks.slice(0, 6).map((t: any, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded border border-gray-200 shrink-0"></div>
                  <span className="text-sm text-gray-700 flex-1 truncate">{t.title}</span>
                  <span className={`badge text-[10px] ${t.priority === 'high' ? 'badge-warn' : 'badge-info'}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div className="card">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Integrations</p>
            {[
              { name: 'Google Calendar', connected: true, color: '#4285F4' },
              { name: 'Gmail', connected: true, color: '#EA4335' },
              { name: 'Slack', connected: false, color: '#4A154B' },
              { name: 'Notion', connected: false, color: '#000' },
            ].map(({ name, connected, color }) => (
              <div key={name} className="flex items-center gap-2 py-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: connected ? color : '#e5e7eb' }}></div>
                <span className="text-sm text-gray-600 flex-1">{name}</span>
                <span className={`text-xs font-medium ${connected ? 'text-green-600' : 'text-gray-300'}`}>
                  {connected ? 'Live' : 'Connect'}
                </span>
              </div>
            ))}
          </div>

          {/* Upgrade card */}
          {state.plan === 'free' && (
            <div className="bg-purple-50 border border-purple-100 rounded-card p-4">
              <p className="text-sm font-medium text-purple-800 mb-1">✦ Upgrade to Pro</p>
              <p className="text-xs text-purple-600 leading-relaxed mb-3">
                Unlimited briefs, meeting prep, voice summary, email drafting, Slack + Notion.
              </p>
              <button onClick={upgradeToProPlan} className="w-full bg-purple-600 text-white text-sm font-medium py-2 rounded hover:bg-purple-700 transition-colors">
                Start 14-day free trial →
              </button>
              <p className="text-xs text-purple-400 text-center mt-2">$12/mo after trial</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
