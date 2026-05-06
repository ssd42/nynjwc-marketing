import { COUNTRIES } from '@/data';
import type { Country, CountryCode, Variant, Venue } from '@/types';
import { FlagStripe, FriendStack, VariantHeading } from '@/components/primitives';

interface SavedScreenProps {
  variant: Variant;
  going: Record<string, boolean>;
}

interface SavedItem {
  key: string;
  code: CountryCode;
  idx: number;
  country: Country;
  venue: Venue;
}

function parseKey(key: string): { code: CountryCode; idx: number } | null {
  const [code, idxStr] = key.split('-');
  if (!code || idxStr === undefined) return null;
  if (!(code in COUNTRIES)) return null;
  const idx = parseInt(idxStr, 10);
  if (Number.isNaN(idx)) return null;
  return { code: code as CountryCode, idx };
}

export function SavedScreen({ variant, going }: SavedScreenProps) {
  const items: SavedItem[] = [];
  for (const key of Object.keys(going)) {
    if (!going[key]) continue;
    const parsed = parseKey(key);
    if (!parsed) continue;
    const country = COUNTRIES[parsed.code];
    const venue = country.venues[parsed.idx];
    if (!venue) continue;
    items.push({ key, code: parsed.code, idx: parsed.idx, country, venue });
  }

  function Header() {
    if (variant === 'editorial') {
      return (
        <div style={{ padding: '60px 24px 16px', background: '#fbf8f3' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: 1.4,
              color: '#8a7f72',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Your itinerary
          </div>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 44,
              color: '#1a1612',
              letterSpacing: -1.2,
              lineHeight: 1,
              fontWeight: 400,
            }}
          >
            <span style={{ fontStyle: 'italic' }}>Saved</span> spots.
          </div>
        </div>
      );
    }
    if (variant === 'minimal') {
      return (
        <div style={{ padding: '60px 20px 12px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#9a9590',
              textTransform: 'uppercase',
              letterSpacing: 1.4,
              marginBottom: 4,
            }}
          >
            Itinerary
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0a0a0a', letterSpacing: -0.5 }}>Saved</div>
        </div>
      );
    }
    return (
      <div style={{ padding: '58px 20px 14px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#9a9590',
            textTransform: 'uppercase',
            letterSpacing: 1.4,
          }}
        >
          Your itinerary
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#0a0a0a', letterSpacing: -0.8, marginTop: 2 }}>
          SAVED
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div
            style={{
              fontFamily:
                variant === 'editorial' ? '"Instrument Serif", Georgia, serif' : '-apple-system, system-ui',
              fontSize: variant === 'editorial' ? 20 : 15,
              color: '#5a544c',
              fontStyle: variant === 'editorial' ? 'italic' : 'normal',
              lineHeight: 1.4,
            }}
          >
            Nothing saved yet.
            <br />
            RSVP to a watch party to see it here.
          </div>
        </div>
      </>
    );
  }

  function renderRow({ key, country, venue }: SavedItem) {
    const p = country.colors;
    if (variant === 'editorial') {
      return (
        <div key={key} style={{ borderBottom: '1px solid #e8e2d8', padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <FlagStripe code={country.code} colors={p} w={20} h={14} radius={2} />
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: 10,
                letterSpacing: 1.2,
                color: '#8a7f72',
                textTransform: 'uppercase',
              }}
            >
              {country.name}
            </span>
          </div>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 22,
              color: '#1a1612',
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {venue.name}
          </div>
          <div
            style={{ fontFamily: 'Georgia, serif', fontSize: 12, fontStyle: 'italic', color: '#8a7f72' }}
          >
            {venue.hood} · {venue.distance}
          </div>
        </div>
      );
    }
    if (variant === 'minimal') {
      return (
        <div
          key={key}
          style={{
            borderBottom: '1px solid #f0ede8',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <FlagStripe code={country.code} colors={p} w={26} h={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a' }}>{venue.name}</div>
            <div style={{ fontSize: 12, color: '#9a9590' }}>
              {country.name} · {venue.hood}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div
        key={key}
        style={{
          background: '#fff',
          border: '1px solid #f0ede8',
          borderRadius: 16,
          padding: '14px',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${p.primary}, ${p.secondary}, ${p.tertiary})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            letterSpacing: 0.5,
          }}
        >
          {country.code}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0a0a0a', lineHeight: 1.2 }}>{venue.name}</div>
          <div style={{ fontSize: 11, color: '#5a544c', marginTop: 2 }}>
            {venue.type} · {venue.hood}
          </div>
        </div>
        <FriendStack count={Math.min(venue.friends, 3)} size={22} />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div style={{ padding: variant === 'editorial' ? '12px 24px 4px' : '8px 20px 4px' }}>
        <VariantHeading variant={variant}>Going to ({items.length})</VariantHeading>
      </div>
      <div
        style={{
          padding: variant === 'editorial' ? '0' : variant === 'minimal' ? '0' : '0 20px',
        }}
      >
        {items.map(renderRow)}
      </div>
      <div style={{ height: 100 }} />
    </>
  );
}
