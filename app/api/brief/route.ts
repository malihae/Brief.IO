import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getTodaysMeetings, getFlaggedEmails } from '@/lib/google'
import { generateDailyBrief } from '@/lib/brief-engine'
import { rateLimit } from '@/lib/rate-limit'
import { Errors } from '@/lib/validation'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  // Rate limit: 10 brief generations per user per hour
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Errors.unauthorized()

  const limit = rateLimit({ key: `brief:${user.id}`, limit: 10, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return Errors.tooMany()

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_access_token, google_refresh_token, plan')
      .eq('id', user.id)
      .single()

    if (!profile?.google_access_token) {
      return Errors.badRequest('Google Calendar not connected. Please reconnect.')
    }

    // Free plan: 1 brief per day
    if (profile.plan === 'free') {
      const today = format(new Date(), 'yyyy-MM-dd')
      const { count } = await supabase
        .from('briefs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)

      if ((count || 0) >= 1) {
        return NextResponse.json(
          { error: 'Daily limit reached. Upgrade to Pro for unlimited briefs.' },
          { status: 429 }
        )
      }
    }

    const [meetings, emails] = await Promise.all([
      getTodaysMeetings(profile.google_access_token, profile.google_refresh_token),
      getFlaggedEmails(profile.google_access_token, profile.google_refresh_token)
    ])

    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, priority, due_date')
      .eq('user_id', user.id)
      .eq('completed', false)
      .order('priority', { ascending: false })
      .limit(10)

    const briefText = await generateDailyBrief({
      meetings,
      emails,
      tasks: (tasks || []).map(t => ({ title: t.title, priority: t.priority, dueDate: t.due_date })),
      userName: user.user_metadata?.full_name?.split(' ')[0] || 'there',
      date: format(new Date(), 'EEEE, MMMM d yyyy')
    })

    const { data: brief } = await supabase
      .from('briefs')
      .insert({
        user_id: user.id,
        content: briefText,
        meetings_count: meetings.length,
        emails_count: emails.length
      })
      .select()
      .single()

    return NextResponse.json({ brief: brief?.content, meetings, emails, tasks })
  } catch (err) {
    console.error('[brief/GET]', err)
    return Errors.serverError()
  }
}
