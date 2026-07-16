import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, fmtMoney } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Ruler, Clock } from 'lucide-react';

const EMPTY = [];

const emptyForm = {
  sizeCm: 12,
  placementsText: '',
  price: 200,
  durationMinutes: 120,
  active: true,
};

// "Booking options" for one design: the size/placement/price/duration variants
// clients can book on the public site. Inline list + add/edit form.
export default function VariantsSection({ designId, currency }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const variants = useStore((s) => s.variants) || EMPTY;
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  // editing: null (closed) | 'new' | an existing variant id
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(false);

  const list = variants.filter((v) => v.designId === designId);

  const openAdd = () => {
    setForm(emptyForm);
    setError(false);
    setEditing('new');
  };

  const openEdit = (v) => {
    setForm({
      sizeCm: v.sizeCm ?? 0,
      placementsText: (v.placements || []).join(', '),
      price: v.price ?? 0,
      durationMinutes: v.durationMinutes ?? 60,
      active: v.active !== false,
    });
    setError(false);
    setEditing(v.id);
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    const sizeCm = Number(form.sizeCm);
    const price = Number(form.price);
    if (!sizeCm || sizeCm <= 0 || Number.isNaN(price) || price < 0) {
      setError(true);
      return;
    }
    const payload = {
      designId,
      sizeCm,
      placements: form.placementsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
      price,
      durationMinutes: Number(form.durationMinutes) || 60,
      active: !!form.active,
    };
    if (editing === 'new') {
      add('variants', payload);
      toast({ description: t('variantsUi.optionAdded') });
    } else {
      update('variants', editing, payload);
      toast({ description: t('variantsUi.optionUpdated') });
    }
    setEditing(null);
  };

  const del = (v) => {
    remove('variants', v.id);
    if (editing === v.id) setEditing(null);
    toast({ description: t('variantsUi.optionDeleted') });
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">
            {t('variantsUi.bookingOptions')}
          </h3>
          <p className="text-xs text-muted-foreground">{t('variantsUi.bookingOptionsHint')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={openAdd} className="shrink-0">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t('variantsUi.addOption')}
        </Button>
      </div>

      {list.length === 0 && editing !== 'new' ? (
        <p className="mt-4 rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
          {t('variantsUi.noOptions')}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {list.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                {t('variantsUi.sizeValue', { size: v.sizeCm })}
              </span>
              <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                {(v.placements || []).map((p) => (
                  <Badge key={p} variant="outline" className="font-normal text-muted-foreground">
                    {p}
                  </Badge>
                ))}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {t('variantsUi.durationValue', { min: v.durationMinutes })}
              </span>
              <span className="text-sm font-semibold">{fmtMoney(v.price, currency)}</span>
              {v.active === false && (
                <Badge variant="secondary" className="font-normal">
                  {t('variantsUi.inactive')}
                </Badge>
              )}
              <span className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label={t('common.edit')}
                  onClick={() => openEdit(v)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-destructive"
                  aria-label={t('common.delete')}
                  onClick={() => del(v)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence initial={false}>
        {editing !== null && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onSubmit={submit}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 rounded-md border border-border p-3">
              <p className="text-sm font-medium">
                {editing === 'new' ? t('variantsUi.addOption') : t('variantsUi.editOption')}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="variant-size">{t('variantsUi.sizeCm')}</Label>
                  <Input
                    id="variant-size"
                    type="number"
                    min="1"
                    value={form.sizeCm}
                    onChange={(e) => set('sizeCm', e.target.value)}
                    aria-invalid={error && !(Number(form.sizeCm) > 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="variant-price">{t('variantsUi.price')}</Label>
                  <Input
                    id="variant-price"
                    type="number"
                    min="0"
                    step="10"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    aria-invalid={error && !(Number(form.price) >= 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="variant-duration">{t('variantsUi.duration')}</Label>
                  <Input
                    id="variant-duration"
                    type="number"
                    min="15"
                    step="15"
                    value={form.durationMinutes}
                    onChange={(e) => set('durationMinutes', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="variant-placements">{t('variantsUi.placements')}</Label>
                <Input
                  id="variant-placements"
                  value={form.placementsText}
                  onChange={(e) => set('placementsText', e.target.value)}
                  placeholder={t('variantsUi.placementsPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">{t('variantsUi.placementsHint')}</p>
              </div>
              {error && <p className="text-xs text-destructive">{t('variantsUi.formError')}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => set('active', v)}
                    aria-label={t('variantsUi.activeLabel')}
                  />
                  <span className="text-sm">{t('variantsUi.activeLabel')}</span>
                </label>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" size="sm">
                    {t('common.save')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
