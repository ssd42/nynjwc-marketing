import { useEffect, useState, type ReactNode } from 'react';
import { IOSDevice } from '@/components/IOSDevice';
import { TabBar } from '@/components/TabBar';
import { CountryScreen } from '@/screens/CountryScreen';
import { FollowScreen } from '@/screens/FollowScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { MapScreen } from '@/screens/MapScreen';
import { SavedScreen } from '@/screens/SavedScreen';
import type { CountryCode, NotificationPrefs, ScreenKey } from '@/types';

interface RotationItem {
  country: CountryCode;
  screen: ScreenKey;
  label: string;
}

// Curated highlight reel — picks specific (country, screen) pairings that
// show off each surface of the app at its best.
const ROTATION: RotationItem[] = [
  { country: 'BRA', screen: 'home', label: "Home · Today's matches" },
  { country: 'BRA', screen: 'country', label: 'Brazil · Watch parties in Astoria' },
  { country: 'POR', screen: 'country', label: 'Portugal · The Ironbound' },
  { country: 'ARG', screen: 'map', label: 'Map · Spots near you' },
  { country: 'MEX', screen: 'country', label: 'Mexico · Sunset Park & Passaic' },
  { country: 'POR', screen: 'follow', label: 'Follow · Get pinged on goals' },
  { country: 'BRA', screen: 'saved', label: 'Saved · Your itinerary' },
];

const VARIANT = 'sporty';

export function AnimatedPhone() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Seed some shared state so Saved looks alive in the rotation.
  const [going, setGoing] = useState<Record<string, boolean>>({
    'BRA-0': true,
    'ARG-2': true,
    'POR-0': true,
  });
  const [follows, setFollows] = useState<Partial<Record<CountryCode, boolean>>>({
    BRA: true,
    ARG: true,
    POR: true,
  });
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    matchStart: true,
    goals: true,
    newSpots: true,
    friendsGoing: false,
  });

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % ROTATION.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [paused]);

  const cur = ROTATION[idx];
  if (!cur) return null;
  const stackKey = `${cur.country}-${cur.screen}-${idx}`;

  function renderScreen(country: CountryCode, screen: ScreenKey): ReactNode {
    const onRsvp = (key: string) =>
      setGoing((g) => ({ ...g, [key]: !g[key] }));
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            variant={VARIANT}
            activeCode={country}
            onPickCountry={() => {}}
            onPickMatch={() => {}}
          />
        );
      case 'country':
        return (
          <CountryScreen
            variant={VARIANT}
            activeCode={country}
            going={going}
            onRsvp={onRsvp}
          />
        );
      case 'map':
        return <MapScreen variant={VARIANT} activeCode={country} />;
      case 'follow':
        return (
          <FollowScreen
            variant={VARIANT}
            follows={follows}
            setFollows={setFollows}
            notifPrefs={notifPrefs}
            setNotifPrefs={setNotifPrefs}
          />
        );
      case 'saved':
        return <SavedScreen variant={VARIANT} going={going} />;
      default:
        return null;
    }
  }

  // Map the visible screen to which tab should be highlighted in the bar.
  const tabFor = (screen: ScreenKey) => (screen === 'country' ? 'home' : screen);

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        key={stackKey}
        style={{ animation: 'nynjwc-phone-fade 0.6s cubic-bezier(.2,.8,.2,1)' }}
      >
        <IOSDevice width={304} height={640}>
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
              inset: 0,
              background: '#f7f5f1',
              overflowY: 'hidden',
              overflowX: 'hidden',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {renderScreen(cur.country, cur.screen)}
            <TabBar active={tabFor(cur.screen)} />
          </div>
        </IOSDevice>
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
        {ROTATION.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Show screen ${i + 1}`}
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
