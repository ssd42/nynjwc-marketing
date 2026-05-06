import type { Variant } from '@/types';

const AD_CONTENT = {
  brand: 'Heineken',
  tagline: '20% off pints during every match',
  cta: 'Find a participating bar',
  bg: '#0c5d2e',
  fg: '#FFFFFF',
} as const;

export function MockAd({ variant }: { variant: Variant }) {
  if (variant === 'editorial') {
    return (
      <div
        style={{
          margin: '20px 24px',
          padding: '18px 0',
          borderTop: '1px solid #d8d2c8',
          borderBottom: '1px solid #d8d2c8',
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 9,
            letterSpacing: 1.6,
            color: '#a89e90',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Sponsored · {AD_CONTENT.brand}
        </div>
        <div
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 22,
            color: '#1a1612',
            lineHeight: 1.2,
            marginBottom: 8,
            fontStyle: 'italic',
          }}
        >
          &ldquo;{AD_CONTENT.tagline}&rdquo;
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              color: '#5a544c',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}
          >
            {AD_CONTENT.cta}
          </span>
          <span style={{ fontSize: 11, color: '#8a7f72' }}>→</span>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div
        style={{
          margin: '14px 20px',
          padding: '12px 14px',
          border: '1px solid #f0ede8',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            flexShrink: 0,
            background: AD_CONTENT.bg,
            color: AD_CONTENT.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, system-ui',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          {AD_CONTENT.brand[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontFamily: '-apple-system, system-ui',
                fontSize: 13,
                fontWeight: 600,
                color: '#0a0a0a',
              }}
            >
              {AD_CONTENT.brand}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: '#9a9590',
                background: '#f0ede8',
                padding: '1px 5px',
                borderRadius: 3,
                letterSpacing: 0.4,
              }}
            >
              AD
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#5a544c' }}>{AD_CONTENT.tagline}</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9a9590" strokeWidth="2">
          <path d="M4 2l4 4-4 4" />
        </svg>
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '14px 20px',
        background: AD_CONTENT.bg,
        color: AD_CONTENT.fg,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(255,255,255,0.18)',
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 1,
          padding: '3px 6px',
          borderRadius: 4,
        }}
      >
        SPONSORED
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.15)',
            padding: '4px 8px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.6,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: '#fff',
              color: AD_CONTENT.bg,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 900,
            }}
          >
            H
          </span>
          {AD_CONTENT.brand}
        </div>
        <div
          style={{
            fontFamily: '-apple-system, system-ui',
            fontSize: 17,
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 10,
          }}
        >
          {AD_CONTENT.tagline}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.3,
            padding: '6px 10px',
            background: '#fff',
            color: AD_CONTENT.bg,
            borderRadius: 999,
          }}
        >
          {AD_CONTENT.cta} →
        </div>
      </div>
    </div>
  );
}
