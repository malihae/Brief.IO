// Called in next.config.js — hard crash if any required env var is missing at build/start time
// This prevents silent failures where a missing key causes runtime errors in production

const REQUIRED_SERVER_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_TEAM_PRICE_ID',
  'NEXT_PUBLIC_APP_URL'
]

export function validateEnv() {
  const missing = REQUIRED_SERVER_VARS.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ BriefOS: Missing required environment variables:\n\n` +
      missing.map(k => `  • ${k}`).join('\n') +
      `\n\nCopy .env.local.example → .env.local and fill in all values.\n`
    )
  }
}
