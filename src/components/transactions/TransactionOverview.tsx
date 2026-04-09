import type { Transaction } from '@/types/ledger'
import { Card, CardContent } from '../ui/card'
import { formatAmount } from '@/utils/format'
import {
  IconTrendingDown,
  IconTrendingUp,
  IconScale,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface TransactionOverviewProps {
  transactions: Transaction[]
}

const TransactionOverview = ({ transactions }: TransactionOverviewProps) => {
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((acc, tx) => acc + Number(tx.amount), 0)
  const totalExpenses = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => acc + Number(tx.amount), 0)
  const netBalance = totalIncome - totalExpenses

  const items = [
    {
      label: 'Income',
      value: formatAmount(totalIncome),
      icon: IconTrendingUp,
      accent:
        'border-l-emerald-500/80 dark:border-l-emerald-400/90 bg-emerald-500/[0.06] dark:bg-emerald-400/[0.08]',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Expenses',
      value: formatAmount(totalExpenses),
      icon: IconTrendingDown,
      accent:
        'border-l-rose-500/80 dark:border-l-rose-400/90 bg-rose-500/[0.06] dark:bg-rose-400/[0.08]',
      iconClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Net balance',
      value: formatAmount(netBalance),
      icon: IconScale,
      accent:
        'border-l-primary/70 bg-primary/[0.06] dark:bg-primary/[0.12]',
      iconClass: 'text-primary',
    },
  ] as const

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      aria-label="Transaction summary"
    >
      {items.map(({ label, value, icon: Icon, accent, iconClass }) => (
        <Card
          key={label}
          className={cn(
            'overflow-hidden border-border shadow-sm transition-shadow duration-200 hover:shadow-md',
            'border-l-4',
            accent,
          )}
        >
          <CardContent className="flex items-start gap-4 p-5">
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/80 dark:bg-background/40',
                iconClass,
              )}
              aria-hidden
            >
              <Icon className="size-5" stroke={1.75} />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p
                className="text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl"
                aria-live="polite"
              >
                {value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default TransactionOverview
