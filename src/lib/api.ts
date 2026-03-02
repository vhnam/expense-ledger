/**
 * Base URL for Netlify Functions. Use relative path so it works in dev and production.
 */
const NETLIFY_FUNCTIONS = '/.netlify/functions'

export function accountsUrl(): string {
  return `${NETLIFY_FUNCTIONS}/accounts`
}

export function accountUrl(id: string): string {
  return `${NETLIFY_FUNCTIONS}/account?id=${encodeURIComponent(id)}`
}
