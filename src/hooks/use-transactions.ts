import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TransactionUpdate } from '@/types/ledger'
import {
  fetchTransactions,
  createTransaction,
  fetchTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transaction.service'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (accountId: string) => [...transactionKeys.all, accountId] as const,
  detail: (accountId: string, id: string) =>
    [...transactionKeys.list(accountId), id] as const,
}

export function useTransactions(accountId: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.list(accountId ?? ''),
    queryFn: () => fetchTransactions(accountId!),
    enabled: !!accountId,
  })
}

export function useTransaction(
  accountId: string | undefined,
  id: string | undefined,
) {
  return useQuery({
    queryKey: transactionKeys.detail(accountId ?? '', id ?? ''),
    queryFn: () => fetchTransaction(accountId!, id!),
    enabled: !!accountId && !!id,
  })
}

export function useCreateTransaction(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Omit<Parameters<typeof createTransaction>[1], 'account_id'>,
    ) => createTransaction(accountId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: transactionKeys.list(accountId),
      })
    },
  })
}

export function useUpdateTransaction(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionUpdate }) =>
      updateTransaction(accountId, id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: transactionKeys.list(accountId),
      })
      void queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(accountId, id),
      })
    },
  })
}

export function useDeleteTransaction(accountId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(accountId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: transactionKeys.list(accountId),
      })
    },
  })
}
