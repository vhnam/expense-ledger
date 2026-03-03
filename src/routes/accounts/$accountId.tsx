import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
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

export const Route = createFileRoute('/accounts/$accountId')({
  component: AccountDetailPage,
})

function AccountDetailPage() {
  const { accountId } = Route.useParams()
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
      <div className="container max-w-4xl py-8">
        <p className="text-destructive">
          Failed to load account: {accountError.message}
        </p>
        <Link
          to="/accounts"
          className="text-sm text-muted-foreground hover:text-foreground mt-2 inline-block"
        >
          ← Back to accounts
        </Link>
      </div>
    )
  }

  if (txError) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-destructive">
          Failed to load transactions: {txError.message}
        </p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 px-4 lg:px-6 mx-auto">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          to="/accounts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to accounts
        </Link>
        {account && (
          <span className="text-muted-foreground">
            /{' '}
            <span className="text-foreground font-medium">{account.name}</span>
            <span className="capitalize text-muted-foreground ml-1">
              ({account.type})
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {accountLoading
              ? 'Account'
              : account
                ? `${account.name} — Transactions`
                : 'Transactions'}
          </h1>
          <Button onClick={handleAdd}>
            <IconPlus className="size-4" />
            Add transaction
          </Button>
        </div>

        {txLoading ? (
          <p className="text-muted-foreground">Loading transactions…</p>
        ) : (
          <div className="space-y-6">
            <TransactionOverview transactions={transactions} />
            <TransactionList
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          </div>
        )}
      </div>

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
            <p className="text-sm text-muted-foreground">
              Delete this transaction? This cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
