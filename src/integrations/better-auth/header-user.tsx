import { authClient } from '@/lib/auth-client'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  IconSelector,
  IconLogin,
  IconLogout,
  IconUser,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const signInClass = cn(
  'inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
  'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm',
  'transition-opacity duration-200 cursor-pointer hover:opacity-90',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
)

const accountSurfaceClass = cn('bg-sidebar text-sidebar-foreground')

const accountTriggerClass = cn(
  accountSurfaceClass,
  'flex w-full min-h-11 items-center gap-3 rounded-lg text-left',
  'cursor-pointer transition-colors duration-200',
  'hover:bg-sidebar-accent/40',
)

const accountMenuItemClass = cn(
  'cursor-pointer text-sidebar-foreground',
  'focus:bg-sidebar-accent focus:text-sidebar-accent-foreground',
  'data-highlighted:bg-sidebar-accent data-highlighted:text-sidebar-accent-foreground',
)

function UserAvatar({
  image,
  label,
  size = 'md',
}: {
  image?: string | null
  label: string
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 'size-8 text-xs' : 'size-9 text-sm'
  if (image) {
    return (
      <img
        src={image}
        alt=""
        className={cn(
          'shrink-0 rounded-full object-cover ring-1 ring-sidebar-border/80',
          dim,
        )}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-sidebar-accent font-semibold text-sidebar-accent-foreground ring-1 ring-sidebar-border/80',
        dim,
      )}
      aria-hidden
    >
      {label.charAt(0).toUpperCase()}
    </div>
  )
}

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  if (isPending) {
    return (
      <div className="p-1" aria-busy="true" aria-label="Loading account">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-0',
            accountSurfaceClass,
          )}
        >
          <div className="size-9 shrink-0 rounded-full bg-sidebar-accent/50 animate-pulse motion-reduce:animate-none" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-24 max-w-full rounded bg-sidebar-accent/50 animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-32 max-w-full rounded bg-sidebar-accent/40 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="size-8 shrink-0 rounded-md bg-sidebar-accent/40 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    )
  }

  if (session?.user) {
    const nameStr =
      typeof session.user.name === 'string' ? session.user.name.trim() : ''
    const displayName =
      nameStr ||
      (typeof session.user.email === 'string'
        ? session.user.email.split('@')[0]
        : '') ||
      'Account'
    const email =
      typeof session.user.email === 'string' ? session.user.email : null

    return (
      <div className="p-1">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className={accountTriggerClass}>
            <UserAvatar image={session.user.image} label={displayName} />
            <div className="min-w-0 flex-1 leading-snug">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {displayName}
              </p>
              {email ? (
                <p className="truncate text-xs text-sidebar-foreground/65">
                  {email}
                </p>
              ) : null}
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70">
              <IconSelector className="size-4" aria-hidden />
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="end"
            sideOffset={8}
            className={cn(
              'min-w-56 rounded-xl border-sidebar-border bg-sidebar p-0 text-sidebar-foreground',
              'ring-1 ring-sidebar-border/80',
            )}
          >
            <div
              className={cn(
                'flex items-center gap-3 border-b border-sidebar-border px-3 py-3',
                'bg-sidebar-accent/25',
              )}
            >
              <UserAvatar
                image={session.user.image}
                label={displayName}
                size="sm"
              />
              <div className="min-w-0 flex-1 leading-snug">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {displayName}
                </p>
                {email ? (
                  <p className="truncate text-xs text-sidebar-foreground/65">
                    {email}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="p-1">
              <DropdownMenuItem
                className={accountMenuItemClass}
                onClick={() => {
                  void navigate({ to: '/' })
                }}
              >
                <IconUser className="size-4 opacity-70" aria-hidden />
                Account
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-sidebar-border" />

            <div className="p-1">
              <DropdownMenuItem
                className={accountMenuItemClass}
                onClick={() => {
                  void authClient
                    .signOut()
                    .then(() => navigate({ to: '/auth' }))
                }}
              >
                <IconLogout className="size-4 opacity-70" aria-hidden />
                Log out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="p-1">
      <Link to="/auth" className={signInClass}>
        <IconLogin className="size-4 shrink-0 opacity-90" aria-hidden />
        Sign in
      </Link>
    </div>
  )
}
