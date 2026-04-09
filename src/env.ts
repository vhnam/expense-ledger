import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
  .env

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    DATABASE_URL: z.url(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_NETLIFY_FUNCTIONS_URL: z.url(),
  },

  /**
   * What object holds the environment variables at runtime. This is usually
   * `process.env` or `import.meta.env`.
   */
  runtimeEnv: {
    SERVER_URL: process.env.SERVER_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    VITE_APP_TITLE: viteEnv?.VITE_APP_TITLE ?? process.env.VITE_APP_TITLE,
    VITE_NETLIFY_FUNCTIONS_URL:
      viteEnv?.VITE_NETLIFY_FUNCTIONS_URL ??
      process.env.VITE_NETLIFY_FUNCTIONS_URL,
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})
