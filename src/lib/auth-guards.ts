type SessionResult = {
  data?: {
    user?: unknown
  } | null
} | null

const PUBLIC_PATHS = ['/auth'] as const

export function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true
  }

  return pathname.startsWith('/api/auth')
}

export function hasAuthenticatedUser(result: SessionResult) {
  return Boolean(result?.data?.user)
}
