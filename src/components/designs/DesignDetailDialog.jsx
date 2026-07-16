import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, fmtMoney } from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import VariantsSection from '@/components/designs/VariantsSection';
import { Heart, Trash2, Sparkles, Globe } from 'lucide-react';

export default function DesignDetailDialog({ design, artist, currency, open, onOpenChange, onTryOn }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);

  if (!design) return null;

  const like = () => update('designs', design.id, { likes: (design.likes || 0) + 1 });

  const togglePublished = (published) => {
    update('designs', design.id, { published });
    toast({
      description: published
        ? t('variantsUi.designPublishedToast')
        : t('variantsUi.designUnpublishedToast'),
    });
  };

  const del = () => {
    remove('designs', design.id);
    toast({ description: t('designs.detail.deleted') });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{design.title}</DialogTitle>
          <DialogDescription>
            {artist ? t('designs.detail.by', { name: artist.name }) : design.style}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          <img
            src={design.image}
            alt={design.title}
            className="w-full rounded-lg border border-border object-cover"
          />

          <div className="flex flex-col gap-4">
            {artist && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={artist.avatar} alt={artist.name} />
                  <AvatarFallback>{artist.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{artist.name}</p>
                  <p className="text-xs text-muted-foreground">{artist.styles?.join(' · ')}</p>
                </div>
              </div>
            )}

            <Separator />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t('designs.detail.style')}</dt>
                <dd className="mt-0.5">
                  <Badge variant="secondary">{design.style}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('designs.detail.bodyPart')}</dt>
                <dd className="mt-0.5 font-medium">{design.bodyPart || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('designs.detail.price')}</dt>
                <dd className="mt-0.5 font-display text-xl font-semibold">
                  {fmtMoney(design.price, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('designs.detail.tags')}</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {design.tags?.length
                    ? design.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    : '—'}
                </dd>
              </div>
            </dl>

            <Separator />

            <label className="flex cursor-pointer items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {t('variantsUi.designPublished')}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {t('variantsUi.designPublishedHint')}
                  </span>
                </span>
              </span>
              <Switch
                checked={!!design.published}
                onCheckedChange={togglePublished}
                aria-label={t('variantsUi.designPublished')}
              />
            </label>

            <div className="mt-auto flex flex-col gap-2">
              <Button onClick={() => onTryOn(design)}>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('designs.detail.tryOn')}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={like}>
                  <Heart className="mr-2 h-4 w-4" />
                  {t('designs.likes', { count: design.likes || 0 })}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('designs.detail.deleteTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('designs.detail.deleteText', { title: design.title })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={del}
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        <VariantsSection designId={design.id} currency={currency} />
      </DialogContent>
    </Dialog>
  );
}
