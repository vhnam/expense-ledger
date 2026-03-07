import { env } from '@/env'

/**
 * Base URL for Netlify Functions (api/ folder). Use relative path for dev and production.
 */
const NETLIFY_FUNCTIONS = env.VITE_NETLIFY_FUNCTIONS_URL

export function accountsUrl(): string {
  return `${NETLIFY_FUNCTIONS}/accounts`
}

export function accountUrl(id: string): string {
  return `${NETLIFY_FUNCTIONS}/account?id=${encodeURIComponent(id)}`
}

export function transactionsUrl(accountId: string): string {
  return `${NETLIFY_FUNCTIONS}/transactions?accountId=${encodeURIComponent(accountId)}`
}

export function transactionUrl(accountId: string, id: string): string {
  return `${NETLIFY_FUNCTIONS}/transaction?accountId=${encodeURIComponent(accountId)}&id=${encodeURIComponent(id)}`
}
