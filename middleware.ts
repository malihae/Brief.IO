import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// Routes that require auth (redirect to /auth if no session cookie)
const PROTECTED_ROUTES = ['/dashboard']

// Public API routes — still rate-limited but no auth check
const PUBLIC_API_ROUTES = ['/api/auth', '/api/stripe/webhook']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // ── 1. Global rate limit: 120 req/min per IP ──────────────────────────────
  const globalLimit = rateLimit({ key: `global:${ip}`, limit: 120, windowMs: 60_000 })
  if (!globalLimit.success) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: { 'Retry-After': '60' }
    })
  }

  // ── 2. Stricter limit on API routes: 30 req/min per IP ───────────────────
  if (pathname.startsWith('/api/') && !PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))) {
    const apiLimit = rateLimit({ key: `api:${ip}`, limit: 30, windowMs: 60_000 })
    if (!apiLimit.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
  }

  // ── 3. Skip security headers for webhook (needs raw body) ─────────────────
  const isWebhook = pathname === '/api/stripe/webhook'

  // ── 4. Build response and attach security headers ─────────────────────────
  const res = NextResponse.next()

  if (!isWebhook) {
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')

    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    res.headers.set(
      'Content-Security-Policy',
      [
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
        `style-src 'self' 'unsafe-inline'`,                          // Tailwind requires this
        `img-src 'self' data: https://lh3.googleusercontent.com`,
        `connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.elevenlabs.io`,
        `frame-src https://js.stripe.com`,
        `object-src 'none'`,
        `base-uri 'self'`,
        `form-action 'self'`,
        `upgrade-insecure-requests`
      ].join('; ')
    )
  }

  // ── 5. Protect dashboard routes ───────────────────────────────────────────
  if (PROTECTED_ROUTES.some(r => pathname.startsWith(r))) {
    const sessionCookie =
      req.cookies.get('sb-access-token') ||
      req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
