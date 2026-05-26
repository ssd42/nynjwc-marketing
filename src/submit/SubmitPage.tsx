/**
 * Gated event-entry tool — the unadvertised /submit.html.
 *
 * Two steps: a code gate, then a tabbed workspace. Anyone with a valid code
 * can add events; an `admin`-role code also unlocks the review queue. The
 * code is held in React state only (never localStorage) and sent on every
 * request as the `X-Event-Code` header.
 *
 * Submitted events land server-side as status='pending' and stay out of the
 * public feed until approved here — see nynjwc-backend/app/api/event_submissions.py.
 */

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';

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
  imageUrl: string | null;
  sourceUrl: string | null;
  isFree: boolean;
  submittedBy: string | null;
  createdAt: string;
};

type UploadUrlResponse = { uploadUrl: string; publicUrl: string; key: string };

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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
};

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
      const session = await api<Session>('/v1/events/submissions/verify', code.trim(), {
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
        <h1 style={s.h1}>Event entry</h1>
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

      <label style={s.label} htmlFor="image">
        Image <span style={{ color: COLORS.muted, fontWeight: 400 }}>(jpg, png, webp, gif · up to 10 MB)</span>
      </label>
      {imageUrl ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 4 }}>
          <img
            src={imageUrl}
            alt="uploaded preview"
            style={{
              width: 96,
              maxHeight: 160,
              objectFit: 'cover',
              borderRadius: 8,
              border: `1px solid ${COLORS.line}`,
            }}
          />
          <button
            type="button"
            onClick={() => setImageUrl('')}
            style={{
              fontSize: 12,
              color: COLORS.danger,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <input
          id="image"
          style={s.input}
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
        />
      )}
      {uploading && <p style={{ fontSize: 12, color: COLORS.muted, marginTop: 6 }}>Uploading…</p>}

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

// ── Admin review queue ──────────────────────────────────────────────────────
function ReviewQueue({ code }: { code: string }) {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEvents(await api<PendingEvent[]>('/v1/events/submissions/pending', code));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the queue.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (id: string, action: 'approve' | 'reject') => {
    if (actingId) return;
    setActingId(id);
    setError('');
    try {
      await api(`/v1/events/submissions/${id}/${action}`, code, { method: 'POST' });
      setEvents((prev) => prev.filter((e) => e.id !== id));
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
        {events.length === 0
          ? 'Nothing pending — all caught up.'
          : `${events.length} event${events.length === 1 ? '' : 's'} awaiting review.`}
      </p>
      {error && <div style={s.errorBox}>{error}</div>}
      {events.map((ev) => (
        <div
          key={ev.id}
          style={{
            border: `1px solid ${COLORS.line}`,
            borderRadius: 8,
            padding: 12,
            marginTop: 10,
            display: 'flex',
            gap: 12,
          }}
        >
          {ev.imageUrl && (
            ev.sourceUrl ? (
              <a
                href={ev.sourceUrl}
                target="_blank"
                rel="noreferrer"
                title="Open original post"
                style={{ flexShrink: 0, lineHeight: 0 }}
              >
                <img
                  src={ev.imageUrl}
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
                src={ev.imageUrl}
                alt=""
                style={{
                  width: 72,
                  height: 96,
                  objectFit: 'cover',
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              />
            )
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{ev.title}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
              {ev.kind} · {new Date(ev.startsAt).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>
              {ev.venueName ?? ev.venueId ?? '—'}
              {ev.venueHood ? `, ${ev.venueHood}` : ''}
              {ev.submittedBy ? ` · submitted by ${ev.submittedBy}` : ''}
            </div>
            {ev.sourceUrl && (
              <a
                href={ev.sourceUrl}
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
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                style={{ ...tabStyle(true), flex: 1 }}
                disabled={actingId === ev.id}
                onClick={() => moderate(ev.id, 'approve')}
              >
                Approve
              </button>
              <button
                type="button"
                style={{ ...tabStyle(false), flex: 1, color: COLORS.danger }}
                disabled={actingId === ev.id}
                onClick={() => moderate(ev.id, 'reject')}
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

// ── Page shell ──────────────────────────────────────────────────────────────
export function SubmitPage() {
  const [code, setCode] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<'add' | 'review'>('add');

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
        {session.role === 'admin' && (
          <div style={s.tabRow}>
            <button type="button" style={tabStyle(tab === 'add')} onClick={() => setTab('add')}>
              Add event
            </button>
            <button
              type="button"
              style={tabStyle(tab === 'review')}
              onClick={() => setTab('review')}
            >
              Review queue
            </button>
          </div>
        )}
        {tab === 'review' && session.role === 'admin' ? (
          <ReviewQueue code={code} />
        ) : (
          <AddEventForm code={code} />
        )}
      </div>
    </div>
  );
}
