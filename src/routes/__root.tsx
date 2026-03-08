import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router'

import Header from '@/components/Header'
import { authClient } from '@/lib/auth-client'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import appCss from '@/styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

const PUBLIC_PATHS = ['/auth'] as const

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
    return true
  if (pathname.startsWith('/api/auth')) return true
  return false
}

interface AppRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
  beforeLoad: async ({ location }) => {
    if (typeof window === 'undefined') return
    if (isPublicPath(location.pathname)) return
    const result = await authClient.getSession()
    const session = result?.data ?? null
    if (!session?.user) {
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
          <Header />
          {children}
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
