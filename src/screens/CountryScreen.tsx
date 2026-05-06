import { COUNTRIES } from '@/data';
import type { Country, CountryCode, FlagPalette, Variant, Venue } from '@/types';
import {
  FlagStripe,
  FriendStack,
  PhotoPlaceholder,
  RsvpPill,
  VariantHeading,
} from '@/components/primitives';
import { MockAd } from '@/components/MockAd';

interface CountryScreenProps {
  variant: Variant;
  activeCode: CountryCode;
  going: Record<string, boolean>;
  onRsvp: (key: string) => void;
  onBack?: () => void;
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Back"
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 5,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 12px 8px 10px',
        borderRadius: 999,
        border: '1px solid #ece8e2',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#1a1612',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1a1612" strokeWidth="2">
        <path d="M9 2L3 7l6 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

function VenueCard({
  venue,
  palette,
  variant,
  going,
  onToggle,
}: {
  venue: Venue;
  palette: FlagPalette;
  variant: Variant;
  going: boolean;
  onToggle: () => void;
}) {
  if (variant === 'editorial') {
    return (
      <div style={{ borderBottom: '1px solid #e8e2d8', padding: '20px 0' }}>
        <PhotoPlaceholder tag={`venue · ${venue.photo}`} height={160} palette={palette} />
        <div style={{ padding: '14px 0 0' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: 1.4,
              color: '#8a7f72',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {venue.type} · {venue.distance}
          </div>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 26,
              color: '#1a1612',
              lineHeight: 1.1,
              letterSpacing: -0.4,
              marginBottom: 6,
            }}
          >
            {venue.name}
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              fontStyle: 'italic',
              color: '#5a544c',
              marginBottom: 14,
            }}
          >
            {venue.hood}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RsvpPill going={going} onToggle={onToggle} palette={palette} variant={variant} />
            <FriendStack count={Math.min(venue.friends, 4)} size={22} />
            <span style={{ fontSize: 12, color: '#8a7f72', fontFamily: 'ui-monospace, monospace' }}>
              {venue.rsvps} going
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div style={{ borderBottom: '1px solid #f0ede8', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
            <PhotoPlaceholder tag={venue.photo} height={64} palette={palette} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a', marginBottom: 2 }}>{venue.name}</div>
            <div style={{ fontSize: 12, color: '#9a9590', marginBottom: 8 }}>
              {venue.type} · {venue.hood} · {venue.distance}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RsvpPill going={going} onToggle={onToggle} palette={palette} variant={variant} />
              <FriendStack count={Math.min(venue.friends, 3)} size={20} />
              <span style={{ fontSize: 11, color: '#9a9590' }}>{venue.rsvps}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        border: '1px solid #f0ede8',
      }}
    >
      <div style={{ position: 'relative' }}>
        <PhotoPlaceholder tag={`venue · ${venue.photo}`} height={130} palette={palette} />
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(255,255,255,0.95)',
            padding: '4px 8px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            color: '#0a0a0a',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
          }}
        >
          {venue.type}
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0a0a0a', flex: 1 }}>{venue.name}</div>
          <div style={{ fontSize: 11, color: '#9a9590', fontWeight: 600 }}>{venue.distance}</div>
        </div>
        <div style={{ fontSize: 12, color: '#5a544c', marginBottom: 12 }}>📍 {venue.hood}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RsvpPill going={going} onToggle={onToggle} palette={palette} variant={variant} />
          <span style={{ flex: 1 }} />
          <FriendStack count={Math.min(venue.friends, 4)} size={22} />
          <span style={{ fontSize: 11, color: '#5a544c', fontWeight: 600 }}>+{venue.rsvps}</span>
        </div>
      </div>
    </div>
  );
}

function CountryHero({ country, variant }: { country: Country; variant: Variant }) {
  const p = country.colors;
  if (variant === 'editorial') {
    return (
      <div style={{ background: '#fbf8f3', padding: '60px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FlagStripe code={country.code} colors={p} w={32} h={22} radius={3} />
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: 1.4,
              color: '#8a7f72',
              textTransform: 'uppercase',
            }}
          >
            {country.code}
          </span>
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 56,
            lineHeight: 0.95,
            color: '#1a1612',
            letterSpacing: -1.6,
            fontWeight: 400,
          }}
        >
          {country.name.split(' ').map((w, i) => (
            <span key={i} style={{ fontStyle: i % 2 ? 'italic' : 'normal', display: 'block' }}>
              {w}
            </span>
          ))}
        </div>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            fontStyle: 'italic',
            color: '#5a544c',
            marginTop: 16,
            lineHeight: 1.4,
          }}
        >
          {country.tagline}
        </div>
      </div>
    );
  }
  if (variant === 'minimal') {
    return (
      <div style={{ padding: '60px 20px 16px' }}>
        <FlagStripe code={country.code} colors={p} w={28} h={20} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 32, fontWeight: 700, color: '#0a0a0a', letterSpacing: -0.8 }}>{country.name}</div>
        <div style={{ fontSize: 13, color: '#5a544c', marginTop: 4 }}>{country.tagline}</div>
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, ${p.primary}, ${p.secondary}, ${p.tertiary})`,
            marginTop: 18,
            borderRadius: 2,
          }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        padding: '58px 20px 20px',
        background: `linear-gradient(160deg, ${p.primary}26, ${p.secondary}16, ${p.tertiary}1f)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <FlagStripe code={country.code} colors={p} w={48} h={34} radius={6} />
        <div
          style={{
            background: '#0a0a0a',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            padding: '4px 8px',
            borderRadius: 4,
            letterSpacing: 1,
          }}
        >
          {country.code}
        </div>
      </div>
      <div style={{ fontSize: 38, fontWeight: 900, color: '#0a0a0a', letterSpacing: -1, lineHeight: 1 }}>
        {country.name}
      </div>
      <div style={{ fontSize: 13, color: '#3a342c', marginTop: 8, fontWeight: 500 }}>{country.tagline}</div>
    </div>
  );
}

export function CountryScreen({ variant, activeCode, going, onRsvp, onBack }: CountryScreenProps) {
  const country = COUNTRIES[activeCode];
  const palette = country.colors;
  const featuredVenue = country.venues[0];

  return (
    <div style={{ position: 'relative' }}>
      {onBack && <BackButton onBack={onBack} />}
      <CountryHero country={country} variant={variant} />
      <div style={{ padding: variant === 'editorial' ? '20px 24px 0' : '16px 20px 0' }}>
        <VariantHeading variant={variant}>Where to watch</VariantHeading>
        <div style={{ fontSize: 12, color: '#9a9590', marginBottom: 12 }}>
          {country.neighborhoods.length} neighborhoods · {country.venues.length} spots
        </div>
      </div>
      <div style={{ padding: variant === 'sporty' ? '0 20px' : '0' }}>
        {country.venues.map((v, i) => (
          <VenueCard
            key={i}
            venue={v}
            palette={palette}
            variant={variant}
            going={!!going[`${activeCode}-${i}`]}
            onToggle={() => onRsvp(`${activeCode}-${i}`)}
          />
        ))}
      </div>
      <div style={{ padding: variant === 'editorial' ? '20px 24px' : '16px 20px' }}>
        <div
          style={{
            padding: variant === 'sporty' ? '14px 16px' : '14px 0',
            background:
              variant === 'sporty'
                ? `linear-gradient(135deg, ${palette.primary}14, ${palette.secondary}0a)`
                : 'transparent',
            borderRadius: variant === 'sporty' ? 14 : 0,
            borderTop: variant !== 'sporty' ? '1px solid #e8e2d8' : 'none',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#5a544c',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: 6,
            }}
          >
            ✦ Smart suggestion
          </div>
          <div
            style={{
              fontFamily:
                variant === 'editorial'
                  ? '"Instrument Serif", Georgia, serif'
                  : '-apple-system, system-ui',
              fontSize: variant === 'editorial' ? 16 : 13,
              color: '#1a1612',
              lineHeight: 1.4,
              fontStyle: variant === 'editorial' ? 'italic' : 'normal',
            }}
          >
            Based on your follows, you&apos;ll probably love{' '}
            <b>{featuredVenue?.name ?? 'a local spot'}</b> — it&apos;s where {country.name} fans gathered for the last 3
            matchdays.
          </div>
        </div>
      </div>
      <MockAd variant={variant} />
      <div style={{ height: 100 }} />
    </div>
  );
}
