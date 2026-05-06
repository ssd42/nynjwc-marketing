import { COUNTRIES, COUNTRY_ORDER } from '@/data';
import type { CountryCode, NotificationPrefs, Variant } from '@/types';
import { FlagStripe, VariantHeading } from '@/components/primitives';

interface FollowScreenProps {
  variant: Variant;
  follows: Partial<Record<CountryCode, boolean>>;
  setFollows: (next: Partial<Record<CountryCode, boolean>>) => void;
  notifPrefs: NotificationPrefs;
  setNotifPrefs: (next: NotificationPrefs) => void;
}

const NOTIF_ROWS: Array<{ k: keyof NotificationPrefs; label: string; sub: string }> = [
  { k: 'matchStart', label: 'Match kickoff', sub: '15 min before whistle' },
  { k: 'goals', label: 'Goals & big moments', sub: 'Live alerts' },
  { k: 'newSpots', label: 'New watch parties near me', sub: 'When friends RSVP' },
  { k: 'friendsGoing', label: 'Friends going somewhere', sub: 'Via Instagram' },
];

export function FollowScreen({
  variant,
  follows,
  setFollows,
  notifPrefs,
  setNotifPrefs,
}: FollowScreenProps) {
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
            Notifications
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
            <span style={{ fontStyle: 'italic' }}>Follow</span> a country.
          </div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 14,
              fontStyle: 'italic',
              color: '#5a544c',
              marginTop: 12,
              lineHeight: 1.4,
            }}
          >
            Get pinged when their next match starts and where the locals are watching.
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
            Notifications
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0a0a0a', letterSpacing: -0.5 }}>
            Follow countries
          </div>
          <div style={{ fontSize: 12, color: '#5a544c', marginTop: 4 }}>
            Get notified about matches &amp; local watch parties.
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
          Notifications
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#0a0a0a', letterSpacing: -0.6, marginTop: 2 }}>
          FOLLOW
        </div>
        <div style={{ fontSize: 12, color: '#5a544c', marginTop: 4, fontWeight: 500 }}>
          Buzz me when my teams are playing &amp; where to watch.
        </div>
      </div>
    );
  }

  const followedCount = Object.values(follows).filter(Boolean).length;
  const followedCodes = COUNTRY_ORDER.filter((c) => follows[c]);

  return (
    <>
      <Header />
      <div style={{ padding: '12px 20px 0' }}>
        <VariantHeading variant={variant}>Countries</VariantHeading>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: '0 20px',
        }}
      >
        {COUNTRY_ORDER.map((c) => {
          const co = COUNTRIES[c];
          const followed = !!follows[c];
          return (
            <button
              key={c}
              type="button"
              onClick={() => setFollows({ ...follows, [c]: !followed })}
              style={{
                position: 'relative',
                textAlign: 'left',
                background: followed
                  ? `linear-gradient(135deg, ${co.colors.primary}1a, ${co.colors.secondary}10)`
                  : '#fff',
                border: `1.5px solid ${followed ? co.colors.primary : '#ece8e2'}`,
                borderRadius: 14,
                padding: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlagStripe code={co.code} colors={co.colors} w={26} h={18} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{co.name}</div>
                {followed && (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: co.colors.primary,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#7a746c', marginTop: 8, lineHeight: 1.3 }}>
                {co.neighborhoods[0]}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ padding: '24px 20px 8px' }}>
        <VariantHeading variant={variant}>Notify me about</VariantHeading>
      </div>
      <div
        style={{
          background: '#fff',
          margin: '0 20px',
          borderRadius: 14,
          border: '1px solid #ece8e2',
          overflow: 'hidden',
        }}
      >
        {NOTIF_ROWS.map((row, i) => (
          <div
            key={row.k}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 14px',
              borderBottom: i === NOTIF_ROWS.length - 1 ? 'none' : '0.5px solid #f0ede8',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0a0a' }}>{row.label}</div>
              <div style={{ fontSize: 11, color: '#9a9590', marginTop: 2 }}>{row.sub}</div>
            </div>
            <button
              type="button"
              onClick={() => setNotifPrefs({ ...notifPrefs, [row.k]: !notifPrefs[row.k] })}
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                background: notifPrefs[row.k] ? '#34c759' : '#e3e1da',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'background .2s',
              }}
              aria-pressed={notifPrefs[row.k]}
              aria-label={row.label}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: notifPrefs[row.k] ? 20 : 2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'left .2s',
                }}
              />
            </button>
          </div>
        ))}
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        <div
          style={{
            background: '#0a0a0a',
            color: '#fff',
            padding: '12px 14px',
            borderRadius: 12,
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Following {followedCount} countries</div>
          <div style={{ opacity: 0.7 }}>
            You&apos;ll get pings when{' '}
            {followedCodes.length > 0 ? followedCodes.slice(0, 3).join(', ') : 'no countries'} play.
          </div>
        </div>
      </div>
      <div style={{ height: 100 }} />
    </>
  );
}
