import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router'

import AppShell from '@/components/layout/AppShell'
import { authClient } from '@/lib/auth-client'
import { hasAuthenticatedUser, isPublicPath } from '@/lib/auth-guards'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import appCss from '@/styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AppRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  beforeLoad: async ({ location }) => {
    if (typeof window === 'undefined') return
    if (isPublicPath(location.pathname)) return
    const result = await authClient.getSession()
    if (!hasAuthenticatedUser(result)) {
      throw redirect({ to: '/auth' })
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TanStackQueryProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </TanStackQueryProvider>
        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div>
      <h1>Not Found</h1>
    </div>
  )
}
