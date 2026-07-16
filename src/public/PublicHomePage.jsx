import React, { useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, PenLine, Sparkles, ImageOff, ArrowRight } from 'lucide-react';
import DesignCard from '@/public/components/DesignCard';
import PublicTryOn from '@/public/components/PublicTryOn';
import IntakeDialog from '@/public/components/IntakeDialog';

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

// The studio's public storefront: editorial hero, design gallery with
// style filters + try-on, and the artist roster.
export default function PublicHomePage() {
  const { studio, artists, designs, variants } = useOutletContext();
  const { t } = useTranslation();
  const [styleFilter, setStyleFilter] = useState(null);
  const [tryOnDesign, setTryOnDesign] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [intakeArtistId, setIntakeArtistId] = useState(null);

  const styles = useMemo(
    () => [...new Set(designs.map((d) => d.style).filter(Boolean))].sort(),
    [designs],
  );
  const visibleDesigns = styleFilter
    ? designs.filter((d) => d.style === styleFilter)
    : designs;
  const artistById = useMemo(
    () => Object.fromEntries(artists.map((a) => [a.id, a])),
    [artists],
  );

  const openIntake = (artistId = null) => {
    setIntakeArtistId(artistId);
    setIntakeOpen(true);
  };

  return (
    <div className="space-y-16 pb-8 lg:space-y-24">
      {/* Hero */}
      <motion.section {...fade} className="mx-auto max-w-3xl pt-8 text-center lg:pt-16">
        <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">
          {studio.name}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {studio.public_bio || t('publicSite.hero.fallbackBio')}
        </p>
        {studio.address && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            {studio.address}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to={`/s/${studio.slug}/book`}>
              {t('publicSite.hero.bookNow')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => openIntake()}>
            <PenLine className="mr-2 h-4 w-4" />
            {t('publicSite.hero.customTattoo')}
          </Button>
        </div>
      </motion.section>

      {/* Designs gallery */}
      <motion.section {...fade} id="designs">
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            {t('publicSite.designs.title')}
          </h2>
          <p className="mt-1 text-muted-foreground">{t('publicSite.designs.subtitle')}</p>
        </div>

        {designs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-sm px-6 text-sm text-muted-foreground">
              {t('publicSite.designs.empty')}
            </p>
            <Button onClick={() => openIntake()}>{t('publicSite.designs.emptyCta')}</Button>
          </div>
        ) : (
          <>
            {styles.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStyleFilter(null)}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    styleFilter === null
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {t('publicSite.designs.all')}
                </button>
                {styles.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStyleFilter(styleFilter === s ? null : s)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      styleFilter === s
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {visibleDesigns.map((d) => (
                <DesignCard
                  key={d.id}
                  design={d}
                  artist={artistById[d.artist_id]}
                  variants={variants}
                  studio={studio}
                  onTryOn={setTryOnDesign}
                  onConsult={(design) => openIntake(design.artist_id || null)}
                />
              ))}
            </div>
          </>
        )}
      </motion.section>

      {/* Artists */}
      {artists.length > 0 && (
        <motion.section {...fade} id="artists">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {t('publicSite.artists.title')}
            </h2>
            <p className="mt-1 text-muted-foreground">{t('publicSite.artists.subtitle')}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
              <Link
                key={a.id}
                to={`/s/${studio.slug}/artists/${a.id}`}
                className="group rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={a.avatar} alt={a.name} />
                    <AvatarFallback className="font-display text-lg">
                      {a.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold">{a.name}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(a.styles || []).slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {a.public_bio && (
                  <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {a.public_bio}
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  {t('publicSite.artists.viewProfile')}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      <PublicTryOn
        design={tryOnDesign}
        studio={studio}
        open={!!tryOnDesign}
        onOpenChange={(v) => !v && setTryOnDesign(null)}
      />
      <IntakeDialog
        studio={studio}
        artists={artists}
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        artistId={intakeArtistId}
      />
    </div>
  );
}
