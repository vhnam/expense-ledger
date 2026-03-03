import type { Transaction } from '@/types/ledger'
import { TransactionRow } from './TransactionRow'

type TransactionListProps = {
  transactions: Transaction[]
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-muted-foreground">
        <p className="font-medium">No transactions yet.</p>
        <p className="text-sm mt-1">Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-medium">Date</th>
            <th className="text-right py-3 px-4 font-medium">Amount</th>
            <th className="text-left py-3 px-4 font-medium">Type</th>
            <th className="text-left py-3 px-4 font-medium">Description</th>
            <th className="w-20" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
