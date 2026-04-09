import type { PropsWithChildren } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { IconLayoutDashboard } from '@tabler/icons-react'
import { isPublicPath } from '@/lib/auth-guards'
import { AppSidebar } from './AppSidebar'
import { InsetBreadcrumbs } from './InsetBreadcrumbs'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  if (isPublicPath(pathname)) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        id="main-content"
        tabIndex={-1}
        className="flex min-h-svh flex-col bg-background"
      >
        <header
          className={cn(
            'sticky top-0 z-40 shrink-0 border-b border-border',
            'bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/85',
          )}
        >
          <div className="container max-w-6xl mx-auto px-4 lg:px-6">
            <div className="flex flex-col gap-2 py-3 md:h-16 md:flex-row md:items-center md:gap-4 md:py-0">
              <div className="flex min-w-0 items-center gap-3">
                <SidebarTrigger className="cursor-pointer shrink-0" />
                <Link
                  to="/"
                  className="flex min-w-0 items-center gap-2 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:hidden"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <IconLayoutDashboard className="size-4" aria-hidden />
                  </span>
                  <span className="font-semibold text-foreground truncate text-sm">
                    Expense Ledger
                  </span>
                </Link>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1 border-t border-border/60 pt-2 md:border-t-0 md:pt-0">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:text-xs md:tracking-widest">
                  Dashboard
                </p>
                <InsetBreadcrumbs />
              </div>
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
