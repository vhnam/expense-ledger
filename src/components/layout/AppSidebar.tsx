import { useEffect } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  IconHome,
  IconLayoutDashboard,
  IconWallet,
} from '@tabler/icons-react'
import BetterAuthHeader from '@/integrations/better-auth/header-user.tsx'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

function NavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const homeActive = pathname === '/'
  const accountsActive =
    pathname === '/accounts' ||
    pathname === '/accounts/' ||
    pathname.startsWith('/account/')

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={homeActive}
              tooltip="Home"
              render={<Link to="/" onClick={onNavigate} />}
            >
              <IconHome aria-hidden />
              <span>Home</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={accountsActive}
              tooltip="Bank accounts"
              render={<Link to="/accounts" onClick={onNavigate} />}
            >
              <IconWallet aria-hidden />
              <span>Bank accounts</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const { setOpenMobile, isMobile } = useSidebar()

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link to="/" onClick={closeMobile} />}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <IconLayoutDashboard className="size-4" stroke={1.75} aria-hidden />
              </span>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Expense Ledger</span>
                <span className="truncate text-xs text-muted-foreground font-normal">
                  Dashboard
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavLinks onNavigate={closeMobile} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <BetterAuthHeader />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
