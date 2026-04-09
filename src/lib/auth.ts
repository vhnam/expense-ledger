import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Pool } from '@neondatabase/serverless'
import { PostgresDialect } from 'kysely'
import { env } from '@/env'

const isProd = process.env.NODE_ENV === 'production'
const authOrigin = new URL(env.BETTER_AUTH_URL).origin
const trustedOrigins = new Set<string>([authOrigin])

if (!isProd) {
  trustedOrigins.add('http://localhost:3000')
}

if (env.BETTER_AUTH_TRUSTED_ORIGINS) {
  for (const origin of env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')) {
    const trimmed = origin.trim()
    if (!trimmed) continue
    trustedOrigins.add(new URL(trimmed).origin)
  }
}

export const auth = betterAuth({
  database: new PostgresDialect({
    pool: new Pool({ connectionString: env.DATABASE_URL }),
  }),
  trustedOrigins: [...trustedOrigins],
  rateLimit: {
    enabled: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
