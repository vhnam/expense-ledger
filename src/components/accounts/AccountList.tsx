import type { Account } from '@/types/ledger'
import { AccountRow } from './AccountRow'

type AccountListProps = {
  accounts: Account[]
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

export function AccountList({ accounts, onEdit, onDelete }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-muted-foreground">
        <p className="font-medium">No accounts yet.</p>
        <p className="text-sm mt-1">Create one to get started.</p>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {accounts.map((account) => (
        <li key={account.id}>
          <AccountRow
            account={account}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  )
}
