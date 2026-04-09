import { Link, useRouterState } from '@tanstack/react-router'
import { IconChevronRight } from '@tabler/icons-react'
import { useAccount } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'

function CrumbSeparator() {
  return (
    <li aria-hidden className="flex items-center text-muted-foreground/60">
      <IconChevronRight className="size-3.5 shrink-0" stroke={2} />
    </li>
  )
}

export function InsetBreadcrumbs({ className }: { className?: string }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const accountIdMatch = pathname.match(/^\/account\/([^/]+)\/?$/)
  const accountId = accountIdMatch?.[1]
  const isAccountsIndex =
    pathname === '/accounts' || pathname === '/accounts/'
  const isHome = pathname === '/' || pathname === ''
  const isAccountPage = Boolean(accountId)

  const { data: account, isLoading: accountLoading } = useAccount(accountId, {
    enabled: isAccountPage && !!accountId,
  })

  const linkClass =
    'rounded-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer'

  const currentClass = 'truncate font-medium text-foreground'

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm leading-none">
        <li className="inline-flex min-w-0 items-center">
          {isHome ? (
            <span className={currentClass} aria-current="page">
              Home
            </span>
          ) : (
            <Link to="/" className={linkClass}>
              Home
            </Link>
          )}
        </li>

        {(isAccountsIndex || isAccountPage) && (
          <>
            <CrumbSeparator />
            <li className="inline-flex min-w-0 items-center">
              {isAccountsIndex ? (
                <span className={currentClass} aria-current="page">
                  Bank accounts
                </span>
              ) : (
                <Link to="/accounts" className={linkClass}>
                  Bank accounts
                </Link>
              )}
            </li>
          </>
        )}

        {isAccountPage && accountId && (
          <>
            <CrumbSeparator />
            <li className="inline-flex min-w-0 max-w-[min(100%,16rem)] items-center gap-1.5 sm:max-w-md">
              {accountLoading ? (
                <span
                  className="h-4 w-28 max-w-full rounded bg-muted animate-pulse motion-reduce:animate-none"
                  aria-hidden
                />
              ) : (
                <span
                  className={cn(currentClass, 'capitalize')}
                  aria-current="page"
                >
                  {account?.name ?? 'Account'}
                </span>
              )}
              {account && !accountLoading ? (
                <span className="shrink-0 text-xs font-normal text-muted-foreground capitalize">
                  ({account.type})
                </span>
              ) : null}
            </li>
          </>
        )}

        {!isHome && !isAccountsIndex && !isAccountPage && (
          <>
            <CrumbSeparator />
            <li className="inline-flex min-w-0 items-center">
              <span className={currentClass} aria-current="page">
                App
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}
