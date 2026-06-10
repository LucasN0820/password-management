import { Bot, Home, Key, Search, Settings, Shield } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from '@repo/i18n';
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
} from '@repo/ui/primitives/sidebar';

export function AppSidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(
    () => { return [
      { title: t('nav.home'), url: '/', icon: Home },
      { title: t('nav.passwords'), url: '/password', icon: Key },
      { title: t('nav.generator'), url: '/generator', icon: Shield },
      { title: 'AI Import', url: '/onboard', icon: Bot },
    ] },
    [t]
  );

  return (
    <Sidebar className='top-[25px] h-[calc(100svh-25px)] border-r border-sidebar-border bg-sidebar'>
      <SidebarHeader className='px-4 py-4'>
        <a
          href='/'
          className='flex items-center gap-3 no-underline'
          onClick={e => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <img
            alt=''
            aria-hidden='true'
            className='h-9 w-9 rounded-lg object-cover'
            src='/icon-512.png'
          />
          <span className='font-heading text-2xl font-semibold tracking-tight text-foreground'>
            {t('app.name')}
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent className='px-2'>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => {
                const isActive =
                  item.url === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className='h-10 rounded-md px-3 text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-selected-bg data-[active=true]:text-foreground'
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className='h-4 w-4' />
                      <span className='text-sm'>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='space-y-2 px-2 pb-3'>
        <button
          className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          onClick={() => navigate('/search')}
        >
          <Search className='h-4 w-4' />
          <span>{t('nav.quickSearch')}</span>
          <kbd className='ml-auto rounded border border-sidebar-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary'>
            ⌘⇧P
          </kbd>
        </button>
        <button
          className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
            location.pathname.startsWith('/settings')
              ? 'bg-selected-bg text-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }`}
          onClick={() => navigate('/settings')}
        >
          <Settings className='h-4 w-4' />
          <span>Settings</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
