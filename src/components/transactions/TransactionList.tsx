import type { Transaction } from '@/types/ledger'
import { TransactionRow, TransactionCard } from './TransactionRow'

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
      <div className="rounded-xl border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
        <p className="font-medium text-foreground">No transactions yet</p>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-sm mx-auto">
          Add a transaction to see it listed here. Amounts use color only as a
          secondary cue—income and expense are also labeled by type.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile: card list */}
      <ul className="flex flex-col gap-3 md:hidden" aria-label="Transactions">
        {transactions.map((tx) => (
          <li key={tx.id}>
            <TransactionCard
              transaction={tx}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>

      {/* md+: table (screen readers get semantic columns) */}
      <div
        className="hidden md:block rounded-xl border border-border bg-card shadow-sm overflow-hidden"
        role="region"
        aria-label="Transaction table"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th
                  scope="col"
                  className="text-left py-3.5 pl-4 pr-2 font-medium text-foreground"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="text-right py-3.5 px-3 font-medium text-foreground"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="text-left py-3.5 px-3 font-medium text-foreground"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="text-left py-3.5 px-3 font-medium text-foreground"
                >
                  Description
                </th>
                <th scope="col" className="w-[88px] pr-4">
                  <span className="sr-only">Actions</span>
                </th>
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
      </div>
    </div>
  )
}
