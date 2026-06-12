import { useEffect, useState, type ReactNode } from 'react';
import { IOSDevice } from '~/components/IOSDevice';
import {
  InstallationContext,
  type InstallationContextValue,
} from '@/providers/InstallationProvider';
import { TabBar } from '@/components/TabBar';
import { CountryScreen } from '@/screens/CountryScreen';
import { EventsScreen } from '@/screens/EventsScreen';
import { FollowScreen } from '@/screens/FollowScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { SavedScreen } from '@/screens/SavedScreen';
import type { ScreenKey, Variant } from '@/types/domain';
import * as fx from './fixtures';

// The preview renders the *real* app screen components — no forked copies.
// `fixtures.ts` supplies static, evergreen data in the app's domain shapes;
// every callback is a no-op because the preview is display-only (the device
// wrapper sets `pointer-events: none`).

type PreviewScreen = 'home' | 'country' | 'events' | 'follow' | 'saved';

interface RotationItem {
  screen: PreviewScreen;
  label: string;
}

// Curated highlight reel — one stop per core surface of the app.
const ROTATION: RotationItem[] = [
  { screen: 'home', label: 'Today · your teams, live scores' },
  { screen: 'country', label: 'Portugal · watch parties in the Ironbound' },
  { screen: 'events', label: 'Events · fan fests, parades & pop-ups' },
  { screen: 'follow', label: 'Follow · pinged on kickoff & goals' },
  { screen: 'saved', label: 'Saved · your matchday itinerary' },
];

const VARIANT: Variant = 'sporty';

// The device renders at a true iPhone logical width (390px) so every real
// app screen lays out exactly as it does on a phone, then the whole device
// is scaled down to DISPLAY_W to fit the marketing layout. Rendering at the
// narrower display width directly would surface layout bugs that never
// happen on a real device.
const LOGICAL_W = 390;
const LOGICAL_H = 821;
const DISPLAY_W = 304;
const SCALE = DISPLAY_W / LOGICAL_W;
const DISPLAY_H = Math.round(LOGICAL_H * SCALE);

// Display-only preview: nothing here mutates state.
const noop = () => {};

// SavedScreen is the one rotated screen that reads account state from the
// app's InstallationContext. The marketing site has no real provider (and no
// backend handshake), so we satisfy the context with a static signed-out stub
// — same idea as the fixture data the other screens receive. The Provider's
// value prop type-checks this shape, so it can't silently drift.
const INSTALLATION_STUB: InstallationContextValue = {
  status: 'ready',
  installationId: 'preview',
  userId: null,
  error: null,
  username: null,
  isSignedIn: false,
  claimAccount: () => Promise.resolve(),
  signIn: () => Promise.resolve(),
  signOut: () => Promise.resolve(),
};

function renderScreen(screen: PreviewScreen): ReactNode {
  switch (screen) {
    case 'home':
      return (
        <HomeScreen
          variant={VARIANT}
          activeCode="BRA"
          countriesByCode={fx.countriesByCode}
          countryOrder={fx.countryOrder}
          matches={fx.matches}
          follows={fx.follows}
          venuesByCountry={fx.venuesByCountry}
          venuesById={fx.venuesById}
          going={fx.going}
          onPickCountry={noop}
          onPickMatch={noop}
          onPickWatchParty={noop}
          onShowSchedule={noop}
          onShowFollow={noop}
        />
      );
    case 'country': {
      const country = fx.countriesByCode.POR;
      if (!country) return null;
      return (
        <CountryScreen
          variant={VARIANT}
          country={country}
          venues={fx.venuesByCountry.POR}
          loadVenuesForCountry={fx.loadVenuesForCountry}
          going={fx.going}
          onTogglePlan={noop}
        />
      );
    }
    case 'events':
      return (
        <EventsScreen
          variant={VARIANT}
          events={fx.events}
          eventRsvps={fx.eventRsvps}
          countriesByCode={fx.countriesByCode}
          follows={fx.follows}
          matches={fx.matches}
          venuesById={fx.venuesById}
          loadAllVenues={() => Promise.resolve()}
          onToggleRsvp={noop}
        />
      );
    case 'follow':
      return (
        <FollowScreen
          variant={VARIANT}
          countries={fx.countryList}
          wcParticipantCodes={fx.wcParticipantCodes}
          follows={fx.follows}
          setFollows={noop}
          notifPrefs={fx.notifPrefs}
          setNotifPrefs={noop}
        />
      );
    case 'saved':
      return (
        <SavedScreen
          variant={VARIANT}
          countriesByCode={fx.countriesByCode}
          matches={fx.matches}
          going={fx.going}
          savedVenues={fx.savedVenues}
          venuesById={fx.venuesById}
          events={fx.events}
          eventRsvps={fx.eventRsvps}
          loadVenuesForCountry={fx.loadVenuesForCountry}
          onPickMatch={noop}
          onPickVenue={noop}
          onPickEvent={noop}
          onToggleSave={noop}
          onToggleRsvp={noop}
        />
      );
    default:
      return null;
  }
}

export function AnimatedPhone() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % ROTATION.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [paused]);

  const cur = ROTATION[idx];
  if (!cur) return null;

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        key={cur.screen}
        style={{
          width: DISPLAY_W,
          height: DISPLAY_H,
          animation: 'nynjwc-phone-fade 0.6s cubic-bezier(.2,.8,.2,1)',
        }}
      >
        {/* Logical-size device, scaled down into the DISPLAY_W × DISPLAY_H box. */}
        <div
          style={{
            width: LOGICAL_W,
            height: LOGICAL_H,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          <IOSDevice width={LOGICAL_W} height={LOGICAL_H}>
            {/*
              Pure visual preview — pointer-events: none disables clicks,
              scrolls, taps, and selection on every nested screen component
              and the TabBar. The marketing phone is meant to be watched, not
              poked. Hover-pause still works (it's on the parent), as do the
              dot pagination buttons (they live outside this container).
            */}
          <div
            className="scroll-hide"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              // Reserve a home-indicator strip at the bottom. A real iPhone
              // gives the TabBar ~34px of `env(safe-area-inset-bottom)`; in a
              // browser that env var is 0, so without this the TabBar sits
              // flush against the phone's rounded corners and clips the
              // first/last tab labels (Events, Saved).
              bottom: 34,
              background: '#f7f5f1',
              overflowY: 'hidden',
              overflowX: 'hidden',
              pointerEvents: 'none',
              userSelect: 'none',
              // The real app TabBar is `position: fixed`. The transform makes
              // this div a containing block so the TabBar pins to the bottom
              // of this strip instead of escaping to the page viewport.
              transform: 'translateZ(0)',
            }}
          >
            <InstallationContext.Provider value={INSTALLATION_STUB}>
              {renderScreen(cur.screen)}
              <TabBar active={cur.screen as ScreenKey} onChange={noop} />
            </InstallationContext.Provider>
          </div>
          </IOSDevice>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -54,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'ui-monospace, SF Mono, monospace',
          fontSize: 11,
          color: '#8a7f72',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: 3,
            background: '#1a1612',
            animation: 'nynjwc-pulse 2s infinite',
          }}
        />
        {cur.label}
      </div>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -84,
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 6,
        }}
      >
        {ROTATION.map((item, i) => (
          <button
            key={item.screen}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Show ${item.screen} screen`}
            style={{
              width: i === idx ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background: i === idx ? '#1a1612' : '#d6cfc4',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(.2,.8,.2,1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
