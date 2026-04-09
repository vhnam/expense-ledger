import { createFileRoute, Link } from '@tanstack/react-router'
import {
  IconWallet,
  IconListDetails,
  IconShieldLock,
} from '@tabler/icons-react'
import {
  InsetPage,
  pageEyebrowClass,
  pageTitleClass,
} from '@/components/layout/InsetPage'

export const Route = createFileRoute('/')({ component: HomePage })

const cardClass =
  'rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow duration-200 hover:shadow-md'

function HomePage() {
  return (
    <InsetPage>
      <div className="space-y-10 sm:space-y-12">
        <header className="space-y-4 max-w-2xl">
          <p className={pageEyebrowClass}>Expense Ledger</p>
          <h1 className={pageTitleClass}>Home</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Manage bank accounts and record income and expenses per account.
            Open an account from Bank accounts to view and edit its
            transactions.
          </p>
          <div className="pt-2">
            <Link
              to="/accounts"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm cursor-pointer transition-opacity duration-200 hover:opacity-90 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <IconWallet className="size-4 shrink-0" aria-hidden />
              Bank accounts
            </Link>
          </div>
        </header>

        <section
          className="grid gap-4 sm:grid-cols-2"
          aria-labelledby="home-actions-heading"
        >
          <h2 id="home-actions-heading" className="sr-only">
            What you can do
          </h2>
          <article className={cardClass}>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
              <IconWallet className="size-5" stroke={1.75} aria-hidden />
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Bank accounts
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Add, rename, or remove accounts. Each account keeps its own
              transaction history.
            </p>
            <Link
              to="/accounts"
              className="mt-4 inline-flex text-sm font-medium text-primary cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              Go to bank accounts →
            </Link>
          </article>
          <article className={cardClass}>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
              <IconListDetails className="size-5" stroke={1.75} aria-hidden />
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Transactions
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Select an account on the bank accounts page to open its ledger.
              Add, edit, or delete entries from there.
            </p>
          </article>
        </section>

        <p className="flex items-start gap-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
          <IconShieldLock
            className="size-5 shrink-0 text-muted-foreground mt-0.5"
            stroke={1.5}
            aria-hidden
          />
          <span>
            Your session is protected by authentication. Use a strong password
            and keep your environment secrets out of version control.
          </span>
        </p>
      </div>
    </InsetPage>
  )
}
