import type { Transaction } from '@/types/ledger'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { formatAmount } from '@/utils/format'

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

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{formatAmount(totalIncome)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{formatAmount(totalExpenses)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Net Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{formatAmount(netBalance)}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionOverview
