import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { AccountList } from '@/components/accounts/AccountList'
import { AccountForm } from '@/components/accounts/AccountForm'
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/hooks/use-accounts'
import type { Account, AccountCreate } from '@/types/ledger'
import { IconPlus } from '@tabler/icons-react'

export const Route = createFileRoute('/accounts/')({
  component: AccountsPage,
})

function AccountsPage() {
  const { data: accounts = [], isLoading, error } = useAccounts()
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  const deleteMutation = useDeleteAccount()

  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)

  const handleAdd = () => {
    setEditingAccount(null)
    setFormOpen(true)
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setFormOpen(true)
  }

  const handleFormSubmit = (data: AccountCreate) => {
    if (editingAccount) {
      updateMutation.mutate(
        { id: editingAccount.id, data },
        {
          onSuccess: () => {
            setFormOpen(false)
            setEditingAccount(null)
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setFormOpen(false)
        },
      })
    }
  }

  const handleFormCancel = () => {
    setFormOpen(false)
    setEditingAccount(null)
  }

  const handleDeleteClick = (account: Account) => setDeleteTarget(account)
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }
  const handleDeleteCancel = () => setDeleteTarget(null)

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <p className="text-destructive">Failed to load accounts: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <Button onClick={handleAdd}>
            <IconPlus className="size-4" />
            Add account
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading accounts…</p>
        ) : (
          <AccountList
            accounts={accounts}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingAccount(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit account' : 'Add account'}</DialogTitle>
          </DialogHeader>
          <AccountForm
            account={editingAccount}
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
            <DialogTitle>Delete account</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Delete “{deleteTarget?.name}”? This will also delete all its transactions.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel} disabled={isPending}>
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
