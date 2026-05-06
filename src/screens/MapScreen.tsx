// Static decorative map for the marketing-page phone preview.
// No real tiles, no map library — just a CSS-pattern map with letter pins.
// The full app uses MapLibre + OSM; the marketing build doesn't, to keep the
// bundle tiny and fully offline.

import { COUNTRIES, COUNTRY_ORDER } from '@/data';
import type { Country, CountryCode, Variant, Venue } from '@/types';
import { FlagStripe } from '@/components/primitives';

interface MapScreenProps {
  variant: Variant;
  activeCode: CountryCode;
}

interface Pin {
  country: Country;
  venue: Venue;
  key: string;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pos(key: string): { left: number; top: number } {
  const h = hash(key);
  return { left: 8 + (h % 78), top: 12 + ((h >> 5) % 60) };
}

export function MapScreen({ variant, activeCode }: MapScreenProps) {
  const allPins: Pin[] = [];
  for (const code of COUNTRY_ORDER) {
    const co = COUNTRIES[code];
    co.venues.forEach((v, i) => {
      allPins.push({ country: co, venue: v, key: `${co.code}-${i}` });
    });
  }
  const activeCountry = COUNTRIES[activeCode];
  const palette = activeCountry.colors;

  function Header() {
    if (variant === 'editorial') {
      return (
        <div style={{ padding: '60px 24px 12px', background: '#fbf8f3' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: 1.4,
              color: '#8a7f72',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            NY · NJ
          </div>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 38,
              color: '#1a1612',
              letterSpacing: -1,
              lineHeight: 1,
              fontWeight: 400,
            }}
          >
            <span style={{ fontStyle: 'italic' }}>Nearby</span> spots.
          </div>
        </div>
      );
    }
    if (variant === 'minimal') {
      return (
        <div style={{ padding: '60px 20px 10px' }}>
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
            Map
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0a0a0a', letterSpacing: -0.5 }}>
            Near you
          </div>
        </div>
      );
    }
    return (
      <div style={{ padding: '58px 20px 12px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#9a9590',
            textTransform: 'uppercase',
            letterSpacing: 1.4,
          }}
        >
          Map
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#0a0a0a', letterSpacing: -0.6, marginTop: 2 }}>
          NEAR YOU
        </div>
      </div>
    );
  }

  const labels: Array<{ t: string; l: number; p: number; c: string }> = [
    { t: 'NEWARK', l: 4, p: 32, c: '#9a948c' },
    { t: 'JERSEY CITY', l: 22, p: 50, c: '#9a948c' },
    { t: 'MANHATTAN', l: 44, p: 12, c: '#7a746c' },
    { t: 'BROOKLYN', l: 70, p: 78, c: '#7a746c' },
    { t: 'QUEENS', l: 78, p: 36, c: '#7a746c' },
  ];

  const nearbyVenues = activeCountry.venues;

  return (
    <>
      <Header />
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '8px 16px 12px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
        className="scroll-hide"
      >
        {COUNTRY_ORDER.map((c) => {
          const co = COUNTRIES[c];
          const active = c === activeCode;
          return (
            <div
              key={c}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                background: active ? '#0a0a0a' : '#fff',
                color: active ? '#fff' : '#0a0a0a',
                border: active ? 'none' : '1px solid #ece8e2',
                borderRadius: 999,
                padding: '6px 11px 6px 7px',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <FlagStripe code={co.code} colors={co.colors} w={16} h={11} radius={2} />
              {co.code}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'relative',
          height: 320,
          overflow: 'hidden',
          background: '#e8e6df',
          backgroundImage:
            'linear-gradient(60deg, transparent 49%, rgba(255,255,255,0.5) 49%, rgba(255,255,255,0.5) 51%, transparent 51%), linear-gradient(120deg, transparent 49%, rgba(255,255,255,0.5) 49%, rgba(255,255,255,0.5) 51%, transparent 51%), linear-gradient(180deg, transparent 49%, rgba(255,255,255,0.5) 49%, rgba(255,255,255,0.5) 51%, transparent 51%)',
          backgroundSize: '80px 80px, 60px 60px, 100px 100px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '32%',
            top: 0,
            bottom: 0,
            width: '8%',
            background: 'linear-gradient(180deg, #b8c9d8, #c4d3df)',
            transform: 'skewX(-6deg)',
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '62%',
            top: '20%',
            width: '6%',
            height: '70%',
            background: 'linear-gradient(180deg, #b8c9d8, #c4d3df)',
            transform: 'skewX(8deg)',
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '44%',
            top: '24%',
            width: '7%',
            height: '32%',
            background: '#cfd6c2',
            borderRadius: 2,
          }}
        />
        {labels.map((lab) => (
          <div
            key={lab.t}
            style={{
              position: 'absolute',
              left: `${lab.l}%`,
              top: `${lab.p}%`,
              fontFamily: 'ui-monospace, monospace',
              fontSize: 9,
              color: lab.c,
              letterSpacing: 1.4,
              fontWeight: 600,
            }}
          >
            {lab.t}
          </div>
        ))}
        {allPins.map(({ country, key }) => {
          const p = pos(key);
          const isActive = country.code === activeCode;
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                left: `${p.left}%`,
                top: `${p.top}%`,
                transform: 'translate(-50%, -100%)',
                opacity: isActive ? 1 : 0.5,
                zIndex: isActive ? 5 : 1,
              }}
            >
              <FlagStripe
                code={country.code}
                colors={country.colors}
                w={isActive ? 26 : 18}
                h={isActive ? 19 : 13}
                radius={3}
                style={{ boxShadow: '0 0 0 2px #fff, 0 4px 8px rgba(0,0,0,0.25)' }}
              />
              {isActive && (
                <div
                  style={{
                    width: 0,
                    height: 0,
                    margin: '-1px auto 0',
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '6px solid #fff',
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))',
                  }}
                />
              )}
            </div>
          );
        })}
        <div
          style={{
            position: 'absolute',
            left: '46%',
            top: '52%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: '#1971ff',
              boxShadow: '0 0 0 4px rgba(25,113,255,0.25), 0 0 0 8px rgba(25,113,255,0.12)',
              animation: 'nynjwc-pulse 2s infinite',
            }}
          />
        </div>
      </div>
      <div
        style={{
          marginTop: -16,
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '12px 20px 8px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{ width: 36, height: 4, background: '#e0ddd6', borderRadius: 2, margin: '0 auto 12px' }}
        />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <FlagStripe code={activeCode} colors={palette} w={20} h={14} radius={2} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0a0a0a' }}>
            {activeCountry.name} · {nearbyVenues.length} spots
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#9a9590', marginBottom: 8 }}>Sorted by distance</div>
      </div>
      <div style={{ background: '#fff', padding: '0 0 16px' }}>
        {nearbyVenues.map((v, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 20px',
              borderTop: '0.5px solid #f0ede8',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                flexShrink: 0,
                background: palette.primary,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: `0 0 0 2px ${palette.secondary}`,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>{v.name}</div>
              <div style={{ fontSize: 11, color: '#5a544c' }}>
                {v.type} · {v.hood}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>{v.distance}</div>
              <div style={{ fontSize: 10, color: '#9a9590' }}>{v.rsvps} going</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 100 }} />
    </>
  );
}
