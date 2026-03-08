import type { Config, Context } from '@netlify/functions'
import { auth } from '@/lib/auth'

export default async (req: Request, _context: Context) => {
  return auth.handler(req)
}

export const config: Config = {
  path: '/api/auth/*',
}
