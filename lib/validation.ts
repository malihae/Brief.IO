import { NextResponse } from 'next/server'

// Strip any HTML/script tags from user-supplied strings
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // block JS URIs
    .replace(/on\w+\s*=/gi, '')         // strip event handlers
    .trim()
    .slice(0, 2000)                     // hard max length
}

// Validate a UUID v4
export function isValidUUID(val: unknown): val is string {
  return typeof val === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)
}

// Validate plan name
export function isValidPlan(val: unknown): val is 'pro' | 'team' {
  return val === 'pro' || val === 'team'
}

// Validate email
export function isValidEmail(val: unknown): val is string {
  return typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && val.length <= 320
}

// Parse and validate JSON body safely
export async function safeParseBody<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const text = await req.text()
    if (!text || text.length > 50_000) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

// Standard error responses
export const Errors = {
  unauthorized:   () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  forbidden:      () => NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
  badRequest: (msg = 'Bad request') => NextResponse.json({ error: msg }, { status: 400 }),
  tooMany:        () => NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 }),
  serverError:    () => NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
}
