import type { Transaction } from '@/types/ledger'
import { Button } from '@/components/ui/button'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { formatAmount, formatDate } from '@/utils/format'

type TransactionRowProps = {
  transaction: Transaction
  onEdit: (t: Transaction) => void
  onDelete: (t: Transaction) => void
}

export function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income'

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap pl-4">
        {formatDate(transaction.date)}
      </td>
      <td className="py-3 px-4 text-right">
        <span
          className={cn(
            isIncome
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400',
          )}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </span>
      </td>
      <td className="py-3 px-4 capitalize">{transaction.type}</td>
      <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
        {transaction.description || '—'}
      </td>
      <td className="py-3 pl-2 flex gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(transaction)}
          aria-label={`Edit transaction ${transaction.id}`}
        >
          <IconEdit className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(transaction)}
          aria-label={`Delete transaction ${transaction.id}`}
        >
          <IconTrash className="size-4" />
        </Button>
      </td>
    </tr>
  )
}
