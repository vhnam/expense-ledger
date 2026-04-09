import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { TransactionList } from '@/components/transactions/TransactionList'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import { useAccount } from '@/hooks/use-accounts'
import type { Transaction } from '@/types/ledger'
import { IconPlus } from '@tabler/icons-react'
import TransactionOverview from '@/components/transactions/TransactionOverview'
import { cn } from '@/lib/utils'

type AccountTransactionsPanelProps = {
  accountId: string
  /** Extra content above the page title (e.g. breadcrumb) */
  topBar?: ReactNode
  className?: string
}

function TransactionsLoadingSkeleton() {
  return (
    <div className="space-y-6 motion-reduce:animate-none">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-border bg-muted/40 animate-pulse motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-border bg-muted/30 animate-pulse motion-reduce:animate-none" />
    </div>
  )
}

export function AccountTransactionsPanel({
  accountId,
  topBar,
  className,
}: AccountTransactionsPanelProps) {
  const {
    data: account,
    isLoading: accountLoading,
    error: accountError,
  } = useAccount(accountId)
  const {
    data: transactions = [],
    isLoading: txLoading,
    error: txError,
  } = useTransactions(accountId)
  const createMutation = useCreateTransaction(accountId)
  const updateMutation = useUpdateTransaction(accountId)
  const deleteMutation = useDeleteTransaction(accountId)

  const [formOpen, setFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)

  const handleAdd = () => {
    setEditingTransaction(null)
    setFormOpen(true)
  }

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx)
    setFormOpen(true)
  }

  const handleFormSubmit = (data: {
    amount: string
    date: string
    description: string
    type: Transaction['type']
  }) => {
    if (editingTransaction) {
      updateMutation.mutate(
        {
          id: editingTransaction.id,
          data: {
            amount: data.amount,
            date: data.date,
            description: data.description,
            type: data.type,
          },
        },
        {
          onSuccess: () => {
            setFormOpen(false)
            setEditingTransaction(null)
          },
        },
      )
    } else {
      createMutation.mutate(
        {
          amount: data.amount,
          date: data.date,
          description: data.description,
          type: data.type,
        },
        {
          onSuccess: () => setFormOpen(false),
        },
      )
    }
  }

  const handleFormCancel = () => {
    setFormOpen(false)
    setEditingTransaction(null)
  }

  const handleDeleteClick = (tx: Transaction) => setDeleteTarget(tx)
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }
  const handleDeleteCancel = () => setDeleteTarget(null)

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  if (accountError) {
    return (
      <div className={cn('space-y-3', className)}>
        {topBar}
        <p className="text-destructive text-sm leading-relaxed">
          Failed to load account: {accountError.message}
        </p>
        <Link
          to="/accounts"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex cursor-pointer transition-colors duration-200"
        >
          ← Bank accounts
        </Link>
      </div>
    )
  }

  if (txError) {
    return (
      <div className={cn('space-y-3', className)}>
        {topBar}
        <p className="text-destructive text-sm leading-relaxed">
          Failed to load transactions: {txError.message}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {topBar}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            Transactions
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {accountLoading ? 'Loading…' : account ? account.name : 'Account'}
          </h1>
          {account && !accountLoading && (
            <p className="mt-1.5 text-sm text-muted-foreground capitalize leading-relaxed">
              {account.type} · summary and transaction history
            </p>
          )}
        </div>
        <Button
          onClick={handleAdd}
          className="cursor-pointer shrink-0 transition-opacity duration-200"
        >
          <IconPlus className="size-4" aria-hidden />
          Add transaction
        </Button>
      </div>

      {txLoading || accountLoading ? (
        <TransactionsLoadingSkeleton />
      ) : (
        <div className="space-y-8">
          <section aria-labelledby="tx-summary-heading">
            <h2
              id="tx-summary-heading"
              className="text-base font-semibold tracking-tight text-foreground mb-4"
            >
              Summary
            </h2>
            <TransactionOverview transactions={transactions} />
          </section>
          <section aria-labelledby="tx-history-heading">
            <h2
              id="tx-history-heading"
              className="text-base font-semibold tracking-tight text-foreground mb-4"
            >
              Transaction history
            </h2>
            <TransactionList
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          </section>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingTransaction(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Edit transaction' : 'Add transaction'}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            accountId={accountId}
            transaction={editingTransaction}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isPending={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) handleDeleteCancel()
        }}
      >
        <DialogContent showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Delete this transaction? This cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="cursor-pointer"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
