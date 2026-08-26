import { google } from 'googleapis'

export function getOAuthClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
  )
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  return oauth2Client
}

export async function getTodaysMeetings(accessToken: string, refreshToken: string) {
  const auth = getOAuthClient(accessToken, refreshToken)
  const calendar = google.calendar({ version: 'v3', auth })

  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20
  })

  return (res.data.items || []).map(event => ({
    id: event.id || '',
    title: event.summary || 'Untitled',
    time: event.start?.dateTime
      ? new Date(event.start.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : 'All day',
    duration: event.start?.dateTime && event.end?.dateTime
      ? Math.round((new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / 60000)
      : 60,
    attendees: (event.attendees || []).map(a => a.email || '').filter(Boolean),
    meetLink: event.hangoutLink || '',
    hasUnreadDocs: false
  }))
}

export async function getFlaggedEmails(accessToken: string, refreshToken: string, limit = 10) {
  const auth = getOAuthClient(accessToken, refreshToken)
  const gmail = google.gmail({ version: 'v1', auth })

  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread is:inbox -category:promotions -category:social',
    maxResults: limit
  })

  if (!res.data.messages) return []

  const messages = await Promise.all(
    res.data.messages.map(async msg => {
      const full = await gmail.users.messages.get({ userId: 'me', id: msg.id! })
      const headers = full.data.payload?.headers || []
      const get = (name: string) => headers.find(h => h.name === name)?.value || ''
      return {
        id: msg.id || '',
        from: get('From'),
        subject: get('Subject'),
        snippet: full.data.snippet || '',
        requiresAction: true
      }
    })
  )

  return messages
}
