import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Pool } from '@neondatabase/serverless'
import { PostgresDialect } from 'kysely'

export const auth = betterAuth({
  database: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
  trustedOrigins: [
    'http://localhost:3000',
  ],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
