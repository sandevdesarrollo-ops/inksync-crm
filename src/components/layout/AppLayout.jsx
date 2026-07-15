import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Crosshair, BarChart3, CalendarDays, Users, Palette,
  FileText, MessageSquare, HeartHandshake, Package, UserCog, Settings,
  Menu, Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/toaster';
import { setLanguage } from '@/i18n';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const NAV = [
  { group: 'overview', items: [
    { to: '/', key: 'dashboard', icon: LayoutDashboard },
    { to: '/activity', key: 'activity', icon: Crosshair },
    { to: '/reports', key: 'reports', icon: BarChart3 },
  ]},
  { group: 'studio', items: [
    { to: '/calendar', key: 'calendar', icon: CalendarDays },
    { to: '/clients', key: 'clients', icon: Users },
    { to: '/designs', key: 'designs', icon: Palette },
    { to: '/proposals', key: 'proposals', icon: FileText },
    { to: '/messages', key: 'messages', icon: MessageSquare },
    { to: '/nurture', key: 'nurture', icon: HeartHandshake },
  ]},
  { group: 'operations', items: [
    { to: '/inventory', key: 'inventory', icon: Package },
    { to: '/team', key: 'team', icon: UserCog },
    { to: '/settings', key: 'settings', icon: Settings },
  ]},
];

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'bg', label: 'Български' },
];

function Nav({ onNavigate }) {
  const { t } = useTranslation();
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {NAV.map(({ group, items }) => (
        <div key={group}>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t(`nav.${group}`)}
          </p>
          <div className="space-y-0.5">
            {items.map(({ to, key, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(`nav.${key}`)}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarInner({ onNavigate }) {
  const { t } = useTranslation();
  const studioName = useStore((s) => s.settings.studioName);
  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-3 px-5 py-5 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-lg font-bold">
          I
        </div>
        <div>
          <p className="font-display text-lg font-semibold leading-tight">{t('app.name')}</p>
          <p className="text-xs text-muted-foreground leading-tight">{studioName}</p>
        </div>
      </div>
      <Nav onNavigate={onNavigate} />
    </div>
  );
}

export default function AppLayout() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden lg:block w-64 shrink-0 border-r">
        <div className="sticky top-0 h-screen">
          <SidebarInner />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarInner onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Languages className="h-4 w-4" />
                {i18n.language.toUpperCase()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGS.map(({ code, label }) => (
                <DropdownMenuItem key={code} onClick={() => setLanguage(code)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
