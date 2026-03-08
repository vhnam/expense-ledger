import type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
} from '@/types/ledger'
import { transactionsUrl, transactionUrl } from '@/lib/api'

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

export async function fetchTransactions(
  accountId: string,
): Promise<Transaction[]> {
  const res = await fetch(transactionsUrl(accountId), {
    credentials: 'include',
  })
  return handleResponse<Transaction[]>(res)
}

export async function createTransaction(
  accountId: string,
  data: Omit<TransactionCreate, 'account_id'>,
): Promise<Transaction> {
  const res = await fetch(transactionsUrl(accountId), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, account_id: accountId }),
  })
  return handleResponse<Transaction>(res)
}

export async function fetchTransaction(
  accountId: string,
  id: string,
): Promise<Transaction> {
  const res = await fetch(transactionUrl(accountId, id), {
    credentials: 'include',
  })
  return handleResponse<Transaction>(res)
}

export async function updateTransaction(
  accountId: string,
  id: string,
  data: TransactionUpdate,
): Promise<Transaction> {
  const res = await fetch(transactionUrl(accountId, id), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Transaction>(res)
}

export async function deleteTransaction(
  accountId: string,
  id: string,
): Promise<void> {
  const res = await fetch(transactionUrl(accountId, id), {
    method: 'DELETE',
    credentials: 'include',
  })
  await handleResponse<void>(res)
}
