import { createFileRoute } from '@tanstack/react-router'
import { AccountTransactionsPanel } from '@/components/transactions/AccountTransactionsPanel'
import { InsetPage } from '@/components/layout/InsetPage'

export const Route = createFileRoute('/account/$accountId')({
  component: AccountTransactionsPage,
})

function AccountTransactionsPage() {
  const { accountId } = Route.useParams()

  return (
    <InsetPage>
      <AccountTransactionsPanel accountId={accountId} />
    </InsetPage>
  )
}
