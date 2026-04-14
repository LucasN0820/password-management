import { Home, Key, Search, Shield } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/ui/primitives/sidebar'
import { useTranslation } from '@repo/i18n'
import { NavUser } from './NavUser'

export function AppSidebar() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { title: t('nav.home'), url: '/', icon: Home },
    { title: t('nav.passwords'), url: '/password', icon: Key },
    { title: t('nav.generator'), url: '/generator', icon: Shield },
  ]

  const user = {
    name: 'Lucas',
    email: 'lucas@passvault.app',
    avatar: '',
  }

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="px-4 py-3">
        <a
          href="/"
          className="flex items-center gap-2 no-underline"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
        >
          <span className="text-xl">🔐</span>
          <span className="font-heading text-xl font-bold text-foreground">
            {t('app.name')}
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.url === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.url)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="h-9 px-3 rounded-lg transition-colors duration-150"
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3 space-y-2">
        <button
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors duration-150"
          onClick={() => navigate('/search')}
        >
          <Search className="h-4 w-4" />
          <span>{t('nav.quickSearch')}</span>
          <kbd className="ml-auto font-mono text-[10px] text-text-tertiary bg-surface px-1.5 py-0.5 rounded border border-border">
            ⌘⇧P
          </kbd>
        </button>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
