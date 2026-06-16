/**
 * Gated submission tool — the unadvertised /submit.html.
 *
 * Two steps: a code gate, then a workspace that toggles between two modes —
 * Event and Venue — each with a Form tab and a JSON (AI-assisted) tab, plus a
 * single admin-only Review queue shared across both types. Anyone with a valid
 * code can submit; an `admin`-role code unlocks the queue. The code is held in
 * React state only (never localStorage) and sent on every request as the
 * `X-Event-Code` header.
 *
 * Submissions land server-side as status='pending' and stay out of the app
 * until approved here. Events live in the events table; approved venues are
 * promoted into the canonical venues table. See
 * nynjwc-backend/app/api/{event_submissions,venue_submissions}.py.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

type Role = 'submit' | 'admin';
type Session = { label: string; role: Role };

type Country = { code: string; name: string; flagEmoji: string };
type Venue = { id: string; name: string; hood: string };
type Match = {
  id: string;
  homeCode: string | null;
  awayCode: string | null;
  homeLabel: string | null;
  awayLabel: string | null;
  kickoffAt: string;
  stage: string;
};

type PendingEvent = {
  id: string;
  kind: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  countryCode: string | null;
  venueId: string | null;
  venueName: string | null;
  venueHood: string | null;
  venueMapUrl: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  isFree: boolean;
  submittedBy: string | null;
  createdAt: string;
};

type PendingVenue = {
  id: string;
  countryCode: string;
  name: string;
  type: string;
  hood: string;
  lat: number;
  lng: number;
  googleMapsUrl: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  submittedBy: string | null;
  createdAt: string;
};

type UploadUrlResponse = { uploadUrl: string; publicUrl: string; key: string };

type BatchSkipped = {
  index: number;
  reason: 'invalid' | 'duplicate';
  errors?: string[] | null;
  matchedEventId?: string | null;
};
type BatchResult = { created: string[]; skipped: BatchSkipped[] };

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Pull the first image out of a paste/drag payload. Screenshots arrive as an
// `image/*` item (⌘V from the screenshot tool / a copied image); returns null
// for text-only pastes so the caller can let those behave normally.
function imageFromClipboard(data: DataTransfer): File | null {
  for (const item of Array.from(data.items)) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  for (const file of Array.from(data.files)) {
    if (file.type.startsWith('image/')) return file;
  }
  return null;
}

const KINDS = [
  { value: 'watch', label: 'Watch party' },
  { value: 'fanfest', label: 'Fan fest' },
  { value: 'food', label: 'Food pop-up' },
  { value: 'parade', label: 'Parade' },
  { value: 'after', label: 'After-party' },
] as const;

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Fetch wrapper: attaches the access code, unwraps RFC 7807 `detail`. */
async function api<T>(path: string, code: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Event-Code': code,
      ...(init?.headers ?? {}),
    },
  });
  if (!resp.ok) {
    let detail = `Request failed (${resp.status})`;
    try {
      const body = (await resp.json()) as { detail?: unknown };
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      /* non-JSON error body — keep the generic message */
    }
    throw new ApiError(resp.status, detail);
  }
  const text = await resp.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** Convert a <input type="datetime-local"> value to an ISO-8601 UTC string. */
function toIso(local: string): string {
  return new Date(local).toISOString();
}

/** Inverse of toIso: an ISO string → a local `datetime-local` input value. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

// ── Styles ────────────────────────────────────────────────────────────────
const COLORS = {
  bg: '#f0eee9',
  ink: '#1a1612',
  card: '#ffffff',
  line: '#d8d4cb',
  accent: '#1a1612',
  danger: '#a8322d',
  muted: '#6f6a60',
};

const s = {
  page: {
    minHeight: '100vh',
    background: COLORS.bg,
    color: COLORS.ink,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    padding: '32px 16px',
    boxSizing: 'border-box',
  } as CSSProperties,
  shell: { maxWidth: 560, margin: '0 auto' } as CSSProperties,
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 12,
    padding: 24,
  } as CSSProperties,
  h1: { fontSize: 22, fontWeight: 600, margin: '0 0 4px' } as CSSProperties,
  h2: { fontSize: 16, fontWeight: 600, margin: '0 0 4px' } as CSSProperties,
  sub: { fontSize: 13, color: COLORS.muted, margin: '0 0 20px' } as CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, margin: '14px 0 4px' } as CSSProperties,
  input: {
    width: '100%',
    padding: '9px 11px',
    fontSize: 14,
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    boxSizing: 'border-box',
    background: '#fff',
    color: COLORS.ink,
  } as CSSProperties,
  button: {
    width: '100%',
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: COLORS.accent,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 18,
  } as CSSProperties,
  errorBox: {
    background: '#fbeae9',
    border: `1px solid ${COLORS.danger}`,
    color: COLORS.danger,
    borderRadius: 8,
    padding: '9px 11px',
    fontSize: 13,
    marginTop: 14,
  } as CSSProperties,
  tabRow: { display: 'flex', gap: 8, marginBottom: 16 } as CSSProperties,
  rowCheck: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 14 } as CSSProperties,
  pre: {
    background: '#f7f5f0',
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    overflow: 'auto',
    margin: 0,
    whiteSpace: 'pre',
  } as CSSProperties,
  notes: {
    fontSize: 12,
    color: COLORS.muted,
    margin: '10px 0 0',
    paddingLeft: 18,
  } as CSSProperties,
  textarea: {
    width: '100%',
    padding: '9px 11px',
    fontSize: 13,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    border: `1px solid ${COLORS.line}`,
    borderRadius: 8,
    boxSizing: 'border-box',
    background: '#fff',
    color: COLORS.ink,
    minHeight: 220,
    resize: 'vertical',
  } as CSSProperties,
};

const JSON_TEMPLATE = `{
  "kind": "watch",
  "title": "Brazil vs Argentina watch party",
  "startsAt": "2026-06-14T19:00:00-04:00",
  "endsAt": "2026-06-14T23:00:00-04:00",
  "countryCode": "BRA",
  "venueName": "Bar Yono",
  "venueHood": "Astoria",
  "venueMapUrl": "https://maps.google.com/?q=...",
  "sourceUrl": "https://www.instagram.com/p/...",
  "isFree": false
}`;

const JSON_FIELD_NOTES: string[] = [
  'kind: one of watch | fanfest | food | parade | after',
  'title: required, 1–200 chars',
  'startsAt / endsAt: ISO 8601 with timezone offset (e.g. -04:00 for EDT)',
  'countryCode: ISO 3-letter — optional, must be one of the codes listed below',
  'venueName / venueHood / venueMapUrl: use these for any venue not in our DB',
  'sourceUrl: original post link (Instagram, etc.) — optional',
  'isFree: boolean, defaults to false',
  'Omit imageUrl — upload the image below and it will be merged in automatically',
  'Omit venueId and matchId — they require internal DB ULIDs you won’t have',
];

// Mirrors the CountryCode union in nynjwc-frontend/src/types/domain.ts.
// Static so the AI generating JSON sees the exact valid set; if the frontend
// list changes, copy it over here too.
const VALID_KINDS = ['watch', 'fanfest', 'food', 'parade', 'after'] as const;
const COUNTRY_CODES: readonly string[] = [
  'ALG', 'AND', 'ARG', 'ARU', 'AUS', 'AUT', 'BEL', 'BIH', 'BOL', 'BRA',
  'CAN', 'CHI', 'CIV', 'COD', 'COL', 'CPV', 'CRC', 'CRO', 'CUW', 'CZE',
  'DEN', 'DOM', 'ECU', 'EGY', 'ENG', 'ESP', 'FIN', 'FRA', 'GER', 'GHA',
  'GUA', 'HAI', 'HON', 'HUN', 'IRL', 'IRN', 'IRQ', 'ISL', 'JOR', 'JPN',
  'KOR', 'KSA', 'MAR', 'MEX', 'MKD', 'NCA', 'NED', 'NGA', 'NIR', 'NOR',
  'NZL', 'PAN', 'PAR', 'PER', 'POL', 'POR', 'QAT', 'RSA', 'RUS', 'SCO',
  'SEN', 'SLV', 'SRB', 'SUI', 'SVN', 'SWE', 'TUN', 'TUR', 'URU', 'USA',
  'UZB', 'VEN', 'WAL',
];
const COUNTRY_CODE_SET = new Set(COUNTRY_CODES);

// Validates a parsed JSON payload before we ship it to the API. Returns
// the first problem found (so the user can fix one thing and see the next
// on resubmit) or null when everything looks good.
function validateEventPayload(payload: Record<string, unknown>): string | null {
  if (typeof payload.kind !== 'string') return 'kind is required (watch | fanfest | food | parade | after).';
  if (!(VALID_KINDS as readonly string[]).includes(payload.kind)) {
    return `kind "${payload.kind}" is not valid — use one of: ${VALID_KINDS.join(', ')}.`;
  }
  if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
    return 'title is required.';
  }
  if (typeof payload.startsAt !== 'string' || Number.isNaN(Date.parse(payload.startsAt))) {
    return 'startsAt must be an ISO 8601 timestamp with timezone (e.g. 2026-06-14T19:00:00-04:00).';
  }
  if (payload.endsAt !== undefined && payload.endsAt !== null) {
    if (typeof payload.endsAt !== 'string' || Number.isNaN(Date.parse(payload.endsAt))) {
      return 'endsAt must be an ISO 8601 timestamp with timezone, or omitted.';
    }
  }
  if (payload.countryCode !== undefined && payload.countryCode !== null) {
    if (typeof payload.countryCode !== 'string' || !COUNTRY_CODE_SET.has(payload.countryCode)) {
      return `countryCode "${String(payload.countryCode)}" is not in our supported list — see the codes below.`;
    }
  }
  if (payload.isFree !== undefined && typeof payload.isFree !== 'boolean') {
    return 'isFree must be true or false.';
  }
  return null;
}

// ── Venue submission: JSON reference + validation ───────────────────────────
const VENUE_JSON_TEMPLATE = `{
  "countryCode": "BRA",
  "name": "Boteco da Esquina",
  "type": "Brazilian Bar",
  "hood": "Ironbound, Newark",
  "lat": 40.7320,
  "lng": -74.1620,
  "googleMapsUrl": "https://maps.google.com/?q=...",
  "sourceUrl": "https://www.instagram.com/p/...",
  "socialsUrl": "https://www.instagram.com/thevenue/"
}`;

const VENUE_JSON_FIELD_NOTES: string[] = [
  'countryCode: ISO 3-letter — must be one of the codes listed below',
  'name / type / hood: required (type is the cuisine/venue descriptor, e.g. "Brazilian Steakhouse")',
  'lat / lng: required decimal degrees. In Google Maps, right-click the spot → click the “lat, lng” at the top to copy them',
  'googleMapsUrl: link to the place — optional',
  'sourceUrl: original listing / Instagram post — optional',
  'socialsUrl: the venue’s own Instagram / Facebook page — optional',
  'Omit imageUrl — upload the photo below and it is merged in automatically',
  'Omit photoSlug / displayOrder — assigned automatically when an admin approves',
];

// Generous NY/NJ-area sanity box — mirrors the backend check in
// app/schemas/venue_submission.py. Catches swapped lat/lng and ocean typos.
const VENUE_LAT = [39.0, 42.0] as const;
const VENUE_LNG = [-76.0, -72.0] as const;

function coordsLookSane(lat: number, lng: number): boolean {
  return lat >= VENUE_LAT[0] && lat <= VENUE_LAT[1] && lng >= VENUE_LNG[0] && lng <= VENUE_LNG[1];
}

// Validates a parsed venue JSON payload before shipping it to the API.
function validateVenuePayload(payload: Record<string, unknown>): string | null {
  if (typeof payload.countryCode !== 'string' || !COUNTRY_CODE_SET.has(payload.countryCode)) {
    return `countryCode "${String(payload.countryCode)}" is not in our supported list — see the codes below.`;
  }
  for (const field of ['name', 'type', 'hood'] as const) {
    const v = payload[field];
    if (typeof v !== 'string' || v.trim().length === 0) return `${field} is required.`;
  }
  if (typeof payload.lat !== 'number' || Number.isNaN(payload.lat)) return 'lat must be a number.';
  if (typeof payload.lng !== 'number' || Number.isNaN(payload.lng)) return 'lng must be a number.';
  if (!coordsLookSane(payload.lat, payload.lng)) {
    return 'lat/lng look wrong for the NY/NJ area — check they aren’t swapped (lat ~40.x, lng ~-74.x).';
  }
  return null;
}

function tabStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    cursor: 'pointer',
    border: `1px solid ${active ? COLORS.accent : COLORS.line}`,
    background: active ? COLORS.accent : '#fff',
    color: active ? '#fff' : COLORS.ink,
  };
}

// ── Code gate ───────────────────────────────────────────────────────────────
function Gate({ onUnlock }: { onUnlock: (code: string, session: Session) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const session = await api<Session>('/v1/submissions/verify', code.trim(), {
        method: 'POST',
      });
      onUnlock(code.trim(), session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={s.shell}>
      <form style={s.card} onSubmit={submit}>
        <h1 style={s.h1}>Submissions</h1>
        <p style={s.sub}>Enter your access code to continue.</p>
        <label style={s.label} htmlFor="code">
          Access code
        </label>
        <input
          id="code"
          style={s.input}
          type="password"
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        {error && <div style={s.errorBox}>{error}</div>}
        <button style={s.button} type="submit" disabled={busy}>
          {busy ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}

// ── Image upload (click-to-browse or paste a screenshot) ────────────────────
// The empty box is focusable: click it, then ⌘V / Ctrl+V drops a clipboard
// screenshot straight in — the fast path for event flyers. The "choose a file"
// link is the classic picker. `compact` is the narrow 96×128 slot used in the
// Enrich queue; the default is a full-width box for the submit forms.
function ImageUpload({
  imageUrl,
  uploading,
  onFile,
  onClear,
  compact = false,
}: {
  imageUrl: string;
  uploading: boolean;
  onFile: (file: File | null) => void;
  onClear: () => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (imageUrl) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: compact ? 'column' : 'row',
          gap: compact ? 0 : 12,
          alignItems: 'flex-start',
          marginTop: 4,
        }}
      >
        <img
          src={imageUrl}
          alt="uploaded preview"
          style={{
            width: 96,
            height: compact ? 128 : undefined,
            maxHeight: compact ? undefined : 160,
            objectFit: 'cover',
            borderRadius: compact ? 6 : 8,
            border: `1px solid ${COLORS.line}`,
          }}
        />
        <button
          type="button"
          onClick={onClear}
          style={{
            fontSize: 12,
            color: COLORS.danger,
            background: 'none',
            border: 'none',
            padding: compact ? '4px 0 0' : 0,
            cursor: 'pointer',
          }}
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onPaste={(e) => {
        const file = imageFromClipboard(e.clipboardData);
        if (!file) return; // let text-only pastes behave normally
        e.preventDefault();
        void onFile(file);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        width: compact ? 96 : undefined,
        height: compact ? 128 : undefined,
        minHeight: compact ? undefined : 60,
        marginTop: 4,
        padding: compact ? 4 : 10,
        borderRadius: 6,
        border: `1px dashed ${COLORS.line}`,
        background: '#fafafa',
        color: COLORS.muted,
        fontSize: compact ? 11 : 13,
        lineHeight: 1.3,
        cursor: 'text',
      }}
    >
      {uploading ? (
        'Uploading…'
      ) : (
        <>
          <span>Paste a screenshot{compact ? '' : ' here'} (⌘V)</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              fontSize: compact ? 11 : 12,
              color: COLORS.muted,
              background: 'none',
              border: 'none',
              padding: 0,
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            {compact ? 'or file' : 'or choose a file'}
          </button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// ── Add-event form ──────────────────────────────────────────────────────────
function AddEventForm({ code }: { code: string }) {
  const [kind, setKind] = useState<string>('watch');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [matchId, setMatchId] = useState('');
  const [venueId, setVenueId] = useState('');
  const [freeText, setFreeText] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueHood, setVenueHood] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [venueMapUrl, setVenueMapUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState('');

  useEffect(() => {
    api<Country[]>('/v1/countries', code)
      .then(setCountries)
      .catch(() => setError('Could not load the country list.'));
    api<Match[]>('/v1/matches', code)
      .then(setMatches)
      .catch(() => setMatches([]));
  }, [code]);

  useEffect(() => {
    setVenueId('');
    if (!countryCode) {
      setVenues([]);
      return;
    }
    api<Venue[]>(`/v1/countries/${countryCode}/venues`, code)
      .then(setVenues)
      .catch(() => setVenues([]));
  }, [countryCode, code]);

  const reset = () => {
    setTitle('');
    setStartsAt('');
    setEndsAt('');
    setMatchId('');
    setVenueId('');
    setVenueName('');
    setVenueHood('');
    setIsFree(false);
    setImageUrl('');
    setSourceUrl('');
    setVenueMapUrl('');
    setDoneId('');
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Only image files (jpg, png, webp, gif).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const presigned = await api<UploadUrlResponse>(
        '/v1/events/submissions/upload-url',
        code,
        { method: 'POST', body: JSON.stringify({ contentType: file.type }) },
      );
      const putResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResp.ok) {
        throw new Error(`S3 upload failed (${putResp.status}).`);
      }
      setImageUrl(presigned.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');

    if (!title.trim()) return setError('Give the event a title.');
    if (!startsAt) return setError('Pick a start time.');
    if (freeText && !venueName.trim()) return setError('Enter a venue name.');
    if (!freeText && !venueId) return setError('Pick a venue, or switch to a free-text location.');

    const payload: Record<string, unknown> = {
      kind,
      title: title.trim(),
      startsAt: toIso(startsAt),
      isFree,
    };
    if (endsAt) payload.endsAt = toIso(endsAt);
    if (countryCode) payload.countryCode = countryCode;
    if (freeText) {
      payload.venueName = venueName.trim();
      if (venueHood.trim()) payload.venueHood = venueHood.trim();
    } else {
      payload.venueId = venueId;
    }
    if (matchId) payload.matchId = matchId;
    if (imageUrl) payload.imageUrl = imageUrl;
    if (sourceUrl.trim()) payload.sourceUrl = sourceUrl.trim();
    // Map URL only meaningful for free-text venues — known venues
    // already carry their own google_maps_url on the venue record.
    if (freeText && venueMapUrl.trim()) payload.venueMapUrl = venueMapUrl.trim();

    setBusy(true);
    try {
      const result = await api<{ id: string }>('/v1/events/submissions', code, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setDoneId(result.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (doneId) {
    return (
      <div style={s.card}>
        <h1 style={s.h1}>Event submitted</h1>
        <p style={s.sub}>
          Saved as <code>{doneId}</code>. It is pending review and will go live once an
          admin approves it.
        </p>
        <button style={s.button} type="button" onClick={reset}>
          Add another
        </button>
      </div>
    );
  }

  return (
    <form style={s.card} onSubmit={submit}>
      <h1 style={s.h1}>Add an event</h1>
      <p style={s.sub}>It will be reviewed before appearing in the app.</p>

      <label style={s.label} htmlFor="kind">
        Type
      </label>
      <select id="kind" style={s.input} value={kind} onChange={(e) => setKind(e.target.value)}>
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>

      <label style={s.label} htmlFor="title">
        Title
      </label>
      <input
        id="title"
        style={s.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Brazil vs Argentina watch party"
      />

      <label style={s.label} htmlFor="startsAt">
        Starts
      </label>
      <input
        id="startsAt"
        style={s.input}
        type="datetime-local"
        value={startsAt}
        onChange={(e) => setStartsAt(e.target.value)}
      />

      <label style={s.label} htmlFor="endsAt">
        Ends <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span>
      </label>
      <input
        id="endsAt"
        style={s.input}
        type="datetime-local"
        value={endsAt}
        onChange={(e) => setEndsAt(e.target.value)}
      />

      <label style={s.label} htmlFor="country">
        Country <span style={{ color: COLORS.muted, fontWeight: 400 }}>(host / venue affiliation)</span>
      </label>
      <select
        id="country"
        style={s.input}
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
      >
        <option value="">— none —</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flagEmoji} {c.name}
          </option>
        ))}
      </select>

      <label style={s.label} htmlFor="match">
        Match <span style={{ color: COLORS.muted, fontWeight: 400 }}>(links event to both teams)</span>
      </label>
      <select
        id="match"
        style={s.input}
        value={matchId}
        onChange={(e) => setMatchId(e.target.value)}
      >
        <option value="">— none (generic event) —</option>
        {[...matches]
          .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
          .map((m) => {
            const date = new Date(m.kickoffAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });
            const home = m.homeCode ?? m.homeLabel ?? '?';
            const away = m.awayCode ?? m.awayLabel ?? '?';
            return (
              <option key={m.id} value={m.id}>
                {date} · {home} vs {away}
              </option>
            );
          })}
      </select>

      <div style={s.rowCheck}>
        <input
          id="freeText"
          type="checkbox"
          checked={freeText}
          onChange={(e) => setFreeText(e.target.checked)}
        />
        <label htmlFor="freeText">Venue isn’t listed (pop-up / one-off location)</label>
      </div>

      {freeText ? (
        <>
          <label style={s.label} htmlFor="venueName">
            Venue name
          </label>
          <input
            id="venueName"
            style={s.input}
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
          />
          <label style={s.label} htmlFor="venueHood">
            Neighborhood <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="venueHood"
            style={s.input}
            value={venueHood}
            onChange={(e) => setVenueHood(e.target.value)}
          />
          <label style={s.label} htmlFor="venueMapUrl">
            Google Maps URL <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            id="venueMapUrl"
            style={s.input}
            type="url"
            placeholder="https://maps.google.com/?q=…"
            value={venueMapUrl}
            onChange={(e) => setVenueMapUrl(e.target.value)}
          />
        </>
      ) : (
        <>
          <label style={s.label} htmlFor="venue">
            Venue
          </label>
          <select
            id="venue"
            style={s.input}
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            disabled={!countryCode}
          >
            <option value="">{countryCode ? '— pick a venue —' : 'Pick a country first'}</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.hood}
              </option>
            ))}
          </select>
        </>
      )}

      <div style={s.rowCheck}>
        <input
          id="isFree"
          type="checkbox"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
        />
        <label htmlFor="isFree">Free entry</label>
      </div>

      <label style={s.label}>
        Image <span style={{ color: COLORS.muted, fontWeight: 400 }}>(jpg, png, webp, gif · up to 10 MB)</span>
      </label>
      <ImageUpload
        imageUrl={imageUrl}
        uploading={uploading}
        onFile={onPickFile}
        onClear={() => setImageUrl('')}
      />

      <label style={s.label} htmlFor="sourceUrl">
        Source URL <span style={{ color: COLORS.muted, fontWeight: 400 }}>(Instagram post, optional)</span>
      </label>
      <input
        id="sourceUrl"
        style={s.input}
        type="url"
        placeholder="https://www.instagram.com/p/…"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
      />

      {error && <div style={s.errorBox}>{error}</div>}
      <button style={s.button} type="submit" disabled={busy || uploading}>
        {busy ? 'Submitting…' : 'Submit event'}
      </button>
    </form>
  );
}

// ── JSON entry (paste an AI-generated payload) ──────────────────────────────
function JsonEventForm({ code }: { code: string }) {
  const [jsonText, setJsonText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState('');
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Cheap detection so the submit button can label itself; the authoritative
  // array/object branch happens in submit() after a real JSON.parse.
  const isBatch = useMemo(() => jsonText.trim().startsWith('['), [jsonText]);

  // Live-parse jsonText so the user can test the venueMapUrl in a new tab
  // before committing. Silent on parse errors — the live preview is a
  // best-effort convenience, not a validation surface.
  const previewMapUrl = useMemo<string | null>(() => {
    if (!jsonText.trim()) return null;
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      const url = parsed?.venueMapUrl;
      if (typeof url !== 'string') return null;
      if (!/^https?:\/\//i.test(url)) return null;
      return url;
    } catch {
      return null;
    }
  }, [jsonText]);

  const reset = () => {
    setJsonText('');
    setImageUrl('');
    setDoneId('');
    setBatchResult(null);
    setError('');
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Only image files (jpg, png, webp, gif).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const presigned = await api<UploadUrlResponse>(
        '/v1/events/submissions/upload-url',
        code,
        { method: 'POST', body: JSON.stringify({ contentType: file.type }) },
      );
      const putResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResp.ok) {
        throw new Error(`S3 upload failed (${putResp.status}).`);
      }
      setImageUrl(presigned.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(JSON_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable in some contexts */
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');

    let payload: unknown;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      return setError('Invalid JSON — check for missing commas, quotes, or brackets.');
    }

    // An array → batch import: every row lands as pending; the server reports
    // which were created vs skipped (invalid / duplicate). Per-event images are
    // added later in the Enrich tab, so the single image picker is ignored here.
    if (Array.isArray(payload)) {
      if (payload.length === 0) return setError('The array is empty.');
      setBusy(true);
      try {
        const result = await api<BatchResult>('/v1/events/submissions/batch', code, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setBatchResult(result);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
      } finally {
        setBusy(false);
      }
      return;
    }

    if (typeof payload !== 'object' || payload === null) {
      return setError('JSON must be an event object, or an array of events for a batch.');
    }
    const obj = payload as Record<string, unknown>;
    const problem = validateEventPayload(obj);
    if (problem) return setError(problem);
    // Uploaded image always wins over any imageUrl the AI may have invented.
    if (imageUrl) obj.imageUrl = imageUrl;

    setBusy(true);
    try {
      const result = await api<{ id: string }>('/v1/events/submissions', code, {
        method: 'POST',
        body: JSON.stringify(obj),
      });
      setDoneId(result.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (batchResult) {
    const invalid = batchResult.skipped.filter((sk) => sk.reason === 'invalid');
    const dupes = batchResult.skipped.filter((sk) => sk.reason === 'duplicate');
    return (
      <div style={s.card}>
        <h1 style={s.h1}>Batch imported</h1>
        <p style={s.sub}>
          Created {batchResult.created.length} · skipped {invalid.length} invalid ·{' '}
          {dupes.length} duplicate. Imported events are pending — add images and fix
          details in the <strong>Enrich</strong> tab, then an admin approves them.
        </p>
        {invalid.length > 0 && (
          <>
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>
              Invalid ({invalid.length})
            </div>
            <ul style={s.notes}>
              {invalid.map((sk) => (
                <li key={sk.index}>
                  Row {sk.index}: {(sk.errors ?? []).join('; ') || 'validation failed'}
                </li>
              ))}
            </ul>
          </>
        )}
        {dupes.length > 0 && (
          <>
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600 }}>
              Duplicates ({dupes.length})
            </div>
            <ul style={s.notes}>
              {dupes.map((sk) => (
                <li key={sk.index}>
                  Row {sk.index}: already exists
                  {sk.matchedEventId ? ` (${sk.matchedEventId})` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
        <button style={s.button} type="button" onClick={reset}>
          Import another
        </button>
      </div>
    );
  }

  if (doneId) {
    return (
      <div style={s.card}>
        <h1 style={s.h1}>Event submitted</h1>
        <p style={s.sub}>
          Saved as <code>{doneId}</code>. It is pending review and will go live once an
          admin approves it.
        </p>
        <button style={s.button} type="button" onClick={reset}>
          Add another
        </button>
      </div>
    );
  }

  return (
    <form style={s.card} onSubmit={submit}>
      <h1 style={s.h1}>Add events (JSON)</h1>
      <p style={s.sub}>
        Drop a flyer image into an AI with the reference below, paste the JSON it returns
        here, upload the same image, and submit. Paste a <strong>single object</strong> for
        one event, or an <strong>array</strong> <code>[ … ]</code> to batch-import many at
        once (dupes and invalid rows are skipped and reported; per-event images get added
        later in the Enrich tab).
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          margin: '14px 0 6px',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Reference — what the AI should return
        </span>
        <button
          type="button"
          onClick={copyTemplate}
          style={{
            fontSize: 12,
            color: COLORS.muted,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre style={s.pre}>{JSON_TEMPLATE}</pre>
      <ul style={s.notes}>
        {JSON_FIELD_NOTES.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <div style={{ margin: '10px 0 4px', fontSize: 12, fontWeight: 600, color: COLORS.ink }}>
        Valid country codes ({COUNTRY_CODES.length})
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          padding: 8,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 6,
          background: '#fafafa',
          maxHeight: 140,
          overflowY: 'auto',
          fontFamily: 'ui-monospace, SF Mono, monospace',
          fontSize: 11,
        }}
      >
        {COUNTRY_CODES.map((c) => (
          <span
            key={c}
            style={{
              padding: '2px 6px',
              background: '#fff',
              border: `1px solid ${COLORS.line}`,
              borderRadius: 4,
              color: COLORS.ink,
            }}
          >
            {c}
          </span>
        ))}
      </div>

      <label style={s.label}>
        Image{' '}
        <span style={{ color: COLORS.muted, fontWeight: 400 }}>
          (jpg, png, webp, gif · up to 10 MB)
        </span>
      </label>
      <ImageUpload
        imageUrl={imageUrl}
        uploading={uploading}
        onFile={onPickFile}
        onClear={() => setImageUrl('')}
      />

      <label style={s.label} htmlFor="jsonBody">
        JSON
      </label>
      <textarea
        id="jsonBody"
        style={s.textarea}
        placeholder="paste the AI-generated JSON here…"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />

      {previewMapUrl && (
        <a
          href={previewMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            padding: '6px 12px',
            border: `1px solid ${COLORS.line}`,
            borderRadius: 6,
            background: '#fff',
            color: COLORS.ink,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
            alignSelf: 'flex-start',
          }}
        >
          Open venueMapUrl in new tab ↗
        </a>
      )}

      {error && <div style={s.errorBox}>{error}</div>}
      <button style={s.button} type="submit" disabled={busy || uploading}>
        {busy ? 'Submitting…' : isBatch ? 'Import batch' : 'Submit event'}
      </button>
    </form>
  );
}

// ── Admin review queue ──────────────────────────────────────────────────────
// One unified queue across both submission types. Events and venue submissions
// live in separate tables / endpoints, so we fetch both, tag each row with its
// type, and merge oldest-first. Approve / Reject routes to the matching
// endpoint based on the row's type.
type ReviewItem =
  | ({ itemType: 'event' } & PendingEvent)
  | ({ itemType: 'venue' } & PendingVenue);

function badgeStyle(type: 'event' | 'venue'): CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#fff',
    background: type === 'event' ? COLORS.ink : '#2f6b4f',
    borderRadius: 999,
    padding: '2px 8px',
  };
}

function ReviewQueue({ code }: { code: string }) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [events, venues] = await Promise.all([
        api<PendingEvent[]>('/v1/events/submissions/pending', code),
        api<PendingVenue[]>('/v1/venues/submissions/pending', code),
      ]);
      const merged: ReviewItem[] = [
        ...events.map((e) => ({ itemType: 'event' as const, ...e })),
        ...venues.map((v) => ({ itemType: 'venue' as const, ...v })),
      ];
      // Newest first — most recent submissions surface at the top of the queue.
      merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setItems(merged);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the queue.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (item: ReviewItem, action: 'approve' | 'reject') => {
    if (actingId) return;
    setActingId(item.id);
    setError('');
    const base =
      item.itemType === 'event' ? '/v1/events/submissions' : '/v1/venues/submissions';
    try {
      await api(`${base}/${item.id}/${action}`, code, { method: 'POST' });
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setActingId('');
    }
  };

  if (loading) {
    return (
      <div style={s.card}>
        <p style={s.sub}>Loading queue…</p>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <h1 style={s.h1}>Review queue</h1>
      <p style={s.sub}>
        {items.length === 0
          ? 'Nothing pending — all caught up.'
          : `${items.length} item${items.length === 1 ? '' : 's'} awaiting review.`}
      </p>
      {error && <div style={s.errorBox}>{error}</div>}
      {items.map((item) => (
        <div
          key={`${item.itemType}:${item.id}`}
          style={{
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
            display: 'flex',
            gap: 12,
          }}
        >
          {item.itemType === 'event' && item.imageUrl ? (
            item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                title="Open original post"
                style={{ flexShrink: 0, lineHeight: 0 }}
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{
                    width: 72,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: 6,
                    cursor: 'zoom-in',
                  }}
                />
              </a>
            ) : (
              <img
                src={item.imageUrl}
                alt=""
                style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
              />
            )
          ) : item.itemType === 'venue' && item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
            />
          ) : null}

          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={badgeStyle(item.itemType)}>
              {item.itemType === 'event' ? 'Event' : 'Venue'}
            </span>
            {item.itemType === 'event' ? (
              <>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                  {item.kind} · {new Date(item.startsAt).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  {item.venueName ?? item.venueId ?? '—'}
                  {item.venueHood ? `, ${item.venueHood}` : ''}
                  {item.submittedBy ? ` · submitted by ${item.submittedBy}` : ''}
                </div>
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.ink,
                      background: '#fff',
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: 999,
                      textDecoration: 'none',
                    }}
                  >
                    See the original post ↗
                  </a>
                )}
              </>
            ) : (
              <>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                  {item.countryCode} · {item.type}
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
                  {item.hood} · {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  {item.submittedBy ? ` · submitted by ${item.submittedBy}` : ''}
                </div>
                {(item.googleMapsUrl || item.sourceUrl) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {item.googleMapsUrl && (
                      <a
                        href={item.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, background: '#fff', border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: '5px 10px', textDecoration: 'none' }}
                      >
                        Map ↗
                      </a>
                    )}
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, background: '#fff', border: `1px solid ${COLORS.line}`, borderRadius: 999, padding: '5px 10px', textDecoration: 'none' }}
                      >
                        Source ↗
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                style={{ ...tabStyle(true), flex: 1 }}
                disabled={actingId === item.id}
                onClick={() => moderate(item, 'approve')}
              >
                Approve
              </button>
              <button
                type="button"
                style={{ ...tabStyle(false), flex: 1, color: COLORS.danger }}
                disabled={actingId === item.id}
                onClick={() => moderate(item, 'reject')}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Admin notifications outbox ───────────────────────────────────────────────
// "New spot near you" pushes don't send on approval — they queue here and go
// out together at 11am ET as one digest per person. Admins can see what's
// waiting (and roughly how many people each reaches) and cancel before it sends.
interface OutboxEntry {
  id: string;
  venueName: string;
  status: string;
  reach: number | null;
  createdAt: string;
  sentAt: string | null;
}
interface OutboxView {
  pending: OutboxEntry[];
  sent: OutboxEntry[];
}

function NotificationsOutbox({ code }: { code: string }) {
  const [view, setView] = useState<OutboxView>({ pending: [], sent: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setView(await api<OutboxView>('/v1/notifications/outbox', code));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the outbox.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async (id: string) => {
    if (actingId) return;
    setActingId(id);
    setError('');
    try {
      await api(`/v1/notifications/outbox/${id}/cancel`, code, { method: 'POST' });
      setView((prev) => ({ ...prev, pending: prev.pending.filter((e) => e.id !== id) }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cancel failed.');
    } finally {
      setActingId('');
    }
  };

  if (loading) {
    return (
      <div style={s.card}>
        <p style={s.sub}>Loading outbox…</p>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <h1 style={s.h1}>Notifications outbox</h1>
      <p style={s.sub}>
        “New spot near you” pushes queue here and go out together at 11am ET as one digest
        per person — so approving at odd hours never buzzes anyone at 2am. Cancel anything you
        don’t want sent.
      </p>
      {error && <div style={s.errorBox}>{error}</div>}

      <h2 style={{ ...s.h1, fontSize: 16, marginTop: 18 }}>
        Queued for next 11am ({view.pending.length})
      </h2>
      {view.pending.length === 0 ? (
        <p style={s.sub}>Nothing queued.</p>
      ) : (
        view.pending.map((e) => (
          <div
            key={e.id}
            style={{
              border: `1px solid ${COLORS.line}`,
              borderRadius: 8,
              padding: 12,
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{e.venueName}</div>
              <div style={s.sub}>
                {e.reach === null
                  ? '—'
                  : `Reaches ~${e.reach} ${e.reach === 1 ? 'person' : 'people'} nearby`}
              </div>
            </div>
            <button
              type="button"
              style={{ ...tabStyle(false), color: COLORS.danger }}
              disabled={actingId === e.id}
              onClick={() => cancel(e.id)}
            >
              Cancel
            </button>
          </div>
        ))
      )}

      <h2 style={{ ...s.h1, fontSize: 16, marginTop: 22 }}>Recently sent</h2>
      {view.sent.length === 0 ? (
        <p style={s.sub}>Nothing sent yet.</p>
      ) : (
        view.sent.map((e) => (
          <div
            key={e.id}
            style={{
              borderBottom: `1px solid ${COLORS.line}`,
              padding: '8px 0',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{e.venueName}</span>
            <span style={s.sub}>
              {e.sentAt ? new Date(e.sentAt).toLocaleDateString() : ''}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ── Add-venue form ──────────────────────────────────────────────────────────
function AddVenueForm({ code }: { code: string }) {
  const [countryCode, setCountryCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [hood, setHood] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [socialsUrl, setSocialsUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState('');

  useEffect(() => {
    api<Country[]>('/v1/countries', code)
      .then(setCountries)
      .catch(() => setError('Could not load the country list.'));
  }, [code]);

  const reset = () => {
    setName('');
    setType('');
    setHood('');
    setLat('');
    setLng('');
    setGoogleMapsUrl('');
    setSourceUrl('');
    setSocialsUrl('');
    setImageUrl('');
    setDoneId('');
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Only image files (jpg, png, webp, gif).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const presigned = await api<UploadUrlResponse>(
        '/v1/venues/submissions/upload-url',
        code,
        { method: 'POST', body: JSON.stringify({ contentType: file.type }) },
      );
      const putResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResp.ok) {
        throw new Error(`S3 upload failed (${putResp.status}).`);
      }
      setImageUrl(presigned.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');

    if (!countryCode) return setError('Pick a country.');
    if (!name.trim()) return setError('Give the venue a name.');
    if (!type.trim()) return setError('Add a type (e.g. Brazilian Steakhouse).');
    if (!hood.trim()) return setError('Add a neighborhood.');
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!lat.trim() || Number.isNaN(latNum)) return setError('Enter a numeric latitude.');
    if (!lng.trim() || Number.isNaN(lngNum)) return setError('Enter a numeric longitude.');
    if (!coordsLookSane(latNum, lngNum)) {
      return setError('Coordinates look off for NY/NJ — check lat/lng aren’t swapped (lat ~40.x, lng ~-74.x).');
    }

    const payload: Record<string, unknown> = {
      countryCode,
      name: name.trim(),
      type: type.trim(),
      hood: hood.trim(),
      lat: latNum,
      lng: lngNum,
    };
    if (googleMapsUrl.trim()) payload.googleMapsUrl = googleMapsUrl.trim();
    if (sourceUrl.trim()) payload.sourceUrl = sourceUrl.trim();
    if (socialsUrl.trim()) payload.socialsUrl = socialsUrl.trim();
    if (imageUrl) payload.imageUrl = imageUrl;

    setBusy(true);
    try {
      const result = await api<{ id: string }>('/v1/venues/submissions', code, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setDoneId(result.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (doneId) {
    return (
      <div style={s.card}>
        <h1 style={s.h1}>Venue submitted</h1>
        <p style={s.sub}>
          Saved as <code>{doneId}</code>. It is pending review and is added to the app once
          an admin approves it.
        </p>
        <button style={s.button} type="button" onClick={reset}>
          Add another
        </button>
      </div>
    );
  }

  return (
    <form style={s.card} onSubmit={submit}>
      <h1 style={s.h1}>Add a venue</h1>
      <p style={s.sub}>It will be reviewed before being added to the app.</p>

      <label style={s.label} htmlFor="vCountry">
        Country
      </label>
      <select
        id="vCountry"
        style={s.input}
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
      >
        <option value="">— pick a country —</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flagEmoji} {c.name}
          </option>
        ))}
      </select>

      <label style={s.label} htmlFor="vName">
        Name
      </label>
      <input
        id="vName"
        style={s.input}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Boteco da Esquina"
      />

      <label style={s.label} htmlFor="vType">
        Type <span style={{ color: COLORS.muted, fontWeight: 400 }}>(cuisine / venue descriptor)</span>
      </label>
      <input
        id="vType"
        style={s.input}
        value={type}
        onChange={(e) => setType(e.target.value)}
        placeholder="e.g. Brazilian Steakhouse · Rodizio"
      />

      <label style={s.label} htmlFor="vHood">
        Neighborhood
      </label>
      <input
        id="vHood"
        style={s.input}
        value={hood}
        onChange={(e) => setHood(e.target.value)}
        placeholder="e.g. Ironbound, Newark"
      />

      <label style={s.label}>
        Coordinates{' '}
        <span style={{ color: COLORS.muted, fontWeight: 400 }}>
          (right-click the spot in Google Maps → click the “lat, lng” to copy)
        </span>
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          aria-label="latitude"
          style={s.input}
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="lat (e.g. 40.7320)"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <input
          aria-label="longitude"
          style={s.input}
          type="number"
          step="any"
          inputMode="decimal"
          placeholder="lng (e.g. -74.1620)"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
        />
      </div>

      <label style={s.label} htmlFor="vMapUrl">
        Google Maps URL <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span>
      </label>
      <input
        id="vMapUrl"
        style={s.input}
        type="url"
        placeholder="https://maps.google.com/?q=…"
        value={googleMapsUrl}
        onChange={(e) => setGoogleMapsUrl(e.target.value)}
      />

      <label style={s.label}>
        Photo <span style={{ color: COLORS.muted, fontWeight: 400 }}>(jpg, png, webp, gif · up to 10 MB · optional)</span>
      </label>
      <ImageUpload
        imageUrl={imageUrl}
        uploading={uploading}
        onFile={onPickFile}
        onClear={() => setImageUrl('')}
      />

      <label style={s.label} htmlFor="vSourceUrl">
        Source URL <span style={{ color: COLORS.muted, fontWeight: 400 }}>(listing / Instagram, optional)</span>
      </label>
      <input
        id="vSourceUrl"
        style={s.input}
        type="url"
        placeholder="https://www.instagram.com/p/…"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
      />

      <label style={s.label} htmlFor="vSocialsUrl">
        Socials URL <span style={{ color: COLORS.muted, fontWeight: 400 }}>(venue’s Instagram / Facebook, optional)</span>
      </label>
      <input
        id="vSocialsUrl"
        style={s.input}
        type="url"
        placeholder="https://www.instagram.com/thevenue/"
        value={socialsUrl}
        onChange={(e) => setSocialsUrl(e.target.value)}
      />

      {error && <div style={s.errorBox}>{error}</div>}
      <button style={s.button} type="submit" disabled={busy || uploading}>
        {busy ? 'Submitting…' : 'Submit venue'}
      </button>
    </form>
  );
}

// ── Venue JSON entry (paste an AI-generated payload) ────────────────────────
function JsonVenueForm({ code }: { code: string }) {
  const [jsonText, setJsonText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState('');
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setJsonText('');
    setImageUrl('');
    setDoneId('');
    setError('');
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Only image files (jpg, png, webp, gif).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const presigned = await api<UploadUrlResponse>(
        '/v1/venues/submissions/upload-url',
        code,
        { method: 'POST', body: JSON.stringify({ contentType: file.type }) },
      );
      const putResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResp.ok) {
        throw new Error(`S3 upload failed (${putResp.status}).`);
      }
      setImageUrl(presigned.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(VENUE_JSON_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable in some contexts */
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      return setError('Invalid JSON — check for missing commas, quotes, or brackets.');
    }
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return setError('JSON must be an object.');
    }
    const problem = validateVenuePayload(payload);
    if (problem) return setError(problem);
    if (imageUrl) payload.imageUrl = imageUrl;

    setBusy(true);
    try {
      const result = await api<{ id: string }>('/v1/venues/submissions', code, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setDoneId(result.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  if (doneId) {
    return (
      <div style={s.card}>
        <h1 style={s.h1}>Venue submitted</h1>
        <p style={s.sub}>
          Saved as <code>{doneId}</code>. It is pending review and is added to the app once
          an admin approves it.
        </p>
        <button style={s.button} type="button" onClick={reset}>
          Add another
        </button>
      </div>
    );
  }

  return (
    <form style={s.card} onSubmit={submit}>
      <h1 style={s.h1}>Add a venue (JSON)</h1>
      <p style={s.sub}>
        Ask an AI to research a venue using the reference below, paste the JSON it returns
        here, optionally upload a photo, and submit.
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          margin: '14px 0 6px',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>Reference — what the AI should return</span>
        <button
          type="button"
          onClick={copyTemplate}
          style={{ fontSize: 12, color: COLORS.muted, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre style={s.pre}>{VENUE_JSON_TEMPLATE}</pre>
      <ul style={s.notes}>
        {VENUE_JSON_FIELD_NOTES.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <div style={{ margin: '10px 0 4px', fontSize: 12, fontWeight: 600, color: COLORS.ink }}>
        Valid country codes ({COUNTRY_CODES.length})
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          padding: 8,
          border: `1px solid ${COLORS.line}`,
          borderRadius: 6,
          background: '#fafafa',
          maxHeight: 140,
          overflowY: 'auto',
          fontFamily: 'ui-monospace, SF Mono, monospace',
          fontSize: 11,
        }}
      >
        {COUNTRY_CODES.map((c) => (
          <span
            key={c}
            style={{ padding: '2px 6px', background: '#fff', border: `1px solid ${COLORS.line}`, borderRadius: 4, color: COLORS.ink }}
          >
            {c}
          </span>
        ))}
      </div>

      <label style={s.label}>
        Photo{' '}
        <span style={{ color: COLORS.muted, fontWeight: 400 }}>(jpg, png, webp, gif · up to 10 MB · optional)</span>
      </label>
      <ImageUpload
        imageUrl={imageUrl}
        uploading={uploading}
        onFile={onPickFile}
        onClear={() => setImageUrl('')}
      />

      <label style={s.label} htmlFor="vJsonBody">
        JSON
      </label>
      <textarea
        id="vJsonBody"
        style={s.textarea}
        placeholder="paste the AI-generated venue JSON here…"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
      />

      {error && <div style={s.errorBox}>{error}</div>}
      <button style={s.button} type="submit" disabled={busy || uploading}>
        {busy ? 'Submitting…' : 'Submit venue'}
      </button>
    </form>
  );
}

// ── Enrich queue (pending events) ───────────────────────────────────────────
// Open to any code-holder. Pulls every pending (unreviewed) event, image-missing
// first, and lets you edit fields, link a known venue, and add an image — all of
// which keep the event pending. An admin still approves it in the Review queue.
function EnrichQueue({ code }: { code: string }) {
  // Two buckets: events still awaiting review (any image state), and events
  // already live in the public feed that are only missing a photo.
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [approved, setApproved] = useState<PendingEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const pendingList = await api<PendingEvent[]>('/v1/events/submissions/pending', code);
      // Image-missing first; stable sort keeps the server's oldest-first order
      // within each group.
      pendingList.sort((a, b) => (a.imageUrl ? 1 : 0) - (b.imageUrl ? 1 : 0));
      setPending(pendingList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the queue.');
    }
    // The approved-no-image bucket is a newer, independent endpoint; if a backend
    // predates it (404/405) just hide the section rather than break the page.
    try {
      setApproved(
        await api<PendingEvent[]>('/v1/events/submissions/approved-missing-image', code),
      );
    } catch {
      setApproved([]);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPendingUpdated = (updated: PendingEvent) => {
    setPending((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      next.sort((a, b) => (a.imageUrl ? 1 : 0) - (b.imageUrl ? 1 : 0));
      return next;
    });
  };

  const onApprovedUpdated = (updated: PendingEvent) => {
    setApproved((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  if (loading) {
    return (
      <div style={s.card}>
        <p style={s.sub}>Loading queue…</p>
      </div>
    );
  }

  return (
    <div style={s.card}>
      <h1 style={s.h1}>Enrich</h1>

      <h2 style={s.h2}>Pending review</h2>
      <p style={s.sub}>
        {pending.length === 0
          ? 'No pending events to enrich — all caught up.'
          : `${pending.length} pending event${pending.length === 1 ? '' : 's'}. Add images, fix details, or link a known venue. Each still needs admin approval in the Review queue.`}
      </p>
      {error && <div style={s.errorBox}>{error}</div>}
      {pending.map((ev) => (
        <EnrichCard key={ev.id} code={code} event={ev} status="pending" onUpdated={onPendingUpdated} />
      ))}

      <h2 style={{ ...s.h2, marginTop: 28 }}>Approved · live · no image</h2>
      <p style={s.sub}>
        {approved.length === 0
          ? 'Every live event has a photo — nothing to enrich here.'
          : `${approved.length} approved event${approved.length === 1 ? '' : 's'} already public but missing a photo. Adding an image goes live immediately; status is unchanged.`}
      </p>
      {approved.map((ev) => (
        <EnrichCard key={ev.id} code={code} event={ev} status="approved" onUpdated={onApprovedUpdated} />
      ))}
    </div>
  );
}

// Pill marking whether the event is still awaiting review or already live, so
// the status is readable on the card itself — not just from the section it sits
// under.
function statusPillStyle(status: 'pending' | 'approved'): CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#fff',
    background: status === 'approved' ? '#2f6b4f' : '#9a6700',
    borderRadius: 999,
    padding: '2px 8px',
  };
}

function EnrichCard({
  code,
  event,
  status,
  onUpdated,
}: {
  code: string;
  event: PendingEvent;
  status: 'pending' | 'approved';
  onUpdated: (e: PendingEvent) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [kind, setKind] = useState(event.kind);
  const [startsAt, setStartsAt] = useState(toLocalInput(event.startsAt));
  const [endsAt, setEndsAt] = useState(event.endsAt ? toLocalInput(event.endsAt) : '');
  const [countryCode, setCountryCode] = useState(event.countryCode ?? '');
  const [venueId, setVenueId] = useState(event.venueId ?? '');
  const [venueName, setVenueName] = useState(event.venueName ?? '');
  const [venueHood, setVenueHood] = useState(event.venueHood ?? '');
  const [venueMapUrl, setVenueMapUrl] = useState(event.venueMapUrl ?? '');
  const [sourceUrl, setSourceUrl] = useState(event.sourceUrl ?? '');
  const [isFree, setIsFree] = useState(event.isFree);
  const [imageUrl, setImageUrl] = useState(event.imageUrl ?? '');

  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<Venue[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const searchVenues = async (q: string) => {
    setVenueQuery(q);
    if (q.trim().length < 2) {
      setVenueResults([]);
      return;
    }
    try {
      setVenueResults(
        await api<Venue[]>(`/v1/venues?q=${encodeURIComponent(q.trim())}`, code),
      );
    } catch {
      setVenueResults([]);
    }
  };

  const linkVenue = (v: Venue) => {
    setVenueId(v.id);
    setVenueName(v.name);
    setVenueHood(v.hood);
    setVenueQuery('');
    setVenueResults([]);
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('Only image files (jpg, png, webp, gif).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const presigned = await api<UploadUrlResponse>(
        '/v1/events/submissions/upload-url',
        code,
        { method: 'POST', body: JSON.stringify({ contentType: file.type }) },
      );
      const putResp = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResp.ok) throw new Error(`S3 upload failed (${putResp.status}).`);
      setImageUrl(presigned.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (saving) return;
    if (!startsAt) {
      setError('A start date/time is required.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const body = {
        title: title.trim(),
        kind,
        startsAt: toIso(startsAt),
        endsAt: endsAt ? toIso(endsAt) : null,
        countryCode: countryCode.trim() ? countryCode.trim().toUpperCase() : null,
        venueId: venueId || null,
        venueName: venueName.trim() || null,
        venueHood: venueHood.trim() || null,
        venueMapUrl: venueMapUrl.trim() || null,
        sourceUrl: sourceUrl.trim() || null,
        imageUrl: imageUrl.trim() || null,
        isFree,
      };
      const updated = await api<PendingEvent>(
        `/v1/events/submissions/${event.id}`,
        code,
        { method: 'PATCH', body: JSON.stringify(body) },
      );
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle: CSSProperties = { ...s.input, marginTop: 4 };

  return (
    <div
      style={{
        border: `1px solid ${COLORS.line}`,
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Image slot */}
        <div style={{ flexShrink: 0, width: 96 }}>
          <ImageUpload
            compact
            imageUrl={imageUrl}
            uploading={uploading}
            onFile={onPickFile}
            onClear={() => setImageUrl('')}
          />
        </div>

        {/* Fields */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={statusPillStyle(status)}>
              {status === 'approved' ? 'Approved · live' : 'Pending review'}
            </span>
            <span style={{ fontSize: 11, color: COLORS.muted }}>
              {event.submittedBy ? `submitted by ${event.submittedBy}` : 'imported'}
              {!event.imageUrl && ' · needs image'}
            </span>
          </div>

          <input
            style={fieldStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <select
              style={{ ...fieldStyle, flex: 1 }}
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <input
              style={{ ...fieldStyle, width: 70 }}
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              placeholder="CC"
              maxLength={3}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ flex: 1, fontSize: 11, color: COLORS.muted }}>
              Starts
              <input
                style={fieldStyle}
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </label>
            <label style={{ flex: 1, fontSize: 11, color: COLORS.muted }}>
              Ends (optional)
              <input
                style={fieldStyle}
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </label>
          </div>

          {/* Venue: free-text + link a known venue */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...fieldStyle, flex: 1 }}
              value={venueName}
              onChange={(e) => {
                setVenueName(e.target.value);
                setVenueId(''); // editing the name detaches any linked venue
              }}
              placeholder="Venue name"
            />
            <input
              style={{ ...fieldStyle, flex: 1 }}
              value={venueHood}
              onChange={(e) => setVenueHood(e.target.value)}
              placeholder="Neighborhood"
            />
          </div>
          {venueId ? (
            <div style={{ fontSize: 11, color: COLORS.ink, marginTop: 4 }}>
              ✓ Linked to known venue{' '}
              <button
                type="button"
                onClick={() => setVenueId('')}
                style={{
                  fontSize: 11,
                  color: COLORS.danger,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                unlink
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...fieldStyle, fontSize: 12 }}
                value={venueQuery}
                onChange={(e) => void searchVenues(e.target.value)}
                placeholder="🔎 link a known venue by name…"
              />
              {venueResults.length > 0 && (
                <div
                  style={{
                    border: `1px solid ${COLORS.line}`,
                    borderRadius: 6,
                    marginTop: 2,
                    background: '#fff',
                    maxHeight: 160,
                    overflowY: 'auto',
                  }}
                >
                  {venueResults.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => linkVenue(v)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 10px',
                        background: 'none',
                        border: 'none',
                        borderBottom: `1px solid ${COLORS.line}`,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {v.name}
                      {v.hood ? <span style={{ color: COLORS.muted }}> · {v.hood}</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <input
            style={fieldStyle}
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Source URL (research link)"
          />
          <input
            style={fieldStyle}
            value={venueMapUrl}
            onChange={(e) => setVenueMapUrl(e.target.value)}
            placeholder="Venue map URL"
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              marginTop: 8,
            }}
          >
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
            Free event
          </label>

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.ink,
              }}
            >
              Open source to research ↗
            </a>
          )}

          {error && <div style={s.errorBox}>{error}</div>}
          <button
            type="button"
            style={{ ...s.button, marginTop: 10 }}
            disabled={saving || uploading}
            onClick={() => void save()}
          >
            {saving
              ? 'Saving…'
              : saved
                ? 'Saved ✓'
                : status === 'approved'
                  ? 'Save (stays live)'
                  : 'Save (stays pending)'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page shell ──────────────────────────────────────────────────────────────
export function SubmitPage() {
  const [code, setCode] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<'event' | 'venue'>('event');
  const [tab, setTab] = useState<'form' | 'json' | 'review' | 'enrich' | 'notifications'>(
    'form',
  );

  // Top-level sections are Submit / Enrich / Review queue — three peer
  // workflows. Enrich (events-only) and the Review queue (both types) are
  // global, so they own the page on their own. Submit is the only section that
  // branches further: pick Event vs Venue, then Form vs JSON. Those sub-tabs
  // only render under Submit, so the Event/Venue choice never appears to
  // "own" the global queues.
  const section: 'submit' | 'enrich' | 'review' | 'notifications' =
    tab === 'enrich'
      ? 'enrich'
      : tab === 'review'
        ? 'review'
        : tab === 'notifications'
          ? 'notifications'
          : 'submit';

  const switchMode = (next: 'event' | 'venue') => {
    setMode(next);
    setTab('form');
  };

  if (!API_BASE) {
    return (
      <div style={s.page}>
        <div style={s.shell}>
          <div style={s.card}>
            <h1 style={s.h1}>Not configured</h1>
            <p style={s.sub}>VITE_API_BASE_URL is unset, so this tool can’t reach the API.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={s.page}>
        <Gate
          onUnlock={(c, ses) => {
            setCode(c);
            setSession(ses);
          }}
        />
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <p style={{ ...s.sub, textAlign: 'right' }}>
          Signed in as <strong>{session.label}</strong> ({session.role})
        </p>
        {/* Top-level sections — peers. */}
        <div style={s.tabRow}>
          <button type="button" style={tabStyle(section === 'submit')} onClick={() => setTab('form')}>
            Submit
          </button>
          {/* Enrich is events-only but open to every role. */}
          <button type="button" style={tabStyle(section === 'enrich')} onClick={() => setTab('enrich')}>
            Enrich
          </button>
          {session.role === 'admin' && (
            <button
              type="button"
              style={tabStyle(section === 'review')}
              onClick={() => setTab('review')}
            >
              Review queue
            </button>
          )}
          {session.role === 'admin' && (
            <button
              type="button"
              style={tabStyle(section === 'notifications')}
              onClick={() => setTab('notifications')}
            >
              Notifications
            </button>
          )}
        </div>
        {/* Sub-tabs belong to Submit only. */}
        {section === 'submit' && (
          <>
            <div style={s.tabRow}>
              <button type="button" style={tabStyle(mode === 'event')} onClick={() => switchMode('event')}>
                Event
              </button>
              <button type="button" style={tabStyle(mode === 'venue')} onClick={() => switchMode('venue')}>
                Venue
              </button>
            </div>
            <div style={s.tabRow}>
              <button type="button" style={tabStyle(tab === 'form')} onClick={() => setTab('form')}>
                Form
              </button>
              <button type="button" style={tabStyle(tab === 'json')} onClick={() => setTab('json')}>
                JSON
              </button>
            </div>
          </>
        )}
        {tab === 'enrich' ? (
          <EnrichQueue code={code} />
        ) : tab === 'review' && session.role === 'admin' ? (
          <ReviewQueue code={code} />
        ) : tab === 'notifications' && session.role === 'admin' ? (
          <NotificationsOutbox code={code} />
        ) : mode === 'venue' ? (
          tab === 'json' ? <JsonVenueForm code={code} /> : <AddVenueForm code={code} />
        ) : tab === 'json' ? (
          <JsonEventForm code={code} />
        ) : (
          <AddEventForm code={code} />
        )}
      </div>
    </div>
  );
}
