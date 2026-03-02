import type { Account, AccountCreate, AccountUpdate } from '@/types/ledger'
import { accountsUrl, accountUrl } from '@/lib/api'

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!res.ok) {
    let message = res.statusText
    try {
      const data = JSON.parse(text) as { error?: string }
      if (data.error) message = data.error
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch(accountsUrl())
  return handleResponse<Account[]>(res)
}

export async function createAccount(data: AccountCreate): Promise<Account> {
  const res = await fetch(accountsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Account>(res)
}

export async function fetchAccount(id: string): Promise<Account> {
  const res = await fetch(accountUrl(id))
  return handleResponse<Account>(res)
}

export async function updateAccount(
  id: string,
  data: AccountUpdate
): Promise<Account> {
  const res = await fetch(accountUrl(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Account>(res)
}

export async function deleteAccount(id: string): Promise<void> {
  const res = await fetch(accountUrl(id), { method: 'DELETE' })
  await handleResponse<void>(res)
}
