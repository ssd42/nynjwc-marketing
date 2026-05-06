import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { AR, BR, CO, DE, EC, FR, HR, JP, KR, MA, MX, PL, PT, SN, US } from 'country-flag-icons/react/3x2';
import type { CountryCode, FlagPalette, Friend, Variant } from '@/types';
import { FRIENDS } from '@/data';

type FlagComponent = ComponentType<{ title?: string; style?: CSSProperties }>;

// England (St. George's Cross) — country-flag-icons only ships ISO 3166-1
// alpha-2 country flags, not sub-national flags, so we hand-roll this one.
const EnglandFlag: FlagComponent = ({ title, style }) => (
  <svg
    viewBox="0 0 60 36"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
    aria-label={title}
    preserveAspectRatio="none"
  >
    <rect width="60" height="36" fill="#FFFFFF" />
    <rect x="24" y="0" width="12" height="36" fill="#CF142B" />
    <rect x="0" y="12" width="60" height="12" fill="#CF142B" />
  </svg>
);

// Tree-shaken: only the countries we ship are bundled.
const FLAG_COMPONENTS: Record<CountryCode, FlagComponent> = {
  USA: US,
  BRA: BR,
  FRA: FR,
  ARG: AR,
  POR: PT,
  ECU: EC,
  MEX: MX,
  COL: CO,
  KOR: KR,
  CRO: HR,
  POL: PL,
  JPN: JP,
  ENG: EnglandFlag,
  SEN: SN,
  GER: DE,
  MAR: MA,
};

interface FlagProps {
  code: CountryCode;
  w?: number;
  h?: number;
  radius?: number;
  style?: CSSProperties | undefined;
}

export function Flag({ code, w = 22, h = 16, radius = 3, style }: FlagProps) {
  const Component = FLAG_COMPONENTS[code];
  const wrapper: CSSProperties = {
    width: w,
    height: h,
    borderRadius: radius,
    overflow: 'hidden',
    display: 'inline-block',
    flexShrink: 0,
    boxShadow: '0 0 0 0.5px rgba(0,0,0,0.15)',
    background: '#e5e1d8',
    ...style,
  };
  return (
    <span style={wrapper} aria-label={code}>
      <Component title={code} style={{ width: '100%', height: '100%', display: 'block' }} />
    </span>
  );
}

interface FlagStripeProps {
  colors: FlagPalette;
  /**
   * Optional: when supplied, renders the real flag SVG instead of the
   * abstract tri-stripe. Lets us migrate call sites incrementally without
   * changing every prop list.
   */
  code?: CountryCode;
  w?: number;
  h?: number;
  radius?: number;
  style?: CSSProperties;
}

export function FlagStripe({ colors, code, w = 22, h = 16, radius = 3, style }: FlagStripeProps) {
  if (code) return <Flag code={code} w={w} h={h} radius={radius} style={style} />;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        overflow: 'hidden',
        display: 'flex',
        flexShrink: 0,
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.15)',
        ...style,
      }}
    >
      <div style={{ flex: 1, background: colors.primary }} />
      <div style={{ flex: 1, background: colors.secondary }} />
      <div style={{ flex: 1, background: colors.tertiary }} />
    </div>
  );
}

interface AvatarProps {
  name: string;
  size?: number;
  tint?: string;
  ring?: string;
}

export function Avatar({ name, size = 28, tint = '#ddd', ring = '#fff' }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: tint,
        color: '#3a2f24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, system-ui',
        fontWeight: 600,
        fontSize: size * 0.4,
        boxShadow: `0 0 0 2px ${ring}`,
        flexShrink: 0,
      }}
    >
      {name[0]}
    </div>
  );
}

interface FriendStackProps {
  count?: number;
  size?: number;
  ring?: string;
  friends?: Friend[];
}

export function FriendStack({
  count = 3,
  size = 24,
  ring = '#fff',
  friends = FRIENDS,
}: FriendStackProps) {
  const visible = friends.slice(0, count);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex' }}>
        {visible.map((f, i) => (
          <div key={f.name} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
            <Avatar name={f.name} size={size} tint={f.tint} ring={ring} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface PhotoPlaceholderProps {
  tag?: string;
  height?: number;
  palette?: FlagPalette;
  style?: CSSProperties;
}

export function PhotoPlaceholder({
  tag = 'photo',
  height = 140,
  palette,
  style,
}: PhotoPlaceholderProps) {
  const c1 = palette?.primary ?? '#888';
  const c2 = palette?.secondary ?? '#aaa';
  const c3 = palette?.tertiary ?? '#ccc';
  const bg = `repeating-linear-gradient(135deg, ${c1}22 0 8px, ${c2}22 8px 16px, ${c3}22 16px 24px)`;
  return (
    <div
      style={{
        height,
        width: '100%',
        position: 'relative',
        background: `${bg}, #f4f2ee`,
        backgroundBlendMode: 'multiply',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          fontSize: 9,
          color: 'rgba(0,0,0,0.4)',
          padding: '6px 8px',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {tag}
      </div>
    </div>
  );
}

interface RsvpPillProps {
  going: boolean;
  onToggle: () => void;
  palette: FlagPalette;
  variant?: Variant;
}

export function RsvpPill({ going, onToggle, palette, variant = 'sporty' }: RsvpPillProps) {
  if (variant === 'editorial') {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{
          border: `1px solid ${going ? palette.primary : '#2a2520'}`,
          background: going ? palette.primary : 'transparent',
          color: going ? '#fff' : '#2a2520',
          padding: '8px 16px',
          borderRadius: 0,
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: 14,
          letterSpacing: 0.5,
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        {going ? 'Going ✓' : "I'm going"}
      </button>
    );
  }
  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={onToggle}
        style={{
          border: '1px solid rgba(0,0,0,0.12)',
          background: going ? '#0a0a0a' : '#fff',
          color: going ? '#fff' : '#0a0a0a',
          padding: '7px 14px',
          borderRadius: 999,
          fontFamily: '-apple-system, system-ui',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {going ? 'Going' : 'RSVP'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        border: 'none',
        background: going ? palette.primary : '#0a0a0a',
        color: '#fff',
        padding: '9px 18px',
        borderRadius: 999,
        fontFamily: '-apple-system, system-ui',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        boxShadow: going ? `0 4px 14px ${palette.primary}66` : 'none',
        transition: 'all .2s',
      }}
    >
      {going ? '✓ Going' : "I'm going"}
    </button>
  );
}

export function VariantHeading({
  children,
  variant = 'sporty',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  if (variant === 'editorial') {
    return (
      <div
        style={{
          fontFamily: '"Instrument Serif", "Cormorant Garamond", Georgia, serif',
          fontSize: 24,
          fontWeight: 400,
          color: '#1a1612',
          letterSpacing: -0.4,
          lineHeight: 1.1,
          marginBottom: 12,
        }}
      >
        {children}
      </div>
    );
  }
  if (variant === 'minimal') {
    return (
      <div
        style={{
          fontFamily: '-apple-system, system-ui',
          fontSize: 13,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          color: '#888',
          marginBottom: 10,
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      style={{
        fontFamily: '-apple-system, system-ui',
        fontSize: 18,
        fontWeight: 800,
        color: '#0a0a0a',
        letterSpacing: -0.3,
        marginBottom: 12,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}
