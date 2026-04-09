import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Pool } from '@neondatabase/serverless'
import { PostgresDialect } from 'kysely'
import { env } from '@/env'

const betterAuthUrl = env.BETTER_AUTH_URL
const trustedOrigins = ['http://localhost:3000']

if (betterAuthUrl) {
  trustedOrigins.push(
    betterAuthUrl.startsWith('http')
      ? betterAuthUrl
      : `https://${betterAuthUrl}`,
  )
}

export const auth = betterAuth({
  database: new PostgresDialect({
    pool: new Pool({ connectionString: env.DATABASE_URL }),
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
