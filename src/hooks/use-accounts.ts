import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type { AccountCreate, AccountUpdate } from '@/types/ledger'
import {
  fetchAccounts,
  createAccount,
  fetchAccount,
  updateAccount,
  deleteAccount,
} from '@/services/account.service'

export const accountKeys = {
  all: ['accounts'] as const,
  list: () => [...accountKeys.all, 'list'] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
}

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: fetchAccounts,
  })
}

export function useAccount(id: string | undefined, options?: { enabled: boolean }) {
  return useQuery({
    queryKey: accountKeys.detail(id ?? ''),
    queryFn: () => fetchAccount(id!),
    enabled: (options?.enabled ?? true) && !!id,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AccountCreate) => createAccount(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all })
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountUpdate }) =>
      updateAccount(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all })
      void queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) })
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all })
    },
  })
}
