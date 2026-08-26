import Anthropic from 'anthropic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface BriefContext {
  meetings: Meeting[]
  emails: Email[]
  tasks: Task[]
  userName: string
  date: string
}

export interface Meeting {
  title: string
  time: string
  duration: number
  attendees: string[]
  hasUnreadDocs?: boolean
}

export interface Email {
  from: string
  subject: string
  snippet: string
  requiresAction: boolean
}

export interface Task {
  title: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
}

export async function generateDailyBrief(ctx: BriefContext): Promise<string> {
  const prompt = `You are BriefOS, an AI briefing assistant. Generate a sharp, ruthless 60-second daily brief for ${ctx.userName}.

Today: ${ctx.date}

MEETINGS:
${ctx.meetings.map(m => `- ${m.time}: ${m.title} (${m.duration}min, ${m.attendees.length} attendees${m.hasUnreadDocs ? ', HAS UNREAD DOCS' : ''})`).join('\n')}

FLAGGED EMAILS NEEDING ATTENTION:
${ctx.emails.filter(e => e.requiresAction).map(e => `- From ${e.from}: "${e.subject}" — ${e.snippet}`).join('\n')}

HIGH PRIORITY TASKS:
${ctx.tasks.filter(t => t.priority === 'high').map(t => `- ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}`).join('\n')}

Write 3-4 punchy sentences. Lead with the most urgent thing. Call out anything that needs a decision TODAY. End with the best deep-work window if any clear gaps exist. Be direct, no fluff, no greetings.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  })

  return (msg.content[0] as any).text
}

export async function generateMeetingPrep(meeting: Meeting, emails: Email[]): Promise<string> {
  const prompt = `Generate a 60-second prep brief for this meeting:

Meeting: ${meeting.title}
Time: ${meeting.time}
Duration: ${meeting.duration} minutes
Attendees: ${meeting.attendees.join(', ')}

Relevant context from emails:
${emails.map(e => `- ${e.subject}: ${e.snippet}`).join('\n')}

Give: (1) what this meeting is really about, (2) one thing to have ready, (3) one question to ask or decision to drive. 3 bullet points max. Sharp and actionable.`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }]
  })

  return (msg.content[0] as any).text
}

export async function draftEmailReply(email: Email, tone: 'formal' | 'casual' = 'casual'): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Draft a ${tone} reply to this email. Subject: "${email.subject}" from ${email.from}. Context: ${email.snippet}. Keep it under 5 sentences. No subject line needed.`
    }]
  })

  return (msg.content[0] as any).text
}
