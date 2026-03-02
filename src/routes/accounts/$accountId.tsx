import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/accounts/$accountId')({
  component: AccountDetailPage,
})

function AccountDetailPage() {
  const { accountId } = Route.useParams()

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link
          to="/accounts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to accounts
        </Link>
      </div>
      <p className="text-muted-foreground">
        Transactions for account <code className="rounded bg-muted px-1">{accountId}</code> will
        be available here.
      </p>
    </div>
  )
}
