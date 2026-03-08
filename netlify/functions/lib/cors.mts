/**
 * Returns CORS headers that reflect the request's Origin, enabling
 * credentialed cross-origin requests from any allowed origin.
 */
export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

/** Handles OPTIONS preflight requests. */
export function handlePreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }
  return null
}

/** Wraps a Response with CORS headers. */
export function withCors(req: Request, res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(corsHeaders(req))) {
    headers.set(k, v)
  }
  return new Response(res.body, { status: res.status, headers })
}
