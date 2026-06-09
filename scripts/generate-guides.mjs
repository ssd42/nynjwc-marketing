// Post-build static-site generator for /guides/* (see docs/spikes/ai-agent-discovery.md).
//
// Runs after `vite build` + prerender. For each guide in guides.data.mjs it:
//   - selects matching venues from scripts/data/venues.json,
//   - renders a self-contained static HTML doc (own <head>: title/meta/canonical/OG +
//     JSON-LD FAQPage/BreadcrumbList/ItemList; inline CSS so there are no asset-path
//     issues at nested URLs and the page is fully readable with zero JS),
//   - writes dist/guides/<slug>/index.html (pretty URLs for GitHub Pages).
// Then it writes the /guides/ hub and regenerates dist/sitemap.xml.
//
// Plain Node, no new deps. Intentionally JS-free output: AI/search crawlers get
// complete text. Interactivity (map, RSVP) lives in the app, linked from each page.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, COUNTRY_META, GUIDES, HUB, VERIFY_NOTE } from './guides.data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const VENUES = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/venues.json'), 'utf8'));

const TODAY = new Date().toISOString().slice(0, 10); // build date, e.g. 2026-06-09
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function mapsHref(v) {
  if (v.google_maps_url) return v.google_maps_url;
  const q = encodeURIComponent(`${v.name}, ${v.hood || ''}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// --- venue selection ---------------------------------------------------------
function venuesForCountry(code) {
  return VENUES.filter((v) => v.country_code === code).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
function venuesForHood(terms) {
  const t = terms.map((x) => x.toLowerCase());
  return VENUES.filter((v) => {
    const h = (v.hood || '').toLowerCase();
    return t.some((term) => h.includes(term));
  }).sort((a, b) => a.name.localeCompare(b.name));
}
function topHoods(venues, n = 4) {
  const counts = {};
  for (const v of venues) {
    const h = (v.hood || '').trim();
    if (h) counts[h] = (counts[h] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([h]) => h);
}

// --- shared chrome -----------------------------------------------------------
const CSS = `
:root{--bg:#f0eee9;--ink:#1a1612;--line:#d8d4cb;--muted:#6f6a60;--card:#fff}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
a{color:var(--ink)}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 64px}
header.site{display:flex;align-items:center;justify-content:space-between;
  padding:16px 20px;border-bottom:1px solid var(--line)}
header.site a{font-weight:800;text-decoration:none;letter-spacing:-0.02em}
header.site nav a{font-weight:600;font-size:14px;color:var(--muted);margin-left:16px;text-decoration:none}
h1{font-size:30px;line-height:1.2;letter-spacing:-0.02em;margin:18px 0 6px}
h2{font-size:20px;margin:34px 0 10px}
.updated{font-size:13px;color:var(--muted);margin:0 0 18px}
.answer{font-size:18px;background:var(--card);border:1px solid var(--line);
  border-radius:12px;padding:16px 18px}
.cta{display:inline-block;margin:18px 0;padding:12px 20px;background:var(--ink);
  color:var(--bg);border-radius:999px;font-weight:700;text-decoration:none}
ul.venues{list-style:none;padding:0;margin:8px 0}
ul.venues li{border:1px solid var(--line);border-radius:10px;background:var(--card);
  padding:12px 14px;margin:8px 0;display:flex;justify-content:space-between;gap:12px;align-items:baseline}
ul.venues .name{font-weight:700}
ul.venues .hood{color:var(--muted);font-size:14px}
ul.venues a.dir{font-size:13px;font-weight:600;white-space:nowrap;text-decoration:none;
  border:1px solid var(--line);border-radius:999px;padding:6px 12px;background:var(--bg)}
.country-head{display:flex;align-items:center;gap:8px;margin:24px 0 4px;font-weight:800}
.verify{font-size:14px;color:var(--muted);background:var(--card);border:1px solid var(--line);
  border-radius:10px;padding:12px 14px;margin-top:10px}
.faq dt{font-weight:700;margin-top:16px}
.faq dd{margin:4px 0 0;color:#2a251f}
.more a{display:block;padding:8px 0;border-bottom:1px solid var(--line);text-decoration:none;font-weight:600}
footer.site{border-top:1px solid var(--line);margin-top:40px;padding-top:18px;font-size:14px;color:var(--muted)}
footer.site a{color:var(--muted)}
`;

// PostHog (same project/host as the app — src/main.tsx). The guide pages are
// otherwise JS-free; this snippet auto-captures a $pageview with $referrer /
// $referring_domain + UTM params, which is what surfaces AI/search referrals
// (chatgpt.com, perplexity.ai, google, bing). `section: 'guides'` tags every
// event so guide traffic is filterable.
const PH_KEY = 'phc_CQ9UJEmmzhe586scbjKrxUtRD3yy8obAhiYdtwZZtkFA';
const PH_HOST = 'https://us.i.posthog.com';
function analytics(props) {
  const reg = JSON.stringify({ section: 'guides', ...props });
  return `<script>
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('${PH_KEY}',{api_host:'${PH_HOST}',defaults:'2025-05-24',person_profiles:'identified_only'});
posthog.register(${reg});
</script>`;
}

function head({ title, description, canonical, jsonld, analytics: ph }) {
  const ld = jsonld
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`)
    .join('\n');
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
<meta name="theme-color" content="#f0eee9"/>
<link rel="icon" href="/favicon.png"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<style>${CSS}</style>
${ld}
${ph || ''}
</head>`;
}

function chromeOpen() {
  return `<body>
<header class="site">
  <a href="/">NYNJ World Cup</a>
  <nav><a href="/guides/">Guides</a><a href="${SITE.appUrl}">Open the app</a></nav>
</header>
<main class="wrap">`;
}
function chromeClose() {
  return `</main>
<footer class="site wrap">
  <p><a href="/">NYNJ World Cup</a> · <a href="/guides/">All guides</a> · <a href="${SITE.instagram}">Instagram</a></p>
  <p>2026 FIFA World Cup watch parties across the NYC &amp; New Jersey metro. June 11 – July 19, 2026.</p>
</footer>
</body></html>`;
}

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

function venueLi(v) {
  return `<li><span><span class="name">${esc(v.name)}</span> <span class="hood">· ${esc(v.hood || 'NY/NJ')}</span></span>` +
    `<a class="dir" href="${esc(mapsHref(v))}" target="_blank" rel="noopener">Directions ↗</a></li>`;
}

function faqHtml(faq) {
  return `<h2>FAQ</h2><dl class="faq">` +
    faq.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('') +
    `</dl>`;
}

function moreGuidesHtml(currentSlug) {
  const others = GUIDES.filter((g) => g.slug !== currentSlug);
  return `<h2>More guides</h2><div class="more">` +
    others.map((g) => `<a href="/guides/${g.slug}/">${esc(g.h1)}</a>`).join('') +
    `<a href="/guides/">All NY/NJ World Cup guides →</a></div>`;
}

// --- per-guide rendering -----------------------------------------------------
function renderGuide(g) {
  const canonical = `${SITE.origin}/guides/${g.slug}/`;
  let venues = [];
  let venuesHtml = '';

  if (g.kind === 'country') {
    venues = venuesForCountry(g.select.countryCode);
    const hoods = topHoods(venues);
    venuesHtml =
      `<h2>${esc(COUNTRY_META[g.select.countryCode]?.name || '')} watch-party venues in NY/NJ (${venues.length})</h2>` +
      (hoods.length ? `<p class="hood">Most concentrated in: ${esc(hoods.join(' · '))}.</p>` : '') +
      `<ul class="venues">${venues.map(venueLi).join('')}</ul>`;
  } else if (g.kind === 'hood') {
    venues = venuesForHood(g.select.hoodTerms);
    // group by country for neighborhood pages
    const byCountry = {};
    for (const v of venues) (byCountry[v.country_code] ||= []).push(v);
    const order = Object.keys(byCountry).sort((a, b) => byCountry[b].length - byCountry[a].length);
    venuesHtml =
      `<h2>Venues in this neighborhood (${venues.length})</h2>` +
      order
        .map((code) => {
          const meta = COUNTRY_META[code];
          const label = meta ? `${meta.flag} ${meta.name}` : code;
          return `<div class="country-head">${esc(label)}</div><ul class="venues">${byCountry[code].map(venueLi).join('')}</ul>`;
        })
        .join('');
  }

  const jsonld = [breadcrumb(g.h1, canonical), faqLd(g.faq)];
  if (venues.length) jsonld.push(venueItemList(venues, g.h1));

  const html =
    head({
      title: g.metaTitle,
      description: g.metaDescription,
      canonical,
      jsonld,
      analytics: analytics({ guide: g.slug }),
    }) +
    chromeOpen() +
    `<h1>${esc(g.h1)}</h1>` +
    `<p class="updated">Last updated ${prettyDate(TODAY)} · maintained by NYNJ World Cup</p>` +
    `<p class="answer">${esc(g.answer)}</p>` +
    `<a class="cta" href="${SITE.appUrl}">Open the live map &amp; RSVP →</a>` +
    venuesHtml +
    `<h2>How we verify listings</h2><p class="verify">${esc(VERIFY_NOTE)}</p>` +
    faqHtml(g.faq) +
    moreGuidesHtml(g.slug) +
    chromeClose();

  const dir = path.join(DIST, 'guides', g.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { slug: g.slug, venueCount: venues.length };
}

// --- hub ---------------------------------------------------------------------
function renderHub() {
  const canonical = `${SITE.origin}/guides/`;
  const countries = GUIDES.filter((g) => g.kind === 'country');
  const hoods = GUIDES.filter((g) => g.kind === 'hood');
  const list = (items) =>
    `<ul class="venues">${items
      .map((g) => `<li><span class="name"><a href="/guides/${g.slug}/" style="text-decoration:none">${esc(g.h1)}</a></span></li>`)
      .join('')}</ul>`;

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

  const html =
    head({
      title: HUB.metaTitle,
      description: HUB.metaDescription,
      canonical,
      jsonld,
      analytics: analytics({ guide: 'hub' }),
    }) +
    chromeOpen() +
    `<h1>${esc(HUB.h1)}</h1>` +
    `<p class="updated">Last updated ${prettyDate(TODAY)}</p>` +
    `<p class="answer">${esc(HUB.answer)}</p>` +
    `<a class="cta" href="${SITE.appUrl}">Open the live watch-party map →</a>` +
    `<h2>By country</h2>${list(countries)}` +
    `<h2>By neighborhood</h2>${list(hoods)}` +
    chromeClose();

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
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
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
