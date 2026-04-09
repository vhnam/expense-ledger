import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

/** Shared horizontal + vertical rhythm for SidebarInset main (matches header `max-w-6xl`). */
export const insetPageContainerClass = cn(
  'container max-w-6xl mx-auto px-4 py-6 sm:py-8 lg:px-6',
)

export const pageEyebrowClass =
  'text-xs font-semibold uppercase tracking-widest text-muted-foreground'

export const pageTitleClass =
  'text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'

type InsetPageProps = PropsWithChildren<{
  className?: string
}>

export function InsetPage({ children, className }: InsetPageProps) {
  return (
    <div className={cn(insetPageContainerClass, 'min-h-full', className)}>
      {children}
    </div>
  )
}
