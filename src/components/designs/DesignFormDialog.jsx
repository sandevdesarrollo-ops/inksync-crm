import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Upload } from 'lucide-react';

const EMPTY = { title: '', artistId: '', style: '', bodyPart: '', price: '', image: '', tags: '' };

export default function DesignFormDialog({ open, onOpenChange, artists }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const add = useStore((s) => s.add);
  const [form, setForm] = useState(EMPTY);
  const fileRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const valid = form.title.trim() && form.artistId && form.style.trim() && form.image.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    add('designs', {
      title: form.title.trim(),
      artistId: form.artistId,
      style: form.style.trim(),
      bodyPart: form.bodyPart.trim(),
      price: Number(form.price) || 0,
      image: form.image.trim(),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      likes: 0,
    });
    toast({ description: t('designs.form.added') });
    setForm(EMPTY);
    onOpenChange(false);
  };

  const handleOpenChange = (v) => {
    if (!v) setForm(EMPTY);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{t('designs.form.addTitle')}</DialogTitle>
          <DialogDescription>{t('designs.form.addDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="design-title">{t('designs.form.title')}</Label>
            <Input
              id="design-title"
              value={form.title}
              onChange={set('title')}
              placeholder={t('designs.form.titlePlaceholder')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('designs.form.artist')}</Label>
              <Select
                value={form.artistId}
                onValueChange={(v) => setForm((f) => ({ ...f, artistId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('designs.form.selectArtist')} />
                </SelectTrigger>
                <SelectContent>
                  {artists.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="design-style">{t('designs.form.style')}</Label>
              <Input
                id="design-style"
                value={form.style}
                onChange={set('style')}
                placeholder={t('designs.form.stylePlaceholder')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="design-bodypart">{t('designs.form.bodyPart')}</Label>
              <Input
                id="design-bodypart"
                value={form.bodyPart}
                onChange={set('bodyPart')}
                placeholder={t('designs.form.bodyPartPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="design-price">{t('designs.form.price')}</Label>
              <Input
                id="design-price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={set('price')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="design-image">{t('designs.form.imageUrl')}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="design-image"
                value={form.image.startsWith('data:') ? '' : form.image}
                onChange={set('image')}
                placeholder={t('designs.form.imageUrlPlaceholder')}
              />
              <span className="text-xs text-muted-foreground">{t('designs.form.or')}</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {t('designs.form.upload')}
              </Button>
            </div>
            {form.image && (
              <div className="pt-1">
                <p className="mb-1 text-xs text-muted-foreground">{t('designs.form.preview')}</p>
                <img
                  src={form.image}
                  alt=""
                  className="h-28 w-28 rounded-md border border-border object-cover"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="design-tags">{t('designs.form.tags')}</Label>
            <Input
              id="design-tags"
              value={form.tags}
              onChange={set('tags')}
              placeholder={t('designs.form.tagsPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('designs.form.tagsHint')}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!valid}>
              {t('designs.form.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
