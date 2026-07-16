import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Download, Move, ImagePlus, Loader2, ArrowRight } from 'lucide-react';
import { submitTryonLead } from '@/lib/publicApi';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

// Public virtual try-on: client photo as background, design blended on
// top (multiply), draggable + scalable + rotatable. Downloading the
// preview or jumping to booking is email-gated via submitTryonLead.
export default function PublicTryOn({ design, studio, open, onOpenChange }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 }); // relative to stage
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(90);
  const [exporting, setExporting] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const fileRef = useRef(null);

  const reset = () => {
    setPhoto(null);
    setPos({ x: 0.5, y: 0.5 });
    setScale(1);
    setRotation(0);
    setOpacity(90);
    setEmail('');
    setSending(false);
    setUnlocked(false);
  };

  const handleOpenChange = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setPos({ x: 0.5, y: 0.5 });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Pointer events work for both mouse and touch (touch-action: none).
  const onPointerDown = (e) => {
    e.preventDefault();
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage) return;
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      w: stage.width,
      h: stage.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    setPos({
      x: Math.min(1, Math.max(0, d.origX + (e.clientX - d.startX) / d.w)),
      y: Math.min(1, Math.max(0, d.origY + (e.clientY - d.startY) / d.h)),
    });
  };

  const onPointerUp = (e) => {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
  };

  const unlock = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email) || sending) return;
    setSending(true);
    try {
      await submitTryonLead({ studioId: studio.id, designId: design.id, email });
      setUnlocked(true);
      toast({ description: t('publicSite.tryOn.unlockedToast') });
    } catch {
      toast({ variant: 'destructive', description: t('publicSite.tryOn.submitError') });
    } finally {
      setSending(false);
    }
  };

  const goBook = () => {
    handleOpenChange(false);
    navigate(
      `/s/${studio.slug}/book?design=${design.id}${design.artist_id ? `&artist=${design.artist_id}` : ''}`,
    );
  };

  const download = async () => {
    if (!photo || !stageRef.current || !design) return;
    setExporting(true);
    try {
      const stage = stageRef.current.getBoundingClientRect();
      const dpr = 2;
      const W = Math.round(stage.width * dpr);
      const H = Math.round(stage.height * dpr);
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      const [photoImg, designImg] = await Promise.all([
        loadImage(photo),
        loadImage(design.image),
      ]);
      ctx.fillStyle = '#0c0f16';
      ctx.fillRect(0, 0, W, H);
      // object-contain math, mirroring the CSS layout
      const pr = Math.min(W / photoImg.naturalWidth, H / photoImg.naturalHeight);
      const pw = photoImg.naturalWidth * pr;
      const ph = photoImg.naturalHeight * pr;
      ctx.drawImage(photoImg, (W - pw) / 2, (H - ph) / 2, pw, ph);
      const dw = W * 0.45 * scale;
      const dh = dw * (designImg.naturalHeight / designImg.naturalWidth);
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = opacity / 100;
      ctx.translate(pos.x * W, pos.y * H);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(designImg, -dw / 2, -dh / 2, dw, dh);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${design.title.replace(/\s+/g, '-').toLowerCase()}-preview.png`;
      a.click();
    } catch {
      toast({ variant: 'destructive', description: t('publicSite.tryOn.downloadError') });
    } finally {
      setExporting(false);
    }
  };

  if (!design) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {t('publicSite.tryOn.title')} — {design.title}
          </DialogTitle>
          <DialogDescription>{t('publicSite.tryOn.description')}</DialogDescription>
        </DialogHeader>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

        {!photo ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-64 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-muted-foreground transition-colors duration-200 hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">{t('publicSite.tryOn.uploadPhoto')}</span>
            <span className="px-6 text-xs">{t('publicSite.tryOn.uploadHint')}</span>
          </button>
        ) : (
          <div className="space-y-4">
            <div
              ref={stageRef}
              className="relative h-[38vh] w-full select-none overflow-hidden rounded-lg bg-[#0c0f16]"
            >
              <img
                src={photo}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-contain"
              />
              <img
                src={design.image}
                alt={design.title}
                draggable={false}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="absolute cursor-move touch-none"
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  width: `${45 * scale}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  mixBlendMode: 'multiply',
                  opacity: opacity / 100,
                }}
              />
              <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                <Move className="h-3 w-3" />
                {t('publicSite.tryOn.dragHint')}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('publicSite.tryOn.scale')}</Label>
                <Slider value={[scale]} min={0.2} max={2.5} step={0.05} onValueChange={([v]) => setScale(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('publicSite.tryOn.rotation')}</Label>
                <Slider value={[rotation]} min={-180} max={180} step={1} onValueChange={([v]) => setRotation(v)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('publicSite.tryOn.opacity')}</Label>
                <Slider value={[opacity]} min={20} max={100} step={1} onValueChange={([v]) => setOpacity(v)} />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              {!unlocked ? (
                <form onSubmit={unlock} className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('publicSite.tryOn.gateText')}</p>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('publicSite.tryOn.emailPlaceholder')}
                      className="min-w-0 flex-1"
                    />
                    <Button type="submit" disabled={!EMAIL_RE.test(email) || sending}>
                      {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      {t('publicSite.tryOn.unlock')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" onClick={() => fileRef.current?.click()}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {t('publicSite.tryOn.changePhoto')}
                  </Button>
                  <Button variant="outline" onClick={download} disabled={exporting}>
                    <Download className="mr-2 h-4 w-4" />
                    {t('publicSite.tryOn.download')}
                  </Button>
                  <Button onClick={goBook}>
                    {t('publicSite.tryOn.bookThis')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
