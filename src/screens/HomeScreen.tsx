import { COUNTRIES, COUNTRY_ORDER, MATCHES } from '@/data';
import type { CountryCode, Match, Variant } from '@/types';
import { FlagStripe, FriendStack, VariantHeading } from '@/components/primitives';
import { MockAd } from '@/components/MockAd';

interface HomeScreenProps {
  variant: Variant;
  activeCode: CountryCode;
  onPickCountry: (code: CountryCode) => void;
  onPickMatch: (match: Match) => void;
}

function MatchHeroLive({
  match,
  variant,
}: {
  match: Match;
  palette: ReturnType<() => (typeof COUNTRIES)[CountryCode]['colors']>;
  variant: Variant;
}) {
  const home = COUNTRIES[match.home];
  const away = COUNTRIES[match.away];
  const homeColors = home.colors;
  const awayColors = away.colors;
  const palette = home.colors;
  const score = match.score ?? '0-0';
  const [homeScore, awayScore] = score.split('-');

  if (variant === 'editorial') {
    return (
      <div
        style={{
          position: 'relative',
          padding: '60px 24px 24px',
          background: `linear-gradient(180deg, ${palette.primary}10, transparent), #fbf8f3`,
          borderBottom: '1px solid #e8e2d8',
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, SF Mono, monospace',
            fontSize: 10,
            letterSpacing: 1.4,
            color: '#8a7f72',
            textTransform: 'uppercase',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#d23' }} />
          Live · {match.minute}&apos; · {match.stage}
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 38,
            lineHeight: 1.05,
            color: '#1a1612',
            letterSpacing: -1,
            fontWeight: 400,
          }}
        >
          {home.name}
          <br />
          <span style={{ fontStyle: 'italic', color: '#8a7f72' }}>vs</span> {away.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
          <FlagStripe code={home.code} colors={homeColors} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 600, color: '#1a1612' }}>
            {match.score}
          </span>
          <FlagStripe code={away.code} colors={awayColors} />
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 12,
              color: '#8a7f72',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            {match.stadium}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div style={{ padding: '20px 20px 18px', borderBottom: '1px solid #f0ede8' }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            color: '#9a9590',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: 3, background: '#d23' }} />
          Live · {match.minute}&apos;
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <FlagStripe code={home.code} colors={homeColors} w={26} h={18} />
          <span style={{ fontSize: 17, fontWeight: 600, color: '#0a0a0a' }}>{home.name}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 22, fontWeight: 700, color: '#0a0a0a', fontVariantNumeric: 'tabular-nums' }}>
            {homeScore}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
          <FlagStripe code={away.code} colors={awayColors} w={26} h={18} />
          <span style={{ fontSize: 17, fontWeight: 600, color: '#0a0a0a' }}>{away.name}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 22, fontWeight: 700, color: '#0a0a0a', fontVariantNumeric: 'tabular-nums' }}>
            {awayScore}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '20px 20px 20px',
        background: `linear-gradient(135deg, ${palette.primary}1f, ${palette.secondary}1a, ${palette.tertiary}1f), #fff`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 16,
          background: '#d23',
          color: '#fff',
          padding: '3px 9px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: '#fff',
            animation: 'nynjwc-pulse 1.5s infinite',
          }}
        />
        Live {match.minute}&apos;
      </div>
      <div
        style={{
          fontSize: 11,
          color: '#5a544c',
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        {match.stage} · {match.stadium}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <FlagStripe code={home.code} colors={homeColors} w={44} h={32} radius={6} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{home.code}</div>
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#0a0a0a',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: -1,
          }}
        >
          {match.score}
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <FlagStripe code={away.code} colors={awayColors} w={44} h={32} radius={6} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{away.code}</div>
        </div>
      </div>
    </div>
  );
}

function MatchRow({
  match,
  variant,
  onClick,
}: {
  match: Match;
  variant: Variant;
  onClick: () => void;
}) {
  const home = COUNTRIES[match.home];
  const away = COUNTRIES[match.away];

  if (variant === 'editorial') {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #e8e2d8',
          padding: '20px 24px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
          <span
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, letterSpacing: 1.2, color: '#8a7f72' }}
          >
            {match.time}
          </span>
          <span
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              color: '#aaa099',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {match.stage}
          </span>
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 22,
            color: '#1a1612',
            lineHeight: 1.2,
          }}
        >
          {home.name} <span style={{ fontStyle: 'italic', color: '#8a7f72' }}>vs</span> {away.name}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <FlagStripe code={home.code} colors={home.colors} w={18} h={13} radius={2} />
          <FlagStripe code={away.code} colors={away.colors} w={18} h={13} radius={2} />
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: '#8a7f72', fontFamily: 'ui-monospace, monospace' }}>
            watch at 14 spots
          </span>
        </div>
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #f0ede8',
          padding: '14px 20px',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#9a9590',
            width: 42,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {match.time}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FlagStripe code={home.code} colors={home.colors} w={20} h={14} radius={2} />
          <FlagStripe code={away.code} colors={away.colors} w={20} h={14} radius={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a' }}>{home.name}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0a0a0a' }}>{away.name}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#c4c0bb" strokeWidth="2">
          <path d="M5 2l5 5-5 5" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        background: '#fff',
        border: '1px solid #f0ede8',
        borderRadius: 14,
        padding: '14px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          background: '#0a0a0a',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: 0.5,
        }}
      >
        {match.time}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <FlagStripe code={home.code} colors={home.colors} w={26} h={18} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>{home.code}</span>
        <span style={{ fontSize: 11, color: '#9a9590', fontWeight: 600 }}>vs</span>
        <FlagStripe code={away.code} colors={away.colors} w={26} h={18} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#0a0a0a' }}>{away.code}</span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: '#9a9590',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {match.stage.split(' ')[1]}
      </div>
    </button>
  );
}

export function HomeScreen({ variant, activeCode, onPickCountry, onPickMatch }: HomeScreenProps) {
  const palette = COUNTRIES[activeCode].colors;
  const liveMatch = MATCHES.find((m) => m.live);
  const upcoming = MATCHES.filter((m) => !m.live);
  const sug = COUNTRIES[activeCode];
  const featured = sug.venues[0];

  function Header() {
    if (variant === 'editorial') {
      return (
        <div style={{ padding: '60px 24px 16px', background: '#fbf8f3' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              color: '#8a7f72',
              textTransform: 'uppercase',
              letterSpacing: 1.4,
              marginBottom: 6,
            }}
          >
            Saturday · June 13
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
            Today&apos;s
            <br />
            <span style={{ fontStyle: 'italic' }}>matches.</span>
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
            Sat · Jun 13
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#0a0a0a', letterSpacing: -0.5 }}>Today</div>
        </div>
      );
    }
    return (
      <div
        style={{
          padding: '58px 20px 14px',
          background: `linear-gradient(180deg, ${palette.primary}14, transparent)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#9a9590',
                textTransform: 'uppercase',
                letterSpacing: 1.4,
              }}
            >
              Matchday
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: '#0a0a0a',
                letterSpacing: -0.8,
                marginTop: 2,
              }}
            >
              TODAY
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#0a0a0a',
              background: '#fff',
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid #f0ede8',
            }}
          >
            🇺🇸 NY/NJ
          </div>
        </div>
      </div>
    );
  }

  function CountryChips() {
    return (
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 20px 14px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {COUNTRY_ORDER.map((c) => {
          const co = COUNTRIES[c];
          const active = c === activeCode;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onPickCountry(c)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexShrink: 0,
                background: active ? '#0a0a0a' : '#fff',
                color: active ? '#fff' : '#0a0a0a',
                border: active ? 'none' : '1px solid #ece8e2',
                borderRadius: 999,
                padding: '7px 12px 7px 8px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <FlagStripe code={co.code} colors={co.colors} w={18} h={13} radius={2} />
              {co.code}
            </button>
          );
        })}
      </div>
    );
  }

  function SmartSuggest() {
    if (variant === 'editorial') {
      return (
        <div style={{ margin: '20px 24px 0', padding: '16px 0 18px', borderTop: '1px solid #e8e2d8' }}>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: 1.5,
              color: '#8a7f72',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            ✦ For you
          </div>
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 18,
              color: '#1a1612',
              lineHeight: 1.3,
            }}
          >
            &ldquo;Sofia &amp; 4 friends are heading to{' '}
            <span style={{ fontStyle: 'italic' }}>{featured?.name ?? 'a local spot'}</span> for {sug.name} tonight.&rdquo;
          </div>
        </div>
      );
    }
    if (variant === 'minimal') {
      return (
        <div style={{ margin: '16px 20px 0', padding: '12px 0', borderTop: '1px solid #f0ede8' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#9a9590',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              marginBottom: 4,
            }}
          >
            For you
          </div>
          <div style={{ fontSize: 14, color: '#0a0a0a', lineHeight: 1.4 }}>
            Sofia + 4 friends going to <b>{featured?.name ?? 'a local spot'}</b> for {sug.name}.
          </div>
        </div>
      );
    }
    return (
      <div
        style={{
          margin: '14px 20px 0',
          padding: '14px 16px',
          background: `linear-gradient(135deg, ${palette.primary}18, ${palette.secondary}10)`,
          border: '1px solid #ece8e2',
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              background: '#0a0a0a',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              padding: '3px 6px',
              borderRadius: 4,
              letterSpacing: 0.6,
            }}
          >
            ✦ AI
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#5a544c',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            For you
          </span>
        </div>
        <div style={{ fontSize: 14, color: '#0a0a0a', fontWeight: 500, lineHeight: 1.4 }}>
          Sofia and 4 friends are heading to <b>{featured?.name ?? 'a local spot'}</b> for {sug.name} tonight.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <FriendStack count={5} size={22} />
          <span style={{ fontSize: 11, color: '#5a544c', fontWeight: 600 }}>via Instagram</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      {liveMatch && <MatchHeroLive match={liveMatch} palette={COUNTRIES[liveMatch.home].colors} variant={variant} />}
      <div style={{ padding: variant === 'sporty' ? '14px 0 8px' : '12px 0 4px' }}>
        <div style={{ padding: variant === 'editorial' ? '0 24px 10px' : '0 20px 8px' }}>
          <VariantHeading variant={variant}>Following</VariantHeading>
        </div>
        <CountryChips />
      </div>
      <div style={{ padding: variant === 'sporty' ? '6px 20px 0' : '4px 0 0' }}>
        <div
          style={{
            padding:
              variant === 'editorial' ? '0 24px 8px' : variant === 'sporty' ? '0 0 8px' : '0 20px 6px',
          }}
        >
          <VariantHeading variant={variant}>Upcoming today</VariantHeading>
        </div>
        {upcoming.map((m) => (
          <MatchRow key={m.id} match={m} variant={variant} onClick={() => onPickMatch(m)} />
        ))}
      </div>
      <SmartSuggest />
      <MockAd variant={variant} />
      <div style={{ height: 100 }} />
    </>
  );
}
