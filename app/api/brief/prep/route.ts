import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateMeetingPrep } from '@/lib/brief-engine'
import { rateLimit } from '@/lib/rate-limit'
import { Errors, safeParseBody, sanitizeString } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return Errors.unauthorized()

  // Rate limit: 30 prep briefs per hour per user
  const limit = rateLimit({ key: `prep:${user.id}`, limit: 30, windowMs: 60 * 60 * 1000 })
  if (!limit.success) return Errors.tooMany()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'free') {
    return Errors.forbidden()
  }

  const body = await safeParseBody<{ meeting: any; emails: any[] }>(req)
  if (!body || !body.meeting) return Errors.badRequest('Missing meeting data')

  // Sanitize all string fields before passing to AI
  const meeting = {
    ...body.meeting,
    title: sanitizeString(body.meeting.title),
    time: sanitizeString(body.meeting.time),
    attendees: Array.isArray(body.meeting.attendees)
      ? body.meeting.attendees.map((a: unknown) => sanitizeString(a)).slice(0, 20)
      : []
  }

  const emails = Array.isArray(body.emails)
    ? body.emails.slice(0, 5).map((e: any) => ({
        ...e,
        from: sanitizeString(e.from),
        subject: sanitizeString(e.subject),
        snippet: sanitizeString(e.snippet)
      }))
    : []

  try {
    const prep = await generateMeetingPrep(meeting, emails)
    return NextResponse.json({ prep })
  } catch (err) {
    console.error('[brief/prep POST]', err)
    return Errors.serverError()
  }
}
