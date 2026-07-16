import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, supabaseEnabled } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import AuthPage from '@/pages/AuthPage';

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="font-display text-lg">InkSync</span>
      </div>
    </div>
  );
}

// Remote mode: session required, store hydrated from Supabase before render.
// Local mode (no env vars): straight through to the demo app.
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = checking
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    if (!supabaseEnabled) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (supabaseEnabled && session && !hydrated) hydrate();
  }, [session, hydrated, hydrate]);

  if (!supabaseEnabled) return children;
  if (session === undefined) return <Splash />;
  if (!session) return <AuthPage />;
  if (!hydrated) return <Splash />;
  return children;
}
