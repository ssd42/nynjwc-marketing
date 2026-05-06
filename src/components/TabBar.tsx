type TabId = 'home' | 'map' | 'follow' | 'saved';

interface TabBarProps {
  active: TabId;
}

interface Tab {
  id: TabId;
  label: string;
  icon: 'home' | 'map' | 'bell' | 'bookmark';
}

const TABS: Tab[] = [
  { id: 'home', label: 'Today', icon: 'home' },
  { id: 'map', label: 'Map', icon: 'map' },
  { id: 'follow', label: 'Follow', icon: 'bell' },
  { id: 'saved', label: 'Saved', icon: 'bookmark' },
];

function Icon({ id, active }: { id: Tab['icon']; active: boolean }) {
  const stroke = active ? '#0a0a0a' : '#9a9590';
  if (id === 'home') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <path d="M3 11l9-8 9 8v10a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2V11z" />
      </svg>
    );
  }
  if (id === 'map') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
      </svg>
    );
  }
  if (id === 'bell') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
        <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 004 0" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M5 4h14v18l-7-4-7 4V4z" />
    </svg>
  );
}

// Static decorative tab bar for the phone preview — no click handling needed,
// the marketing page just shows the bar so the iPhone mockup looks complete.
export function TabBar({ active }: TabBarProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 24,
        paddingTop: 8,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 30,
      }}
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 8px',
              flex: 1,
            }}
          >
            <Icon id={t.icon} active={isActive} />
            <span
              style={{
                fontFamily: '-apple-system, system-ui',
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#0a0a0a' : '#9a9590',
                letterSpacing: 0.2,
              }}
            >
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
