import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const { t } = useTranslation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', studioName: '', fullName: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const field = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { studio_name: form.studioName || 'My Studio', full_name: form.fullName } },
        });
        if (error) throw error;
        if (data.user && !data.session) setNotice(t('auth.confirmEmail'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary font-display text-xl font-bold text-primary-foreground">I</div>
          <div>
            <p className="font-display text-2xl font-semibold leading-tight">InkSync</p>
            <p className="text-sm text-muted-foreground">{t('auth.tagline')}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h1 className="mb-1 font-display text-xl font-semibold">
            {mode === 'login' ? t('auth.loginTitle') : t('auth.signupTitle')}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {mode === 'login' ? t('auth.loginSub') : t('auth.signupSub')}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="studioName">{t('auth.studioName')}</Label>
                  <Input id="studioName" required placeholder="Iron & Ink Madrid" {...field('studioName')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                  <Input id="fullName" required placeholder="Alex Sandev" {...field('fullName')} />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" required autoComplete="email" {...field('email')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input id="password" type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} {...field('password')} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {notice && <p className="text-sm text-success">{notice}</p>}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' ? t('auth.loginCta') : t('auth.signupCta')}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setNotice(null); }}
            className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === 'login' ? t('auth.switchToSignup') : t('auth.switchToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
