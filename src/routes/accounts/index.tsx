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
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '@/hooks/use-accounts'
import type { BankAccount, BankAccountCreate } from '@/types/ledger'
import { IconPlus } from '@tabler/icons-react'
import {
  InsetPage,
  pageEyebrowClass,
  pageTitleClass,
} from '@/components/layout/InsetPage'

export const Route = createFileRoute('/accounts/')({
  component: AccountsPage,
})

function AccountsPage() {
  const { data: accounts = [], isLoading, error } = useAccounts()
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  const deleteMutation = useDeleteAccount()

  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null)

  const handleAdd = () => {
    setEditingAccount(null)
    setFormOpen(true)
  }

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account)
    setFormOpen(true)
  }

  const handleFormSubmit = (data: BankAccountCreate) => {
    if (editingAccount) {
      updateMutation.mutate(
        { id: editingAccount.id, data },
        {
          onSuccess: () => {
            setFormOpen(false)
            setEditingAccount(null)
          },
        },
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

  const handleDeleteClick = (account: BankAccount) => setDeleteTarget(account)
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

  if (error) {
    return (
      <InsetPage>
        <p className="text-destructive text-sm leading-relaxed">
          Failed to load accounts: {error.message}
        </p>
      </InsetPage>
    )
  }

  return (
    <>
      <InsetPage>
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className={pageEyebrowClass}>Manage</p>
              <h1 className={pageTitleClass}>Bank accounts</h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-xl">
                Open an account to view and edit its transactions.
              </p>
            </div>
            <Button
              onClick={handleAdd}
              className="cursor-pointer shrink-0 min-h-11"
            >
              <IconPlus className="size-4" aria-hidden />
              Add account
            </Button>
          </header>

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
      </InsetPage>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingAccount(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit account' : 'Add account'}
            </DialogTitle>
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
              Delete “{deleteTarget?.name}”? This will also delete all its
              transactions.
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
    </>
  )
}
