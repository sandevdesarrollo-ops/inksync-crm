import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const emptyForm = {
  name: '',
  role: 'artist',
  stylesText: '',
  phone: '',
  email: '',
  hourlyRate: 100,
  schedule: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false },
};

// Add/edit form for a team member. Pass `member` to edit, omit to create.
export default function MemberDialog({ open, onOpenChange, member, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(false);
    setForm(
      member
        ? {
            name: member.name,
            role: member.role,
            stylesText: (member.styles || []).join(', '),
            phone: member.phone || '',
            email: member.email || '',
            hourlyRate: member.hourlyRate ?? 0,
            schedule: { ...emptyForm.schedule, ...member.schedule },
          }
        : emptyForm
    );
  }, [open, member]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleDay = (day, checked) =>
    setForm((f) => ({ ...f, schedule: { ...f.schedule, [day]: !!checked } }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(true);
      return;
    }
    onSubmit({
      name: form.name.trim(),
      role: form.role,
      styles: form.stylesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      phone: form.phone.trim(),
      email: form.email.trim(),
      hourlyRate: Number(form.hourlyRate) || 0,
      schedule: form.schedule,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {member ? t('team.editMember') : t('team.addTitle')}
          </DialogTitle>
          <DialogDescription>
            {member ? t('team.editDescription') : t('team.addDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">{t('team.form.name')}</Label>
            <Input
              id="member-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder={t('team.form.namePlaceholder')}
              aria-invalid={error && !form.name.trim()}
              className={error && !form.name.trim() ? 'border-destructive' : undefined}
            />
            {error && !form.name.trim() && (
              <p className="text-xs text-destructive">{t('team.nameRequired')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('team.form.role')}</Label>
              <Select value={form.role} onValueChange={(v) => set('role', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">{t('team.roles.owner')}</SelectItem>
                  <SelectItem value="artist">{t('team.roles.artist')}</SelectItem>
                  <SelectItem value="apprentice">{t('team.roles.apprentice')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-rate">{t('team.form.hourlyRate')}</Label>
              <Input
                id="member-rate"
                type="number"
                min="0"
                step="5"
                value={form.hourlyRate}
                onChange={(e) => set('hourlyRate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-styles">{t('team.form.styles')}</Label>
            <Input
              id="member-styles"
              value={form.stylesText}
              onChange={(e) => set('stylesText', e.target.value)}
              placeholder={t('team.form.stylesPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('team.form.stylesHint')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="member-phone">{t('team.form.phone')}</Label>
              <Input
                id="member-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">{t('team.form.email')}</Label>
              <Input
                id="member-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('team.form.workingDays')}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DAY_KEYS.map((day) => (
                <label
                  key={day}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm transition-colors duration-200 hover:bg-accent"
                >
                  <Checkbox
                    checked={form.schedule[day]}
                    onCheckedChange={(c) => toggleDay(day, c)}
                  />
                  <span className="truncate">{t(`team.daysFull.${day}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
