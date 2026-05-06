# nynjwc-marketing

Static marketing landing page for nynjworldcup. Self-contained React + Vite + TypeScript build that deploys cleanly to GitHub Pages, a custom domain, or any static host (Netlify, Vercel, S3, etc.).

## What's inside

- The full landing page: hero with animated phone, country flag ticker, three-up "How it works", country grid, FAQ accordion, footer with App Store CTA + waitlist email field.
- The animated phone preview: cycles through 7 (country, screen) combinations every ~3.4s. Pauses on hover. Click the dots to jump.
- Real flag SVGs from `country-flag-icons` (tree-shaken to the 8 we ship).
- The five in-app screens (Home, Country, Map, Follow, Saved) rendered in a static iPhone frame mockup. **No MapLibre / no real tile servers** — the marketing build uses the original CSS-pattern map so the bundle stays small and 100% offline.
- No backend. No auth. No cookies. No analytics (yet).

## Local dev

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # writes dist/
npm run preview      # serves dist/ to verify the production build
npm run typecheck
```

## Deploy to GitHub Pages

The workflow at [`.github/workflows/pages.yml`](.github/workflows/pages.yml) is a copy of what your **repo root** needs. To enable:

1. **Move the workflow file**: copy this dir's `.github/workflows/pages.yml` to `<repo-root>/.github/workflows/pages.yml`. GitHub only looks for workflows at the repo root.
2. **Settings → Pages**: set Source to "GitHub Actions" (not "branch").
3. **Push to main**. The workflow builds `nynjwc-marketing/` and publishes `dist/` to Pages.

`vite.config.ts` uses `base: './'` (relative asset URLs), so the same build works at:

- A user/org page: `https://username.github.io/`
- A project page: `https://username.github.io/repo-name/`
- A custom domain: add a `public/CNAME` file with your domain, or use the Pages settings UI.

## Customizing

- **Mock content (countries, venues, friends, taglines)** — `src/data.ts`. Same shape as the full app.
- **Adding a country** — add it to `data.ts` (with `code`, `colors`, `tagline`, `neighborhoods`, `venues`), then update `COUNTRY_TO_ALPHA2` in `data.ts` so the real flag renders.
- **Animated phone rotation** — edit `ROTATION` in `src/landing/AnimatedPhone.tsx`.
- **App Store / waitlist links** — currently both `href="#"` placeholders in `src/landing/LandingPage.tsx` (Footer + Hero CTAs). Wire them up before launch.
- **Color tokens** — inline. The cream background `#f0eee9`, dark `#1a1612`, and the live-red `#d23` show up in many places.

## What this is NOT

- Not the in-app experience. That's `nynjwc-frontend/` — separate React + Vite + Capacitor app with real auth, real API calls, MapLibre + OSM, history-aware navigation.
- Not SSR. The HTML shell has all the meta tags (description, OG tags) so social cards work, but body content paints client-side. If SEO becomes a priority, swap to Astro — same React components, build-time pre-rendered HTML.
- Not a CMS. Edit copy in `LandingPage.tsx`.

## File map

```
src/
  main.tsx                   – React mount point
  styles.css                 – global CSS + keyframes
  data.ts                    – COUNTRIES, COUNTRY_ORDER, MATCHES, FRIENDS
  types.ts                   – domain types
  landing/
    LandingPage.tsx          – Hero, CountryTicker, FeatureRow, CountriesSection, FAQ, Footer
    AnimatedPhone.tsx        – cycling iPhone preview
  components/
    IOSDevice.tsx            – iPhone frame mockup (status bar, dynamic island, home indicator)
    TabBar.tsx               – static decorative tab bar inside the phone
    primitives.tsx           – Flag, FlagStripe, FriendStack, Avatar, PhotoPlaceholder, RsvpPill, VariantHeading
    MockAd.tsx               – sponsored card used inside the phone screens
  screens/
    HomeScreen.tsx           – Today's matches, country chips, live hero
    CountryScreen.tsx        – country detail with venue cards
    MapScreen.tsx            – CSS-pattern fake map (NOT MapLibre)
    FollowScreen.tsx         – country picker + notification toggles
    SavedScreen.tsx          – RSVPed venue list
```
