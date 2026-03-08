import { auth } from '@/lib/auth'

/**
 * Validates the Better Auth session from the incoming request's cookies.
 * Returns the session (with user) if valid, or null if unauthenticated.
 */
export async function getSessionFromRequest(
  req: Request,
): Promise<{ user: { id: string; email: string; name: string } } | null> {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    return session ?? null
  } catch {
    return null
  }
}
