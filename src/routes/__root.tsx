import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import Header from '@/components/Header'

import TanStackQueryProvider from '../integrations/tanstack-query/root-provider'

import appCss from '@/styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

interface AppRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<AppRouterContext>()({
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
