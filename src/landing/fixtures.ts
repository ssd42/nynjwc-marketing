/**
 * Static fixtures for the marketing phone preview.
 *
 * The preview (`AnimatedPhone`) renders the *real* app screen components,
 * so it needs data in the real app domain shapes. This file adapts the
 * marketing site's own country/venue content (`~/data`) into those shapes
 * and hand-writes a small, evergreen set of matches and events.
 *
 * Match/event timestamps are computed relative to "now" on every load, so
 * the preview always shows a live match + upcoming fixtures no matter when
 * the page is viewed.
 */
import type {
  Country,
  CountryCode,
  Event,
  Match,
  NotificationPrefs,
  Venue,
} from '@/types/domain';
import { COUNTRIES, COUNTRY_ORDER } from '~/data';

// ─── Countries & venues (adapted from the marketing content) ──────────────

const ET = 'America/New_York';

function etTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ET,
  });
}

/** ISO timestamp `mins` minutes from now (negative = in the past). */
function iso(mins: number): string {
  return new Date(Date.now() + mins * 60_000).toISOString();
}

export const countriesByCode: Partial<Record<CountryCode, Country>> = {};
export const venuesByCountry: Partial<Record<CountryCode, Venue[]>> = {};
export const venuesById: Record<string, Venue> = {};

for (const code of COUNTRY_ORDER) {
  const src = COUNTRIES[code];
  countriesByCode[code] = {
    code: src.code,
    name: src.name,
    flag: src.flag,
    colors: src.colors,
    tagline: src.tagline,
    neighborhoods: src.neighborhoods,
    // Curated == has venue data in the landing dataset.
    curated: src.venues.length > 0,
  };
  const venues: Venue[] = src.venues.map((v, i) => {
    const venue: Venue = {
      id: `${code}-${i}`,
      countryCode: src.code,
      name: v.name,
      type: v.type,
      hood: v.hood,
      distance: v.distance,
      goingCount: v.rsvps,
      friends: v.friends,
      photo: v.photo,
      lat: v.lat,
      lng: v.lng,
      googleMapsUrl: null,
      // null on purpose: the preview cards carry real venue names, so a
      // stock photo would misrepresent the actual business. This renders
      // the app's real generated placeholder; real photos flow through
      // automatically once the image system has them.
      imageUrl: null,
    };
    venuesById[venue.id] = venue;
    return venue;
  });
  venuesByCountry[code] = venues;
}

export const countryOrder: CountryCode[] = [...COUNTRY_ORDER];
export const countryList: Country[] = countryOrder
  .map((c) => countriesByCode[c])
  .filter((c): c is Country => Boolean(c));

/** Every preview country doubles as a "World Cup participant" for FollowScreen. */
export const wcParticipantCodes = new Set<CountryCode>(countryOrder);

// ─── Matches ──────────────────────────────────────────────────────────────

function match(
  id: string,
  home: CountryCode,
  away: CountryCode,
  kickoffMins: number,
  stage: string,
  extra: Partial<Match> = {},
): Match {
  return {
    id,
    home,
    away,
    homeLabel: null,
    awayLabel: null,
    kickoffAt: iso(kickoffMins),
    time: etTime(new Date(Date.now() + kickoffMins * 60_000)),
    stage,
    stadium: 'MetLife Stadium',
    live: false,
    ...extra,
  };
}

export const matches: Match[] = [
  match('m-live', 'ARG', 'MEX', -72, 'Group D', { live: true, minute: 72, score: '2 – 1' }),
  match('m-also', 'GER', 'JPN', 95, 'Group F'),
  match('m-1', 'BRA', 'COL', 165, 'Group A'),
  match('m-2', 'POR', 'FRA', 320, 'Group B'),
  match('m-3', 'USA', 'ECU', 60 * 26, 'Group C'),
  match('m-4', 'BRA', 'GER', 60 * 24 * 3, 'Group A'),
  match('m-5', 'ARG', 'CRO', 60 * 24 * 4, 'Group E'),
];

// ─── Events ───────────────────────────────────────────────────────────────

export const events: Event[] = [
  {
    id: 'e-1',
    kind: 'fanfest',
    title: 'Brazil Fan Fest — Astoria',
    startsAt: iso(120),
    endsAt: iso(360),
    countryCode: 'BRA',
    matchId: 'm-1',
    venueId: null,
    venueName: 'Athens Square Park',
    venueHood: 'Astoria, Queens',
    imageUrl: null,
    sourceUrl: null,
    venueMapUrl: null,
    isFree: true,
    goingCount: 240,
    isHot: true,
  },
  {
    id: 'e-2',
    kind: 'watch',
    title: 'Portugal vs France — big-screen watch party',
    startsAt: iso(320),
    endsAt: iso(440),
    countryCode: 'POR',
    matchId: 'm-2',
    venueId: 'POR-0',
    venueName: null,
    venueHood: null,
    imageUrl: null,
    sourceUrl: null,
    venueMapUrl: null,
    isFree: false,
    goingCount: 88,
    isHot: false,
  },
  {
    id: 'e-3',
    kind: 'after',
    title: 'Argentina after-party',
    startsAt: iso(160),
    endsAt: null,
    countryCode: 'ARG',
    matchId: 'm-live',
    venueId: 'ARG-0',
    venueName: null,
    venueHood: null,
    imageUrl: null,
    sourceUrl: null,
    venueMapUrl: null,
    isFree: false,
    goingCount: 64,
    isHot: false,
  },
  {
    id: 'e-4',
    kind: 'food',
    title: 'Mexican street-food pop-up',
    startsAt: iso(60 * 26),
    endsAt: iso(60 * 30),
    countryCode: 'MEX',
    matchId: null,
    venueId: null,
    venueName: 'Sunset Park',
    venueHood: 'Brooklyn',
    imageUrl: null,
    sourceUrl: null,
    venueMapUrl: null,
    isFree: true,
    goingCount: 51,
    isHot: false,
  },
  {
    id: 'e-5',
    kind: 'parade',
    title: 'Colombia matchday parade',
    startsAt: iso(60 * 48),
    endsAt: iso(60 * 51),
    countryCode: 'COL',
    matchId: null,
    venueId: null,
    venueName: 'Roosevelt Avenue',
    venueHood: 'Jackson Heights, Queens',
    imageUrl: null,
    sourceUrl: null,
    venueMapUrl: null,
    isFree: true,
    goingCount: 130,
    isHot: true,
  },
];

// ─── User state ───────────────────────────────────────────────────────────

export const follows: Partial<Record<CountryCode, boolean>> = {
  BRA: true,
  ARG: true,
  POR: true,
};

/** venueId → matchId of the active "going" plan. */
export const going: Record<string, string | undefined> = {
  'ARG-0': 'm-live',
  'BRA-0': 'm-1',
  'POR-0': 'm-2',
};

export const eventRsvps = new Set<string>(['e-1', 'e-3']);

export const savedVenues: Venue[] = [
  venuesById['MEX-0'],
  venuesById['FRA-1'],
].filter((v): v is Venue => Boolean(v));

export const notifPrefs: NotificationPrefs = {
  matchStart: true,
  goals: true,
  newSpots: true,
};

/** Resolves a country's venues — shaped like the app store's lazy loader. */
export function loadVenuesForCountry(code: CountryCode): Promise<Venue[]> {
  return Promise.resolve(venuesByCountry[code] ?? []);
}
