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

function TypeBadge({ type }: { type: Transaction['type'] }) {
  const isIncome = type === 'income'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        isIncome
          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
          : 'bg-rose-500/15 text-rose-800 dark:text-rose-300',
      )}
    >
      {type}
    </span>
  )
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income'

  return (
    <article
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-sm',
        'transition-shadow duration-200 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <time
              className="text-sm text-muted-foreground"
              dateTime={transaction.date}
            >
              {formatDate(transaction.date)}
            </time>
            <TypeBadge type={transaction.type} />
          </div>
          <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
            {transaction.description.trim() || (
              <span className="text-muted-foreground">No description</span>
            )}
          </p>
        </div>
        <p
          className={cn(
            'shrink-0 text-right text-base font-semibold tabular-nums',
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
          )}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </p>
      </div>
      <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(transaction)}
          aria-label={`Edit transaction ${transaction.id}`}
          className="cursor-pointer min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
        >
          <IconEdit className="size-4" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:text-destructive cursor-pointer min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
          onClick={() => onDelete(transaction)}
          aria-label={`Delete transaction ${transaction.id}`}
        >
          <IconTrash className="size-4" aria-hidden />
        </Button>
      </div>
    </article>
  )
}

export function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income'

  return (
    <tr className="border-b border-border last:border-0 transition-colors duration-150 hover:bg-muted/40">
      <td className="py-3.5 pl-4 pr-2 text-sm text-muted-foreground whitespace-nowrap">
        <time dateTime={transaction.date}>{formatDate(transaction.date)}</time>
      </td>
      <td className="py-3.5 px-3 text-right text-sm tabular-nums">
        <span
          className={cn(
            'font-medium',
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
          )}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </span>
      </td>
      <td className="py-3.5 px-3">
        <TypeBadge type={transaction.type} />
      </td>
      <td className="py-3.5 px-3 text-sm text-muted-foreground max-w-[min(280px,40vw)]">
        <span
          className="block truncate"
          title={transaction.description.trim() || undefined}
        >
          {transaction.description.trim() || '—'}
        </span>
      </td>
      <td className="py-3.5 pr-4 pl-2 text-right">
        <div className="inline-flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(transaction)}
            aria-label={`Edit transaction ${transaction.id}`}
            className="cursor-pointer"
          >
            <IconEdit className="size-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive cursor-pointer"
            onClick={() => onDelete(transaction)}
            aria-label={`Delete transaction ${transaction.id}`}
          >
            <IconTrash className="size-4" aria-hidden />
          </Button>
        </div>
      </td>
    </tr>
  )
}
