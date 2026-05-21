import { useEffect, useState, type FormEvent } from 'react';
import posthog from 'posthog-js';
import { COUNTRIES, COUNTRY_ORDER } from '~/data';
import type { CountryCode } from '~/types';
import { FlagStripe, FriendStack } from '@/components/primitives';
import { AnimatedPhone } from './AnimatedPhone';

// Backend API base, e.g. https://api.nynjwc.com — set via VITE_API_BASE_URL
// at build time. The waitlist form POSTs to `${API_BASE_URL}/v1/waitlist`.
// Empty string disables the network call (the PostHog event still fires).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// Public URL of the beta web app. While the native iOS app is in App Store
// review, the web app is how people use the product. Set this when the beta
// is live; until then the "Open the web app" CTAs fall back to the waitlist.
const BETA_APP_URL = 'https://nynjwc-web.vercel.app';

// Spread onto every beta CTA <a>. External URL opens in a new tab; the
// empty-URL fallback scrolls to the in-page waitlist.
const betaLinkProps = BETA_APP_URL
  ? { href: BETA_APP_URL, target: '_blank' as const, rel: 'noopener noreferrer' }
  : { href: '#waitlist' };

// 2026 World Cup opener: USA vs (TBD) at Estadio Azteca on June 11, 2026.
// MetLife's first match is shortly after. Pick the universal kickoff date
// since that's the cultural starting gun.
const KICKOFF = new Date('2026-06-11T00:00:00');

/**
 * Honest, dynamic eyebrow text that updates daily. No fake "30 days to
 * kickoff" hardcoded numbers — computed from the user's current date.
 */
function kickoffEyebrow(): string {
  const today = new Date();
  const ms = KICKOFF.getTime() - today.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days > 1) return `${days} days to kickoff · NY/NJ`;
  if (days === 1) return 'One day to kickoff · NY/NJ';
  if (days === 0) return 'Kickoff day · NY/NJ';
  // Tournament window is roughly mid-June through mid-July.
  if (days > -35) return 'World Cup live · NY/NJ';
  return 'Summer 2026 · NY/NJ host cities';
}

// Marquee ticker iterates over every country we ship — adding a country to
// COUNTRY_ORDER automatically extends the scroll without a second touchpoint.
// Hand-picked subset for the scrolling ticker — deliberately shorter than
// the full grid so the marquee reads at a calm pace. The country grid below
// still renders every country in COUNTRY_ORDER.
const TICKER_CODES: CountryCode[] = [
  'BRA', 'ARG', 'POR', 'COL', 'ECU', 'ESP', 'MEX', 'FRA', 'USA', 'GER',
  'KOR', 'CRO', 'JPN', 'ENG', 'SEN', 'MAR', 'NED', 'NOR', 'BEL', 'URU',
  'CAN', 'EGY', 'PAR',
];
// The full 2026 World Cup field — curated countries (with venue data) lead,
// then the rest. Adding a country to COUNTRY_ORDER extends the grid too.
const COUNTRY_GRID: CountryCode[] = COUNTRY_ORDER;

function CountryTicker() {
  // Repeat 3x so the loop animation tiles cleanly.
  const codes = [...TICKER_CODES, ...TICKER_CODES, ...TICKER_CODES];
  return (
    <div
      style={{
        overflow: 'hidden',
        position: 'relative',
        borderTop: '1px solid #e8e2d8',
        borderBottom: '1px solid #e8e2d8',
        background: '#f0eee9',
        padding: '22px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          // No flex `gap` — each item owns its trailing space via marginRight
          // so the 3 tiled copies are pixel-identical and the loop seam is
          // exact. `willChange` keeps the track on its own GPU layer.
          animation: 'nynjwc-ticker-scroll 55s linear infinite',
          width: 'max-content',
          willChange: 'transform',
        }}
      >
        {codes.map((c, i) => {
          const co = COUNTRIES[c];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <FlagStripe code={co.code} colors={co.colors} w={36} h={26} radius={3} />
              <span
                style={{
                  fontFamily: '"Instrument Serif", Georgia, serif',
                  fontSize: 32,
                  color: '#1a1612',
                  fontWeight: 400,
                  marginLeft: 14,
                }}
              >
                {co.name}
              </span>
              {/* Separator star — equal margin each side so it sits centered
                  in the gap between countries instead of hugging the name.
                  Its right margin is also the item's trailing space, which
                  keeps the 3 tiled copies pixel-identical for a clean loop. */}
              <span
                style={{
                  fontFamily: 'ui-monospace, SF Mono, monospace',
                  fontSize: 11,
                  color: '#8a7f72',
                  textTransform: 'uppercase',
                  margin: '0 34px',
                }}
              >
                ★
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      className="hero-pad hero-grid"
      style={{
        position: 'relative',
        background: '#f0eee9',
      }}
    >
      <div className="hero-nav" style={{ gridColumn: '1 / -1' }}>
        <a
          href="/"
          aria-label="nynjworldcup home"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <img
            src="/mark.png"
            alt=""
            width={28}
            height={28}
            style={{ display: 'block', objectFit: 'contain' }}
          />
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 22,
              color: '#1a1612',
              letterSpacing: -0.3,
              fontWeight: 400,
            }}
          >
            nynjworldcup
          </div>
        </a>
        <div
          className="hero-nav-links"
          style={{
            fontFamily: '-apple-system, system-ui',
            fontSize: 13,
            fontWeight: 500,
            color: '#1a1612',
          }}
        >
          <a href="#how" style={{ color: '#1a1612', textDecoration: 'none' }}>How it works</a>
          <a href="#countries" style={{ color: '#1a1612', textDecoration: 'none' }}>Countries</a>
          <a href="#faq" style={{ color: '#1a1612', textDecoration: 'none' }}>FAQ</a>
          <a
            {...betaLinkProps}
            className="cta"
            onClick={() => posthog.capture('beta_clicked', { location: 'nav' })}
            style={{
              background: '#1a1612',
              color: '#fbf8f3',
              padding: '9px 14px',
              borderRadius: 999,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: 0.3,
            }}
          >
            Try the beta
          </a>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          maxWidth: 580,
          paddingTop: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
            fontFamily: 'ui-monospace, SF Mono, monospace',
            fontSize: 11,
            color: '#8a7f72',
            letterSpacing: 1.6,
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: 4,
              background: '#d23',
              animation: 'nynjwc-pulse 2s infinite',
            }}
          />
          {kickoffEyebrow()}
        </div>

        <h1
          className="hero-headline"
          style={{
            margin: 0,
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(56px, 9vw, 92px)',
            lineHeight: 0.96,
            letterSpacing: -2.4,
            color: '#1a1612',
            fontWeight: 400,
          }}
        >
          Find your
          <br />
          <span style={{ fontStyle: 'italic', color: '#5a4a3c' }}>country&apos;s</span> home
          <br />
          this World Cup.
        </h1>

        <p
          style={{
            margin: '36px 0 0',
            maxWidth: 480,
            fontFamily: '-apple-system, system-ui',
            fontSize: 18,
            lineHeight: 1.55,
            color: '#3a352e',
            fontWeight: 400,
          }}
        >
          Every World Cup match, every diaspora-packed bar from Astoria to the Ironbound. The
          closest thing to home — your country, your culture, your people. And the door open
          for anyone who wants in.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 36, alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            {...betaLinkProps}
            onClick={() => posthog.capture('beta_clicked', { location: 'hero' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#1a1612',
              color: '#fbf8f3',
              padding: '14px 22px 14px 18px',
              borderRadius: 14,
              textDecoration: 'none',
              fontFamily: '-apple-system, system-ui',
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fbf8f3" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9.2" />
              <path d="M2.8 12h18.4" strokeLinecap="round" />
              <path d="M12 2.8c2.7 2.7 2.7 15.7 0 18.4M12 2.8c-2.7 2.7-2.7 15.7 0 18.4" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.7, letterSpacing: 0.3 }}>
                No install · free beta
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, marginTop: 3, letterSpacing: -0.3 }}>
                Open the web app
              </span>
            </div>
          </a>

          {/* Non-clickable — the native iOS app is in App Store review. */}
          <div
            aria-label="iOS app — coming soon to the App Store"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'transparent',
              color: '#8a7f72',
              padding: '14px 20px 14px 16px',
              borderRadius: 14,
              border: '1px solid #d8d1c5',
              fontFamily: '-apple-system, system-ui',
              cursor: 'default',
            }}
          >
            <svg width="20" height="24" viewBox="0 0 22 26" fill="#a89f90">
              <path d="M17.05 13.78c-.03-3.06 2.5-4.53 2.62-4.6-1.43-2.09-3.66-2.38-4.45-2.41-1.89-.19-3.69 1.11-4.65 1.11-.97 0-2.45-1.08-4.03-1.05-2.07.03-3.99 1.21-5.05 3.06-2.16 3.74-.55 9.27 1.55 12.31 1.04 1.49 2.27 3.16 3.88 3.1 1.56-.06 2.15-1.01 4.04-1.01 1.88 0 2.41 1.01 4.05.98 1.67-.03 2.73-1.52 3.76-3.01 1.18-1.73 1.67-3.4 1.7-3.49-.04-.02-3.27-1.25-3.3-4.99zM14.21 5.28c.86-1.05 1.45-2.5 1.29-3.95-1.24.05-2.74.83-3.63 1.87-.79.93-1.5 2.41-1.31 3.83 1.39.11 2.81-.7 3.65-1.75z" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                Coming soon
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, marginTop: 3, letterSpacing: -0.3 }}>
                App Store
              </span>
            </div>
          </div>

          <a
            href="#waitlist"
            onClick={() => posthog.capture('waitlist_clicked', { location: 'hero' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              color: '#1a1612',
              padding: '14px 20px',
              borderRadius: 14,
              border: '1px solid #1a1612',
              textDecoration: 'none',
              fontFamily: '-apple-system, system-ui',
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Join the waitlist
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7h8m0 0L7.5 3.5M11 7l-3.5 3.5"
                stroke="#1a1612"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 52,
            paddingTop: 22,
            borderTop: '1px solid #e8e2d8',
            maxWidth: 480,
          }}
        >
          <FriendStack count={5} size={28} />
          <div
            style={{
              fontFamily: '-apple-system, system-ui',
              fontSize: 13,
              color: '#5a544c',
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 600, color: '#1a1612' }}>All 48 World Cup teams · NY/NJ</div>
            <div style={{ marginTop: 2 }}>Find where your country is actually watching.</div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 12,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 460,
            height: 540,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(255,223,0,0.18), rgba(0,156,59,0.08), transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="hero-sticker"
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            marginLeft: -190,
            transform: 'rotate(-7deg)',
            zIndex: 2,
            background: '#1a1612',
            color: '#fbf8f3',
            padding: '10px 14px',
            fontFamily: 'ui-monospace, SF Mono, monospace',
            fontSize: 11,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          }}
        >
          ✦ Try it →
        </div>

        <div
          className="hero-sticker"
          style={{
            position: 'absolute',
            bottom: 110,
            left: '50%',
            marginLeft: 130,
            transform: 'rotate(5deg)',
            zIndex: 2,
            background: '#fbf8f3',
            color: '#1a1612',
            padding: '12px 14px',
            borderRadius: 4,
            border: '1px solid #1a1612',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 18,
            lineHeight: 1.1,
            maxWidth: 160,
            fontStyle: 'italic',
            boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          }}
        >
          From the diaspora. For the diaspora.
          <div
            style={{
              marginTop: 6,
              fontStyle: 'normal',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 9,
              letterSpacing: 1.4,
              color: '#8a7f72',
              textTransform: 'uppercase',
            }}
          >
            All 48 teams · NY/NJ
          </div>
        </div>

        <div className="phone-wrap">
          <AnimatedPhone />
        </div>
      </div>
    </section>
  );
}

function FeatureRow() {
  const features = [
    {
      kicker: '01',
      title: 'Watch parties, mapped.',
      body:
        'Every diaspora-packed bar from Astoria to the Ironbound, pinned by flag on a real neighborhood map. Tap a pin for the venue, the hood, and how to get there.',
    },
    {
      kicker: '02',
      title: 'Your teams, up top.',
      body:
        "Follow your countries and the home screen leads with their fixtures — live scores, kickoff times, who's playing where. The full bracket, group stage to final, is one tap away.",
    },
    {
      kicker: '03',
      title: 'Pick your spot. Keep your plan.',
      body:
        "Find your bar, mark it for the match, and it lands in Saved — your matchday itinerary. Share it as a poster to the group chat. No reservations, no fees, no minimums — it's still just a bar.",
    },
    {
      kicker: '04',
      title: 'More than the match.',
      body:
        "Fan fests, food pop-ups, parades, after-parties — the whole neighborhood's matchday lineup. See who's going and bring the crew.",
    },
  ];

  return (
    <section
      id="how"
      className="section-pad"
      style={{
        background: '#fbf8f3',
        borderTop: '1px solid #e8e2d8',
        borderBottom: '1px solid #e8e2d8',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: 'ui-monospace, SF Mono, monospace',
            fontSize: 11,
            color: '#8a7f72',
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          ✦ How it works
        </div>
        <h2
          style={{
            margin: '0 0 clamp(48px, 7vw, 80px)',
            maxWidth: 800,
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(40px, 7vw, 64px)',
            lineHeight: 1,
            letterSpacing: -1.6,
            color: '#1a1612',
            fontWeight: 400,
          }}
        >
          Everything matchday needs.
          <br />
          <span style={{ fontStyle: 'italic', color: '#5a4a3c' }}>Nothing it doesn&apos;t.</span>
        </h2>

        <div className="feature-grid">
          {features.map((f, i) => (
            <div key={i} style={{ borderTop: '1px solid #1a1612', paddingTop: 22 }}>
              <div
                style={{
                  fontFamily: 'ui-monospace, SF Mono, monospace',
                  fontSize: 12,
                  color: '#8a7f72',
                  letterSpacing: 1.4,
                  marginBottom: 28,
                }}
              >
                {f.kicker}
              </div>
              <h3
                style={{
                  margin: '0 0 14px',
                  fontFamily: '"Instrument Serif", Georgia, serif',
                  fontSize: 32,
                  lineHeight: 1.05,
                  letterSpacing: -0.8,
                  color: '#1a1612',
                  fontWeight: 400,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontFamily: '-apple-system, system-ui',
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: '#3a352e',
                }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountriesSection() {
  return (
    <section id="countries" className="section-pad" style={{ background: '#f0eee9' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="country-grid-wrap">
          <div>
            <div
              style={{
                fontFamily: 'ui-monospace, SF Mono, monospace',
                fontSize: 11,
                color: '#8a7f72',
                letterSpacing: 1.6,
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              ✦ All {COUNTRY_GRID.length} World Cup teams
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: '"Instrument Serif", Georgia, serif',
                fontSize: 'clamp(40px, 7vw, 64px)',
                lineHeight: 1,
                letterSpacing: -1.6,
                color: '#1a1612',
                fontWeight: 400,
              }}
            >
              The neighborhoods
              <br />
              <span style={{ fontStyle: 'italic', color: '#5a4a3c' }}>already know.</span>
            </h2>
          </div>
          <div
            style={{
              fontFamily: '-apple-system, system-ui',
              fontSize: 15,
              lineHeight: 1.6,
              color: '#3a352e',
              maxWidth: 460,
              justifySelf: 'end',
            }}
          >
            Every nation in the 2026 field — all {COUNTRY_GRID.length}. Venue coverage runs deepest in
            the loudest NY/NJ diaspora hubs and grows every week as fans add their spots.
          </div>
        </div>

        <div className="country-grid">
          {COUNTRY_GRID.map((c) => {
            const co = COUNTRIES[c];
            const hasVenues = co.venues.length > 0;
            // Venue-less countries still get a useful card: a known
            // neighborhood instead of a tagline, scouting status instead
            // of a spot count.
            const desc =
              co.tagline ||
              (co.neighborhoods.length
                ? co.neighborhoods.slice(0, 2).join(' · ')
                : 'Watch parties coming soon');
            const stat = hasVenues
              ? `${co.venues.length} spots · ${co.venues.reduce(
                  (s, v) => s + v.rsvps,
                  0,
                )} going`
              : co.neighborhoods.length
                ? `${co.neighborhoods.length} neighborhood${
                    co.neighborhoods.length === 1 ? '' : 's'
                  } scouted`
                : 'On the map soon';
            return (
              <div
                key={c}
                style={{
                  background: '#fbf8f3',
                  padding: '28px 24px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minHeight: 220,
                }}
              >
                <FlagStripe code={co.code} colors={co.colors} w={56} h={40} radius={4} />
                <div
                  style={{
                    fontFamily: '"Instrument Serif", Georgia, serif',
                    fontSize: 28,
                    lineHeight: 1,
                    color: '#1a1612',
                    fontWeight: 400,
                    letterSpacing: -0.6,
                  }}
                >
                  {co.name}
                </div>
                <div
                  style={{
                    fontFamily: '-apple-system, system-ui',
                    fontSize: 13,
                    lineHeight: 1.45,
                    color: '#5a4a3c',
                    flex: 1,
                  }}
                >
                  {desc}
                </div>
                <div
                  style={{
                    fontFamily: 'ui-monospace, SF Mono, monospace',
                    fontSize: 10,
                    color: hasVenues ? '#8a7f72' : '#aaa099',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    marginTop: 6,
                  }}
                >
                  {stat}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ borderTop: '1px solid #1a1612' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '24px 0',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 26,
            color: '#1a1612',
            fontWeight: 400,
            letterSpacing: -0.4,
          }}
        >
          {q}
        </span>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            border: '1px solid #1a1612',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.3s',
            transform: open ? 'rotate(45deg)' : 'rotate(0)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M6 1v10M1 6h10" stroke="#1a1612" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div
          style={{
            paddingBottom: 28,
            paddingRight: 60,
            fontFamily: '-apple-system, system-ui',
            fontSize: 16,
            lineHeight: 1.6,
            color: '#3a352e',
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

function FAQ() {
  const items = [
    {
      q: 'Do bars pay to be listed?',
      a: 'No. We crawl public listings, social media, and on-the-ground reports from local fans. Bars can claim their listing for free — paid promotion is clearly labeled.',
    },
    {
      q: 'Why only NY/NJ?',
      a: "The 2026 World Cup hosts 8 matches at MetLife Stadium, but more importantly: the tri-state has the deepest roster of country-specific neighborhoods in the country. We're going deep before going wide.",
    },
    {
      q: 'How does the Instagram thing work?',
      a: "Optional. If you connect Instagram, we surface mutuals who are heading to the same spots. You can also just use the app solo — most people do, at first.",
    },
    {
      q: 'Web app or native app?',
      a: "Right now it's a beta web app — open it in any browser on your phone or laptop, nothing to install. The native iOS app is in App Store review and will follow shortly; Android comes after that.",
    },
  ];

  return (
    <section
      id="faq"
      className="section-pad"
      style={{ background: '#fbf8f3', borderTop: '1px solid #e8e2d8' }}
    >
      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: 'ui-monospace, SF Mono, monospace',
            fontSize: 11,
            color: '#8a7f72',
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          ✦ Frequently asked
        </div>
        <h2
          style={{
            margin: '0 0 clamp(36px, 6vw, 56px)',
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(36px, 6vw, 56px)',
            lineHeight: 1,
            letterSpacing: -1.4,
            color: '#1a1612',
            fontWeight: 400,
          }}
        >
          Questions, <span style={{ fontStyle: 'italic', color: '#5a4a3c' }}>fair ones.</span>
        </h2>

        <div>
          {items.map((it, i) => (
            <FAQItem key={i} q={it.q} a={it.a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

function useKickoffParts() {
  const compute = () => {
    const ms = Math.max(0, KICKOFF.getTime() - Date.now());
    const days = Math.floor(ms / 86_400_000);
    const hrs = Math.floor((ms % 86_400_000) / 3_600_000);
    const min = Math.floor((ms % 3_600_000) / 60_000);
    const sec = Math.floor((ms % 60_000) / 1000);
    return { days, hrs, min, sec };
  };
  const [parts, setParts] = useState(compute);
  useEffect(() => {
    const id = setInterval(() => setParts(compute()), 1000);
    return () => clearInterval(id);
  }, []);
  return parts;
}

function Countdown() {
  const { days, hrs, min, sec } = useKickoffParts();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const cells: { label: string; value: string }[] = [
    { label: 'Days', value: pad(days) },
    { label: 'Hrs', value: pad(hrs) },
    { label: 'Min', value: pad(min) },
    { label: 'Sec', value: pad(sec) },
  ];

  return (
    <div
      className="countdown"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) repeat(4, minmax(0, 1fr))',
        border: '1px solid rgba(251,248,243,0.18)',
        marginBottom: 56,
        background: 'rgba(251,248,243,0.02)',
      }}
    >
      <div
        className="countdown-label"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '22px 24px',
          borderRight: '1px solid rgba(251,248,243,0.18)',
          fontFamily: 'ui-monospace, SF Mono, monospace',
          fontSize: 11,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: '#d6cfc4',
          lineHeight: 1.4,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: 4,
            background: '#d23',
            flexShrink: 0,
            animation: 'nynjwc-pulse 2s infinite',
          }}
        />
        <span>
          Kickoff in
          <br />
          NY/NJ time
        </span>
      </div>

      {cells.map((c, i) => (
        <div
          key={c.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '18px 12px 16px',
            borderRight:
              i < cells.length - 1 ? '1px solid rgba(251,248,243,0.18)' : 'none',
          }}
        >
          <div
            style={{
              fontFamily: '"Instrument Serif", Georgia, serif',
              fontSize: 'clamp(40px, 6vw, 64px)',
              lineHeight: 1,
              color: '#fbf8f3',
              fontWeight: 400,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: -1,
            }}
          >
            {c.value}
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: 'ui-monospace, SF Mono, monospace',
              fontSize: 10,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: '#8a7f72',
            }}
          >
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlistSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/.+@.+\..+/.test(trimmed)) return;

    // PostHog: stitch future events to this person + record the conversion.
    posthog.identify(trimmed);
    posthog.capture('waitlist_submitted', { email: trimmed });

    // Persist to the backend waitlist table. Fire-and-forget — PostHog has
    // the email as a backup if this fails, and the UI confirms optimistically.
    if (API_BASE_URL) {
      fetch(`${API_BASE_URL}/v1/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'marketing-site' }),
      }).catch(() => {});
    }

    setSubmitted(true);
    setEmail('');
  };

  return (
    <footer
      id="download"
      className="footer-pad"
      style={{
        background: '#1a1612',
        color: '#fbf8f3',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2
          style={{
            margin: '0 0 40px',
            maxWidth: 900,
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: 'clamp(48px, 9vw, 88px)',
            lineHeight: 0.96,
            letterSpacing: -2.2,
            fontWeight: 400,
            color: '#fbf8f3',
          }}
        >
          Kickoff is
          <br />
          <span style={{ fontStyle: 'italic', color: '#d6cfc4' }}>June 11, 2026.</span>
        </h2>

        <Countdown />

        <div className="footer-cta-row">
          <a
            {...betaLinkProps}
            onClick={() => posthog.capture('beta_clicked', { location: 'footer' })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: '#fbf8f3',
              color: '#1a1612',
              padding: '14px 22px 14px 18px',
              borderRadius: 14,
              textDecoration: 'none',
              fontFamily: '-apple-system, system-ui',
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1a1612" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9.2" />
              <path d="M2.8 12h18.4" strokeLinecap="round" />
              <path d="M12 2.8c2.7 2.7 2.7 15.7 0 18.4M12 2.8c-2.7 2.7-2.7 15.7 0 18.4" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.6, letterSpacing: 0.3 }}>
                No install · free beta
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, marginTop: 3, letterSpacing: -0.3 }}>
                Open the web app
              </span>
            </div>
          </a>

          {/* Non-clickable — the native iOS app is in App Store review. */}
          <div
            aria-label="iOS app — coming soon to the App Store"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'transparent',
              color: 'rgba(251,248,243,0.55)',
              padding: '14px 20px 14px 16px',
              borderRadius: 14,
              border: '1px solid rgba(251,248,243,0.28)',
              fontFamily: '-apple-system, system-ui',
              cursor: 'default',
            }}
          >
            <svg width="20" height="24" viewBox="0 0 22 26" fill="rgba(251,248,243,0.45)">
              <path d="M17.05 13.78c-.03-3.06 2.5-4.53 2.62-4.6-1.43-2.09-3.66-2.38-4.45-2.41-1.89-.19-3.69 1.11-4.65 1.11-.97 0-2.45-1.08-4.03-1.05-2.07.03-3.99 1.21-5.05 3.06-2.16 3.74-.55 9.27 1.55 12.31 1.04 1.49 2.27 3.16 3.88 3.1 1.56-.06 2.15-1.01 4.04-1.01 1.88 0 2.41 1.01 4.05.98 1.67-.03 2.73-1.52 3.76-3.01 1.18-1.73 1.67-3.4 1.7-3.49-.04-.02-3.27-1.25-3.3-4.99zM14.21 5.28c.86-1.05 1.45-2.5 1.29-3.95-1.24.05-2.74.83-3.63 1.87-.79.93-1.5 2.41-1.31 3.83 1.39.11 2.81-.7 3.65-1.75z" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                Coming soon
              </span>
              <span style={{ fontSize: 18, fontWeight: 600, marginTop: 3, letterSpacing: -0.3 }}>
                App Store
              </span>
            </div>
          </div>

          {submitted ? (
            <div
              id="waitlist"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 22px',
                border: '1px solid rgba(251,248,243,0.4)',
                borderRadius: 14,
                fontFamily: '-apple-system, system-ui',
                fontSize: 14,
                color: '#fbf8f3',
                minWidth: 320,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  background: '#fbf8f3',
                  color: '#1a1612',
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              <span>You&apos;re in. We&apos;ll email you the moment the iOS app lands.</span>
            </div>
          ) : (
            <form
              id="waitlist"
              onSubmit={handleWaitlistSubmit}
              style={{
                display: 'flex',
                gap: 0,
                alignItems: 'stretch',
                border: '1px solid rgba(251,248,243,0.4)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => posthog.capture('waitlist_input_focused')}
                placeholder="you@email.com"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '14px 18px',
                  minWidth: 240,
                  fontFamily: '-apple-system, system-ui',
                  fontSize: 14,
                  color: '#fbf8f3',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#fbf8f3',
                  color: '#1a1612',
                  border: 'none',
                  padding: '0 22px',
                  cursor: 'pointer',
                  fontFamily: '-apple-system, system-ui',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                Join waitlist →
              </button>
            </form>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            borderTop: '1px solid rgba(251,248,243,0.15)',
            fontFamily: 'ui-monospace, SF Mono, monospace',
            fontSize: 11,
            color: '#8a7f72',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <span>© 2026 nynjworldcup · Built in the tri-state</span>
          <span style={{ display: 'flex', gap: 24 }}>
            <a
              href="https://www.instagram.com/nynjworldcup"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => posthog.capture('instagram_clicked', { location: 'footer' })}
              style={{ color: '#d6cfc4', textDecoration: 'none' }}
            >
              Instagram
            </a>
            <a href="#" style={{ color: '#d6cfc4', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: '#d6cfc4', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: '#d6cfc4', textDecoration: 'none' }}>Press kit</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div style={{ background: '#f0eee9', minHeight: '100vh' }}>
      <Hero />
      <CountryTicker />
      <FeatureRow />
      <CountriesSection />
      <FAQ />
      <Footer />
    </div>
  );
}
