import { createFileRoute, redirect } from '@tanstack/react-router'

type TransactionsSearch = {
  accountId?: string
}

export const Route = createFileRoute('/transactions')({
  validateSearch: (raw: Record<string, unknown>): TransactionsSearch => ({
    accountId:
      typeof raw.accountId === 'string' && raw.accountId.length > 0
        ? raw.accountId
        : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.accountId) {
      throw redirect({
        to: '/account/$accountId',
        params: { accountId: search.accountId },
      })
    }
    throw redirect({ to: '/accounts' })
  },
})
