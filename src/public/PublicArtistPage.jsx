import React, { useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, PenLine, ImageOff } from 'lucide-react';
import DesignCard from '@/public/components/DesignCard';
import PublicTryOn from '@/public/components/PublicTryOn';
import IntakeDialog from '@/public/components/IntakeDialog';

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

// Public artist profile: header, their designs, custom-tattoo CTA.
export default function PublicArtistPage() {
  const { studio, artists, designs, variants } = useOutletContext();
  const { artistId } = useParams();
  const { t } = useTranslation();
  const [tryOnDesign, setTryOnDesign] = useState(null);
  const [intakeOpen, setIntakeOpen] = useState(false);

  const artist = artists.find((a) => a.id === artistId);
  const artistDesigns = useMemo(
    () => designs.filter((d) => d.artist_id === artistId),
    [designs, artistId],
  );

  if (!artist) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-muted-foreground">{t('publicSite.artist.notFound')}</p>
        <Button asChild variant="outline">
          <Link to={`/s/${studio.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('publicSite.artist.back')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-8">
      <motion.div {...fade}>
        <Link
          to={`/s/${studio.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('publicSite.artist.back')}
        </Link>

        {/* Artist header */}
        <div className="mt-8 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <Avatar className="h-28 w-28 shrink-0 sm:h-32 sm:w-32">
            <AvatarImage src={artist.avatar} alt={artist.name} />
            <AvatarFallback className="font-display text-3xl">
              {artist.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-semibold sm:text-5xl">{artist.name}</h1>
            {(artist.styles || []).length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
                {artist.styles.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            )}
            {artist.public_bio && (
              <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                {artist.public_bio}
              </p>
            )}
            <Button className="mt-6" onClick={() => setIntakeOpen(true)}>
              <PenLine className="mr-2 h-4 w-4" />
              {t('publicSite.artist.customCta', { name: artist.name })}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Designs */}
      <motion.section {...fade}>
        <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">
          {t('publicSite.artist.designs', { name: artist.name })}
        </h2>
        {artistDesigns.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
            <p className="max-w-sm px-6 text-sm text-muted-foreground">
              {t('publicSite.artist.noDesigns', { name: artist.name })}
            </p>
            <Button onClick={() => setIntakeOpen(true)}>
              {t('publicSite.hero.customTattoo')}
            </Button>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {artistDesigns.map((d) => (
              <DesignCard
                key={d.id}
                design={{ ...d, artist_id: artist.id }}
                artist={artist}
                variants={variants}
                studio={studio}
                onTryOn={setTryOnDesign}
                onConsult={() => setIntakeOpen(true)}
              />
            ))}
          </div>
        )}
      </motion.section>

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
        artistId={artist.id}
      />
    </div>
  );
}
