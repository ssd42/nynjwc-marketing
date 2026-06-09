// Post-build static-site generator for /guides/* (see docs/spikes/ai-agent-discovery.md).
//
// Renders each guide in guides.data.mjs to a self-contained, JS-free static HTML doc
// (own <head>: title/meta/canonical/OG + JSON-LD FAQPage/BreadcrumbList/ItemList; inline
// CSS so there are no asset-path issues at nested URLs and the page is fully readable with
// zero JS) under dist/guides/<slug>/index.html, then writes the /guides/ hub and
// regenerates dist/sitemap.xml. Design: editorial — per-country colored hero, Instrument
// Serif headings, polished venue cards, native <details> FAQ. Interactivity (map, RSVP)
// lives in the app, linked from each page. A small PostHog snippet captures referrals.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE,
  COUNTRY_META,
  GUIDES,
  HUB,
  VERIFY_NOTE,
  HOOD_ACCENT,
  HUB_ACCENT,
} from './guides.data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const VENUES = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/venues.json'), 'utf8'));

const TODAY = new Date().toISOString().slice(0, 10);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const prettyDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const mapsHref = (v) =>
  v.google_maps_url ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${v.name}, ${v.hood || ''}`)}`;

// --- country catalog (flag + name for every code in the data) ----------------
// COUNTRY_META carries accents for the 6 featured countries; this covers the rest
// so neighborhood guides never show a bare FIFA code (e.g. ECU/URU). FIFA → [name, ISO2].
const FIFA = {
  ARG: ['Argentina', 'AR'], BRA: ['Brazil', 'BR'], COL: ['Colombia', 'CO'], CRO: ['Croatia', 'HR'],
  ECU: ['Ecuador', 'EC'], EGY: ['Egypt', 'EG'], ESP: ['Spain', 'ES'], FRA: ['France', 'FR'],
  GER: ['Germany', 'DE'], GHA: ['Ghana', 'GH'], HAI: ['Haiti', 'HT'], JOR: ['Jordan', 'JO'],
  JPN: ['Japan', 'JP'], KOR: ['South Korea', 'KR'], MAR: ['Morocco', 'MA'], MEX: ['Mexico', 'MX'],
  NED: ['Netherlands', 'NL'], PAN: ['Panama', 'PA'], PAR: ['Paraguay', 'PY'], PER: ['Peru', 'PE'],
  POL: ['Poland', 'PL'], POR: ['Portugal', 'PT'], RSA: ['South Africa', 'ZA'], SEN: ['Senegal', 'SN'],
  URU: ['Uruguay', 'UY'], USA: ['United States', 'US'],
};
const flagOf = (iso) =>
  iso ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : '⚽';
const countryName = (code) => (FIFA[code] ? FIFA[code][0] : code);
const countryFlag = (code) => (FIFA[code] ? flagOf(FIFA[code][1]) : '⚽');
const countryLabel = (code) => `${countryFlag(code)} ${countryName(code)}`;

// --- hood canonicalization (one label per neighborhood) ----------------------
// Data carries the same neighborhood in several forms ("Ironbound" vs "Ironbound,
// Newark"). Pick one canonical label per neighborhood — preferring the city-qualified
// form, then the most frequent — so cards and the "Most concentrated in" rollup are
// consistent and don't list the same place twice.
const HOOD_CANON = (() => {
  const groups = {};
  for (const v of VENUES) {
    const h = (v.hood || '').trim();
    if (!h) continue;
    (groups[h.split(',')[0].trim().toLowerCase()] ||= []).push(h);
  }
  const map = {};
  for (const [head, list] of Object.entries(groups)) {
    const counts = {};
    for (const h of list) counts[h] = (counts[h] || 0) + 1;
    map[head] = Object.keys(counts).sort((a, b) => {
      const ca = a.includes(','), cb = b.includes(',');
      if (ca !== cb) return ca ? -1 : 1; // city-qualified first
      if (counts[b] !== counts[a]) return counts[b] - counts[a]; // then most frequent
      return b.length - a.length;
    })[0];
  }
  return map;
})();
const canonHood = (raw) => HOOD_CANON[(raw || '').split(',')[0].trim().toLowerCase()] || raw || 'NY/NJ';

// --- dedupe (same venue listed twice, e.g. "Barriles & Sports Bar" vs "...Sports Bar")
const normName = (n) =>
  n.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/\b(and|the)\b/g, ' ').replace(/\s+/g, ' ').trim();
const dedupe = (arr) => {
  const seen = new Set();
  return arr.filter((v) => {
    const k = `${v.country_code}|${normName(v.name)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// --- venue selection ---------------------------------------------------------
const venuesForCountry = (code) =>
  dedupe(VENUES.filter((v) => v.country_code === code).sort((a, b) => a.name.localeCompare(b.name)));
const venuesForHood = (terms) => {
  const t = terms.map((x) => x.toLowerCase());
  return dedupe(
    VENUES.filter((v) => t.some((term) => (v.hood || '').toLowerCase().includes(term))).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  );
};
const topHoods = (venues, n = 4) =>
  Object.entries(
    venues.reduce((acc, v) => {
      const h = canonHood(v.hood);
      acc[h] = (acc[h] || 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([h]) => h);

// --- analytics (PostHog — same project/host as the app) ----------------------
const PH_KEY = 'phc_CQ9UJEmmzhe586scbjKrxUtRD3yy8obAhiYdtwZZtkFA';
const PH_HOST = 'https://us.i.posthog.com';
const analytics = (props) => {
  const reg = JSON.stringify({ section: 'guides', ...props });
  return `<script>
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${PH_KEY}',{api_host:'${PH_HOST}',defaults:'2025-05-24',person_profiles:'identified_only'});
posthog.register(${reg});
</script>`;
};

// --- styling -----------------------------------------------------------------
const CSS = `
:root{--accent:#1a1612;--bg:#f5f3ee;--ink:#1a1612;--muted:#6f6a60;--soft:#8a857b;--line:#e6e1d8;--card:#fff}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);
  font:17px/1.65 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
a{color:inherit}
.serif{font-family:"Instrument Serif",Georgia,"Times New Roman",serif;font-weight:400}
header.site{position:sticky;top:0;z-index:5;background:rgba(245,243,238,.85);
  backdrop-filter:saturate(1.3) blur(8px);border-bottom:1px solid var(--line);
  display:flex;align-items:center;justify-content:space-between;padding:12px 20px}
header.site .brand{font-weight:800;letter-spacing:-.02em;text-decoration:none;font-size:16px}
header.site nav a{font-weight:600;font-size:14px;color:var(--muted);margin-left:18px;text-decoration:none}
header.site nav a:hover{color:var(--ink)}
.hero{border-bottom:1px solid var(--line);
  background:radial-gradient(130% 120% at 0% 0%, color-mix(in srgb,var(--accent) 16%,transparent), transparent 58%), linear-gradient(180deg,#fff,var(--bg))}
.hero-in,.wrap,.f-in{max-width:760px;margin:0 auto;padding-left:20px;padding-right:20px}
.hero-in{padding-top:38px;padding-bottom:34px}
.eyebrow{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,#fff);
  border:1px solid color-mix(in srgb,var(--accent) 28%,#fff);border-radius:999px;padding:5px 12px}
.flag{font-size:54px;line-height:1;margin:16px 0 2px}
h1.title{font-size:clamp(34px,6vw,52px);line-height:1.04;letter-spacing:-.01em;margin:6px 0 0}
.lead{font-size:19px;color:#34302a;margin:14px 0 0;max-width:62ch}
.cta{display:inline-flex;align-items:center;gap:8px;margin-top:22px;padding:13px 22px;background:var(--ink);
  color:var(--bg);border-radius:999px;font-weight:700;text-decoration:none;
  box-shadow:0 6px 18px rgba(26,22,18,.18);transition:transform .12s ease}
.cta:hover{transform:translateY(-1px)}
.updated{font-size:13px;color:var(--soft);margin-top:16px}
.wrap{padding-top:8px;padding-bottom:64px}
.lede{margin:6px 0 4px}
.lede p{font-size:18.5px;line-height:1.62;color:#34302a;margin:0 0 14px;max-width:62ch}
h2{font-size:25px;letter-spacing:-.01em;margin:42px 0 4px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
h2 .count{font:700 13px/1 ui-sans-serif;color:var(--accent);
  background:color-mix(in srgb,var(--accent) 11%,#fff);border-radius:999px;padding:5px 9px}
p.sub{color:var(--muted);font-size:14px;margin:2px 0 0}
ul.venues{list-style:none;padding:0;margin:14px 0;display:grid;gap:10px}
ul.venues li{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;
  display:flex;justify-content:space-between;align-items:center;gap:14px;
  transition:border-color .12s,box-shadow .12s,transform .12s}
ul.venues li:hover{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));
  box-shadow:0 8px 22px rgba(26,22,18,.07);transform:translateY(-1px)}
.v-name{font-weight:700;font-size:16px}
.v-hood{color:var(--muted);font-size:14px;margin-top:1px}
a.dir{flex:none;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;color:var(--ink);
  border:1px solid #d8d4cb;border-radius:999px;padding:8px 14px;background:var(--bg)}
a.dir:hover{background:#fff;border-color:var(--accent)}
.country-head{display:flex;align-items:center;gap:8px;margin:26px 0 8px;font-weight:800;font-size:15px}
.callout{display:flex;gap:12px;background:var(--card);border:1px solid var(--line);
  border-left:4px solid var(--accent);border-radius:12px;padding:14px 16px;color:#34302a;font-size:14.5px;margin-top:10px}
.callout .ic{font-size:18px;flex:none}
details.faq{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:0 16px;margin:8px 0}
details.faq summary{cursor:pointer;font-weight:700;padding:14px 0;list-style:none;
  display:flex;justify-content:space-between;align-items:center;gap:10px}
details.faq summary::-webkit-details-marker{display:none}
details.faq summary::after{content:"+";color:var(--accent);font-size:22px;line-height:1}
details.faq[open] summary::after{content:"\\2013"}
details.faq p{margin:0 0 14px;color:#34302a}
.more{display:grid;gap:8px;margin-top:8px}
.more a{display:flex;justify-content:space-between;align-items:center;background:var(--card);
  border:1px solid var(--line);border-radius:12px;padding:13px 16px;text-decoration:none;font-weight:600;transition:border-color .12s}
.more a:hover{border-color:var(--accent)}
.more a::after{content:"\\2192";color:var(--soft)}
footer.site{border-top:1px solid var(--line);margin-top:48px}
footer.site .f-in{padding-top:22px;padding-bottom:48px;color:var(--soft);font-size:14px}
footer.site a{color:var(--muted)}
`;

// --- JSON-LD -----------------------------------------------------------------
const breadcrumb = (name, url) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.origin}/` },
    { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE.origin}/guides/` },
    { '@type': 'ListItem', position: 3, name, item: url },
  ],
});
const faqLd = (faq) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});
const venueItemList = (venues, name) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  itemListElement: venues.map((v, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Restaurant',
      name: v.name,
      url: mapsHref(v),
      address: { '@type': 'PostalAddress', addressLocality: v.hood || '', addressRegion: 'NY/NJ' },
    },
  })),
});

// --- HTML fragments ----------------------------------------------------------
const venueLi = (v) =>
  `<li><div><div class="v-name">${esc(v.name)}</div><div class="v-hood">${esc(canonHood(v.hood))}</div></div>` +
  `<a class="dir" href="${esc(mapsHref(v))}" target="_blank" rel="noopener">Directions ↗</a></li>`;

const faqHtml = (faq) =>
  `<h2 class="serif">Frequently asked</h2>` +
  faq
    .map((f) => `<details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
    .join('');

const moreGuides = (slug) =>
  `<h2 class="serif">More guides</h2><div class="more">` +
  GUIDES.filter((g) => g.slug !== slug)
    .map((g) => `<a href="/guides/${g.slug}/">${esc(g.h1)}</a>`)
    .join('') +
  `<a href="/guides/">All NY/NJ World Cup guides</a></div>`;

// Full document shell — shared by guides and the hub.
function renderDocument({ title, description, canonical, jsonld, ph, accent, flag, h1, lead, main }) {
  const ld = jsonld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="${SITE.ogImage}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="theme-color" content="${accent}"/>
<link rel="icon" href="/favicon.png"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"/>
<style>${CSS}</style>
${ld}
${ph}
</head>
<body style="--accent:${accent}">
<header class="site">
  <a class="brand" href="/">NYNJ World Cup</a>
  <nav><a href="/guides/">Guides</a><a href="${SITE.appUrl}">Open the app</a></nav>
</header>
<section class="hero"><div class="hero-in">
  <span class="eyebrow">NYC &amp; NJ · 2026 FIFA World Cup</span>
  <div class="flag">${flag}</div>
  <h1 class="title serif">${esc(h1)}</h1>
  <p class="lead">${esc(lead)}</p>
  <a class="cta" href="${SITE.appUrl}">Open the live map &amp; RSVP →</a>
  <p class="updated">Last updated ${prettyDate(TODAY)} · maintained by NYNJ World Cup</p>
</div></section>
<main class="wrap">
${main}
</main>
<footer class="site"><div class="f-in">
  <p><a href="/">NYNJ World Cup</a> · <a href="/guides/">All guides</a> · <a href="${SITE.instagram}">Instagram</a></p>
  <p>2026 FIFA World Cup watch parties across the NYC &amp; New Jersey metro. June 11 – July 19, 2026.</p>
</div></footer>
</body></html>`;
}

// --- per-guide ---------------------------------------------------------------
function renderGuide(g) {
  const canonical = `${SITE.origin}/guides/${g.slug}/`;
  let venues = [];
  let venuesHtml = '';
  let accent = HOOD_ACCENT;
  let flag = '📍';

  if (g.kind === 'country') {
    const code = g.select.countryCode;
    accent = COUNTRY_META[code]?.accent || HUB_ACCENT;
    flag = countryFlag(code);
    venues = venuesForCountry(code);
    const hoods = topHoods(venues);
    venuesHtml =
      `<h2 class="serif">${esc(countryName(code))} watch-party venues <span class="count">${venues.length}</span></h2>` +
      (hoods.length ? `<p class="sub">Most concentrated in: ${esc(hoods.join(' · '))}.</p>` : '') +
      `<ul class="venues">${venues.map(venueLi).join('')}</ul>`;
  } else if (g.kind === 'hood') {
    venues = venuesForHood(g.select.hoodTerms);
    const byCountry = {};
    for (const v of venues) (byCountry[v.country_code] ||= []).push(v);
    const order = Object.keys(byCountry).sort((a, b) => byCountry[b].length - byCountry[a].length);
    venuesHtml =
      `<h2 class="serif">Venues in this neighborhood <span class="count">${venues.length}</span></h2>` +
      order
        .map((code) => {
          return `<div class="country-head">${esc(countryLabel(code))}</div><ul class="venues">${byCountry[code]
            .map(venueLi)
            .join('')}</ul>`;
        })
        .join('');
  }

  const jsonld = [breadcrumb(g.h1, canonical), faqLd(g.faq)];
  if (venues.length) jsonld.push(venueItemList(venues, g.h1));

  const lede = [g.intro, g.hoodColor]
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');
  const main =
    (lede ? `<div class="lede">${lede}</div>` : '') +
    venuesHtml +
    `<h2 class="serif">How we verify</h2><div class="callout"><span class="ic">✓</span><div>${esc(VERIFY_NOTE)}</div></div>` +
    faqHtml(g.faq) +
    moreGuides(g.slug);

  const html = renderDocument({
    title: g.metaTitle,
    description: g.metaDescription,
    canonical,
    jsonld,
    ph: analytics({ guide: g.slug }),
    accent,
    flag,
    h1: g.h1,
    lead: g.answer,
    main,
  });

  const dir = path.join(DIST, 'guides', g.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { slug: g.slug, venueCount: venues.length };
}

// --- hub ---------------------------------------------------------------------
function renderHub() {
  const canonical = `${SITE.origin}/guides/`;
  const card = (g) =>
    `<a href="/guides/${g.slug}/">${esc(g.h1)}</a>`;
  const countries = GUIDES.filter((g) => g.kind === 'country');
  const hoods = GUIDES.filter((g) => g.kind === 'hood');

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: canonical },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: HUB.h1,
      itemListElement: GUIDES.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: g.h1,
        url: `${SITE.origin}/guides/${g.slug}/`,
      })),
    },
  ];

  const main =
    `<div class="lede"><p>${esc(HUB.intro)}</p></div>` +
    `<h2 class="serif">By country</h2><div class="more">${countries.map(card).join('')}</div>` +
    `<h2 class="serif">By neighborhood</h2><div class="more">${hoods.map(card).join('')}</div>`;

  const html = renderDocument({
    title: HUB.metaTitle,
    description: HUB.metaDescription,
    canonical,
    jsonld,
    ph: analytics({ guide: 'hub' }),
    accent: HUB_ACCENT,
    flag: '🗺️',
    h1: HUB.h1,
    lead: HUB.answer,
    main,
  });

  fs.mkdirSync(path.join(DIST, 'guides'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'guides', 'index.html'), html);
}

// --- sitemap -----------------------------------------------------------------
function writeSitemap() {
  const urls = [
    { loc: `${SITE.origin}/`, pri: '1.0' },
    { loc: `${SITE.origin}/guides/`, pri: '0.9' },
    ...GUIDES.map((g) => ({ loc: `${SITE.origin}/guides/${g.slug}/`, pri: '0.8' })),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`,
      )
      .join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml);
}

// --- run ---------------------------------------------------------------------
if (!fs.existsSync(DIST)) {
  console.error('[guides] dist/ not found — run after `vite build`.');
  process.exit(1);
}
const results = GUIDES.map(renderGuide);
renderHub();
writeSitemap();
console.log(
  `[guides] wrote ${results.length} guides + hub + sitemap:\n` +
    results.map((r) => `  /guides/${r.slug}/  (${r.venueCount} venues)`).join('\n'),
);
