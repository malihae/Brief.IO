// Simple in-memory rate limiter — swap for Upstash Redis in production for multi-instance support
const store = new Map<string, { count: number; resetAt: number }>()

interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

// Cleanup old entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of store.entries()) {
      if (now > val.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
}
