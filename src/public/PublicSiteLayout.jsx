import React, { useEffect, useState } from 'react';
import { Outlet, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Instagram, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/toaster';
import { supabaseEnabled } from '@/lib/supabase';
import { fetchPublicStudio } from '@/lib/publicApi';
import { setLanguage } from '@/i18n';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'bg', label: 'Български' },
];

// Loads the studio bundle once and shares it with child pages via context.
export default function PublicSiteLayout() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const [bundle, setBundle] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    if (!supabaseEnabled) { setBundle(null); return; }
    fetchPublicStudio(slug).then(setBundle).catch(() => setBundle(null));
  }, [slug]);

  if (bundle === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (bundle === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-display text-3xl font-semibold">404</p>
        <p className="text-muted-foreground">{t('public.notFound')}</p>
      </div>
    );
  }

  const { studio } = bundle;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 lg:px-6">
          <Link to={`/s/${slug}`} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-display text-lg font-bold text-primary-foreground">
              {studio.name.charAt(0)}
            </div>
            <span className="font-display text-xl font-semibold">{studio.name}</span>
          </Link>
          <div className="flex items-center gap-1">
            {studio.instagram_handle && (
              <Button variant="ghost" size="icon" asChild aria-label="Instagram">
                <a href={`https://instagram.com/${studio.instagram_handle.replace('@', '')}`} target="_blank" rel="noreferrer">
                  <Instagram className="h-4 w-4" />
                </a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Languages className="h-4 w-4" />
                  {i18n.language.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {LANGS.map(({ code, label }) => (
                  <DropdownMenuItem key={code} onClick={() => setLanguage(code)}>{label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild size="sm" className="ml-2">
              <Link to={`/s/${slug}/book`}>{t('public.bookNow')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 lg:px-6">
        <Outlet context={bundle} />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground lg:px-6">
          <span>{studio.name} · {studio.address}</span>
          <span>{t('public.poweredBy')} <span className="font-display font-semibold text-foreground">InkSync</span></span>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
