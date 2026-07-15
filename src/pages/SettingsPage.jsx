import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Save,
  Instagram,
  Facebook,
  MessageCircle,
  CreditCard,
  CalendarDays,
  RotateCcw,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useStore } from '@/lib/store';
import { setLanguage } from '@/i18n';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'BGN'];
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'bg', label: 'Български' },
];

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resetDemo = useStore((s) => s.resetDemo);

  const [profile, setProfile] = useState({
    studioName: settings.studioName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
  });
  const [rules, setRules] = useState({
    openTime: settings.openTime,
    closeTime: settings.closeTime,
    defaultSessionMinutes: settings.defaultSessionMinutes,
    depositPercent: settings.depositPercent,
    currency: settings.currency,
  });
  const [resetConfirm, setResetConfirm] = useState(false);

  const saveProfile = (e) => {
    e.preventDefault();
    setSettings(profile);
    toast({ title: t('settings.profile.savedToast') });
  };

  const saveRules = (e) => {
    e.preventDefault();
    setSettings({
      ...rules,
      defaultSessionMinutes: Number(rules.defaultSessionMinutes) || 60,
      depositPercent: Math.min(100, Math.max(0, Number(rules.depositPercent) || 0)),
    });
    toast({ title: t('settings.business.savedToast') });
  };

  const toggleNotification = (key, value) => {
    setSettings({ notifications: { ...settings.notifications, [key]: value } });
    toast({ title: t('settings.notifications.updatedToast') });
  };

  const changeLanguage = (code) => {
    setLanguage(code);
    toast({ title: t('settings.language.changedToast') });
  };

  const confirmReset = () => {
    resetDemo();
    setProfile({
      studioName: 'InkSync Studio',
      address: '48 Rivington St, London',
      phone: '+44 20 7946 0321',
      email: 'hello@inksync.studio',
    });
    setRules({
      openTime: '10:00',
      closeTime: '20:00',
      defaultSessionMinutes: 120,
      depositPercent: 30,
      currency: 'EUR',
    });
    setResetConfirm(false);
    toast({ title: t('settings.danger.resetToast') });
  };

  const integrations = [
    { key: 'instagram', icon: Instagram },
    { key: 'whatsapp', icon: MessageCircle },
    { key: 'facebook', icon: Facebook },
    { key: 'stripe', icon: CreditCard },
    { key: 'googleCalendar', icon: CalendarDays },
  ];

  const notificationKeys = ['appointmentReminders', 'lowStock', 'newClients'];

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <div className="grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Studio profile */}
        <motion.div {...fade}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-xl">{t('settings.profile.title')}</CardTitle>
              <CardDescription>{t('settings.profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studio-name">{t('settings.profile.studioName')}</Label>
                  <Input
                    id="studio-name"
                    value={profile.studioName}
                    onChange={(e) => setProfile((p) => ({ ...p, studioName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studio-address">{t('settings.profile.address')}</Label>
                  <Input
                    id="studio-address"
                    value={profile.address}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="studio-phone">{t('settings.profile.phone')}</Label>
                    <Input
                      id="studio-phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studio-email">{t('settings.profile.email')}</Label>
                    <Input
                      id="studio-email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Business rules */}
        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.05 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {t('settings.business.title')}
              </CardTitle>
              <CardDescription>{t('settings.business.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveRules} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="open-time">{t('settings.business.openTime')}</Label>
                    <Input
                      id="open-time"
                      type="time"
                      value={rules.openTime}
                      onChange={(e) => setRules((r) => ({ ...r, openTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close-time">{t('settings.business.closeTime')}</Label>
                    <Input
                      id="close-time"
                      type="time"
                      value={rules.closeTime}
                      onChange={(e) => setRules((r) => ({ ...r, closeTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-minutes">
                      {t('settings.business.defaultSessionMinutes')}
                    </Label>
                    <Input
                      id="session-minutes"
                      type="number"
                      min="15"
                      step="15"
                      value={rules.defaultSessionMinutes}
                      onChange={(e) =>
                        setRules((r) => ({ ...r, defaultSessionMinutes: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deposit-percent">
                      {t('settings.business.depositPercent')}
                    </Label>
                    <Input
                      id="deposit-percent"
                      type="number"
                      min="0"
                      max="100"
                      value={rules.depositPercent}
                      onChange={(e) =>
                        setRules((r) => ({ ...r, depositPercent: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.business.currency')}</Label>
                  <Select
                    value={rules.currency}
                    onValueChange={(v) => setRules((r) => ({ ...r, currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {t('settings.notifications.title')}
              </CardTitle>
              <CardDescription>{t('settings.notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {notificationKeys.map((key, i) => (
                <React.Fragment key={key}>
                  {i > 0 && <Separator />}
                  <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
                    <span>
                      <span className="block text-sm font-medium">
                        {t(`settings.notifications.${key}`)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {t(`settings.notifications.${key}Hint`)}
                      </span>
                    </span>
                    <Switch
                      checked={!!settings.notifications?.[key]}
                      onCheckedChange={(v) => toggleNotification(key, v)}
                      aria-label={t(`settings.notifications.${key}`)}
                    />
                  </label>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Language */}
        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {t('settings.language.title')}
              </CardTitle>
              <CardDescription>{t('settings.language.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const current = i18n.language === lang.code;
                  return (
                    <Button
                      key={lang.code}
                      variant={current ? 'default' : 'outline'}
                      onClick={() => changeLanguage(lang.code)}
                      aria-pressed={current}
                    >
                      {lang.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Integrations */}
        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                {t('settings.integrations.title')}
              </CardTitle>
              <CardDescription>{t('settings.integrations.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {integrations.map(({ key, icon: Icon }, i) => (
                <React.Fragment key={key}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{t(`settings.integrations.${key}`)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t(`settings.integrations.${key}Hint`)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant="outline"
                        className="hidden font-normal text-muted-foreground sm:inline-flex"
                      >
                        {t('settings.integrations.comingSoon')}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        title={t('settings.integrations.comingSoon')}
                        className="border-border/60 bg-muted/40 text-muted-foreground"
                      >
                        {t('settings.integrations.connect')}
                      </Button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger zone */}
        <motion.div {...fade} transition={{ ...fade.transition, delay: 0.25 }}>
          <Card className="h-full border-destructive/40">
            <CardHeader>
              <CardTitle className="font-display text-xl text-destructive">
                {t('settings.danger.title')}
              </CardTitle>
              <CardDescription>{t('settings.danger.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-sm text-sm text-muted-foreground">
                {t('settings.danger.resetHint')}
              </p>
              <Button variant="destructive" onClick={() => setResetConfirm(true)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('settings.danger.reset')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {t('settings.danger.resetTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.danger.resetDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmReset}
            >
              {t('settings.danger.reset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
