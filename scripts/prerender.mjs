/**
 * Post-build prerender step.
 *
 * The marketing site is a client-rendered React SPA — crawlers and AI
 * engines that don't execute JavaScript would otherwise see nothing but an
 * empty `<div id="root">`. This script loads the freshly built site in
 * headless Chromium, lets it render, and writes the fully-rendered HTML
 * back over `dist/index.html`.
 *
 * The client still boots exactly as before: `main.tsx` calls
 * `createRoot().render()`, which re-renders into `#root`. We deliberately do
 * NOT hydrate — the page has time-dependent content (the kickoff countdown,
 * the Date.now()-relative phone preview) that would cause hydration
 * mismatches. A plain re-render is correct and visually seamless here.
 *
 * Run automatically as the last step of `npm run build`.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';

const OUT = resolve('dist/index.html');

const server = await preview({ preview: { port: 4178, strictPort: false } });
const url = server.resolvedUrls?.local?.[0];
if (!url) throw new Error('prerender: could not resolve preview server URL');

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'load', timeout: 30_000 });

  // Wait for the real content to be in the DOM before snapshotting.
  await page.waitForSelector('#faq', { timeout: 20_000 });
  await page.waitForFunction(
    () => document.querySelectorAll('.country-grid > div').length >= 40,
    { timeout: 20_000 },
  );

  const html = await page.content();
  // Sanity check — never overwrite dist with a half-rendered page.
  if (!html.includes('id="faq"') || !html.includes('How it works')) {
    throw new Error('prerender: rendered HTML is missing expected content');
  }

  writeFileSync(OUT, html);
  console.log(`prerender: wrote ${OUT} (${(html.length / 1024).toFixed(0)} KB)`);
} finally {
  await browser.close();
  await server.httpServer?.close();
}

process.exit(0);
