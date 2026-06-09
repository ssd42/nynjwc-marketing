// Guide definitions for the static /guides/* pages (see scripts/generate-guides.mjs
// and docs/spikes/ai-agent-discovery.md). Plain JS so the Node build step can import
// it directly — the React app does not use this; guides are static HTML.
//
// Venue lists are NOT hand-maintained here: each guide declares a `select`
// (country code or neighborhood terms) and the generator pulls matching rows from
// scripts/data/venues.json. Keep prose honest and local; the generator adds the
// venue list, "how we verify", last-updated date, JSON-LD, and footer.

export const SITE = {
  origin: 'https://nynjworldcup.com',
  appUrl: 'https://app.nynjworldcup.com/',
  instagram: 'https://www.instagram.com/nynjworldcup',
  ogImage: 'https://nynjworldcup.com/og-image.png',
};

export const COUNTRY_META = {
  BRA: { name: 'Brazil', flag: '🇧🇷', accent: '#009C3B' },
  POR: { name: 'Portugal', flag: '🇵🇹', accent: '#C8102E' },
  ARG: { name: 'Argentina', flag: '🇦🇷', accent: '#4A90D9' },
  MEX: { name: 'Mexico', flag: '🇲🇽', accent: '#006847' },
  USA: { name: 'United States', flag: '🇺🇸', accent: '#3C3B6E' },
  COL: { name: 'Colombia', flag: '🇨🇴', accent: '#2A4BA0' },
};

// Accent + emblem for non-country pages.
export const HOOD_ACCENT = '#B5532A';
export const HUB_ACCENT = '#1a1612';

// The "how we verify" line shown on every guide (plain-language trust signal).
export const VERIFY_NOTE =
  'We prioritize venues that have publicly shown soccer — national-team watch parties and ' +
  'World Cup / Copa América / Euro posts — plus established diaspora community spots, ' +
  'compiled from each venue’s own Instagram and website and public event pages, and ' +
  'reviewed by hand. Match-specific details can change, so check the live map and the ' +
  'venue’s socials before you go. See a mistake or a missing spot? Message us on Instagram.';

export const GUIDES = [
  // ── Country guides ────────────────────────────────────────────────────────
  {
    slug: 'where-to-watch-brazil-world-cup-nyc-nj',
    kind: 'country',
    select: { countryCode: 'BRA' },
    metaTitle: 'Where to Watch Brazil World Cup Games in NYC & NJ (2026)',
    h1: 'Where to Watch Brazil in the 2026 World Cup — NYC & NJ',
    metaDescription:
      'Brazilian bars and churrascarias across New York City and New Jersey showing ' +
      'every 2026 World Cup match — heaviest in Astoria, Queens and the Ironbound, Newark.',
    answer:
      'The biggest Brazil watch-party scenes in the NY/NJ metro are Astoria, Queens and ' +
      'the Ironbound in Newark, NJ. Below are Brazilian bars, churrascarias, and ' +
      'restaurants across New York and New Jersey showing the 2026 World Cup — tap any ' +
      'for directions, or open the live map to see match-day plans and RSVP.',
    faq: [
      {
        q: 'Where is the best place to watch Brazil games in NYC?',
        a: 'Astoria, Queens has the densest cluster of Brazilian venues in the five boroughs. In New Jersey, the Ironbound in Newark is the biggest Brazilian hub in the metro area.',
      },
      {
        q: 'Are the watch parties free?',
        a: 'Most diaspora bars and restaurants are free to enter; some ticketed fan-zone events exist. Each listing on the live map notes free vs. ticketed where known.',
      },
      {
        q: 'When does Brazil play in the 2026 World Cup?',
        a: 'The 2026 World Cup runs June 11 – July 19, 2026. Open the app for Brazil’s full schedule in Eastern Time and which venues are hosting each match.',
      },
    ],
  },
  {
    slug: 'where-to-watch-portugal-world-cup-newark-nyc',
    kind: 'country',
    select: { countryCode: 'POR' },
    metaTitle: 'Portugal World Cup Watch Parties in Newark & NYC (2026)',
    h1: 'Where to Watch Portugal in the 2026 World Cup — Newark & NYC',
    metaDescription:
      'Portuguese bars and restaurants showing the 2026 World Cup across the NY/NJ ' +
      'metro — centered on the Ironbound in Newark, plus NYC spots.',
    answer:
      'The Ironbound in Newark, NJ is the heart of Portuguese soccer culture in the ' +
      'metro area and the best place to watch Portugal in the 2026 World Cup. Below are ' +
      'Portuguese venues across NY/NJ — tap any for directions, or open the live map to RSVP.',
    faq: [
      {
        q: 'Where do Portugal fans watch the World Cup near NYC?',
        a: 'The Ironbound (Newark, NJ) is the biggest Portuguese district in the area, packed with Portuguese restaurants and bars that show every match. There are also spots in NYC.',
      },
      {
        q: 'Do I need a reservation?',
        a: 'For big matches the Ironbound fills up fast — arriving early or calling ahead helps. Some venues require a minimum or RSVP; check the listing on the map.',
      },
      {
        q: 'When does Portugal play?',
        a: 'The tournament runs June 11 – July 19, 2026. Open the app for Portugal’s schedule in ET and which venues are hosting.',
      },
    ],
  },
  {
    slug: 'where-to-watch-argentina-world-cup-nyc-nj',
    kind: 'country',
    select: { countryCode: 'ARG' },
    metaTitle: 'Argentina World Cup Bars in Queens & Manhattan (2026)',
    h1: 'Where to Watch Argentina in the 2026 World Cup — NYC & NJ',
    metaDescription:
      'Argentine steakhouses and bars showing the 2026 World Cup across New York City ' +
      'and New Jersey — find the defending champions’ fans near you.',
    answer:
      'Argentina’s fans gather at Argentine steakhouses (parrillas) and bars spread ' +
      'across Queens, Manhattan, and North Jersey. Below are venues showing the 2026 ' +
      'World Cup — tap any for directions, or open the live map to RSVP.',
    faq: [
      {
        q: 'Where can I watch Argentina games in Queens?',
        a: 'Several Argentine parrillas and bars in Queens (and across Manhattan and NJ) show the matches. See the full list below and on the live map.',
      },
      {
        q: 'Is it busy for Argentina matches?',
        a: 'Argentina are the defending champions, so big matches draw crowds — get there early. Listings note any minimums or RSVPs.',
      },
      {
        q: 'When does Argentina play in 2026?',
        a: 'June 11 – July 19, 2026. The app has Argentina’s schedule in ET and the venues hosting each game.',
      },
    ],
  },
  {
    slug: 'where-to-watch-mexico-world-cup-nyc-nj',
    kind: 'country',
    select: { countryCode: 'MEX' },
    metaTitle: 'Mexico World Cup Watch Parties in NYC & NJ (2026)',
    h1: 'Where to Watch Mexico in the 2026 World Cup — NYC & NJ',
    metaDescription:
      'Mexico is a 2026 host nation. Find Mexican bars, cantinas, and restaurants ' +
      'showing the World Cup across New York City and New Jersey.',
    answer:
      'Mexico co-hosts the 2026 World Cup, and El Tri draws some of the metro’s biggest ' +
      'crowds. Below are Mexican cantinas, taquerías, and bars across NY/NJ showing the ' +
      'matches — tap any for directions, or open the live map to RSVP.',
    faq: [
      {
        q: 'Where do Mexico fans watch the World Cup in NYC?',
        a: 'Mexican cantinas and bars across Manhattan, Queens, and New Jersey host watch parties. See the list below and the live map.',
      },
      {
        q: 'Is Mexico hosting in 2026?',
        a: 'Yes — the 2026 World Cup is co-hosted by the USA, Mexico, and Canada, so Mexico fan energy is especially high.',
      },
      {
        q: 'When does Mexico play?',
        a: 'June 11 – July 19, 2026. Open the app for Mexico’s schedule in ET and the venues hosting each match.',
      },
    ],
  },
  {
    slug: 'where-to-watch-usa-world-cup-nyc-nj',
    kind: 'country',
    select: { countryCode: 'USA' },
    metaTitle: 'Where to Watch USA World Cup Games in NY & NJ (2026)',
    h1: 'Where to Watch the USA in the 2026 World Cup — NYC & NJ',
    metaDescription:
      'The USA co-hosts 2026. Find American sports bars across NYC and New Jersey ' +
      'showing every USMNT and World Cup match.',
    answer:
      'The USA co-hosts the 2026 World Cup, and matches at MetLife Stadium make the metro ' +
      'a hub. Below are sports bars across NYC and North Jersey showing the games — tap ' +
      'any for directions, or open the live map to RSVP.',
    faq: [
      {
        q: 'Where can I watch USMNT games near NYC?',
        a: 'Classic American sports bars across Manhattan, Hoboken, Jersey City, and Williamsburg show every match. See the list below and the live map.',
      },
      {
        q: 'Are World Cup matches being played near NYC?',
        a: 'Yes — MetLife Stadium in East Rutherford, NJ hosts 2026 World Cup matches, including the final, so the whole metro is buzzing.',
      },
      {
        q: 'When does the USA play?',
        a: 'June 11 – July 19, 2026. The app has the USA schedule in ET and which venues are hosting.',
      },
    ],
  },
  {
    slug: 'where-to-watch-colombia-world-cup-nyc-nj',
    kind: 'country',
    select: { countryCode: 'COL' },
    metaTitle: 'Colombia World Cup Watch Parties in NYC & NJ (2026)',
    h1: 'Where to Watch Colombia in the 2026 World Cup — NYC & NJ',
    metaDescription:
      'Colombian bars and restaurants showing the 2026 World Cup across the NY/NJ ' +
      'metro — centered on Jackson Heights, Queens.',
    answer:
      'Jackson Heights, Queens is the center of Colombian life in NYC and the best place ' +
      'to watch Colombia in the 2026 World Cup. Below are Colombian venues across NY/NJ — ' +
      'tap any for directions, or open the live map to RSVP.',
    faq: [
      {
        q: 'Where do Colombia fans watch in NYC?',
        a: 'Jackson Heights, Queens has the densest cluster of Colombian restaurants and bars. See the list below and the live map.',
      },
      {
        q: 'Are the watch parties family-friendly?',
        a: 'Many Colombian restaurants in Jackson Heights are family spots that show the games — check each listing on the map.',
      },
      {
        q: 'When does Colombia play?',
        a: 'June 11 – July 19, 2026. Open the app for Colombia’s schedule in ET and the hosting venues.',
      },
    ],
  },

  // ── Neighborhood guides ───────────────────────────────────────────────────
  {
    slug: 'where-to-watch-world-cup-ironbound-newark',
    kind: 'hood',
    select: { hoodTerms: ['ironbound'] },
    metaTitle: 'Where to Watch the 2026 World Cup in the Ironbound, Newark',
    h1: 'Where to Watch the 2026 World Cup in the Ironbound, Newark',
    metaDescription:
      'The Ironbound in Newark, NJ is the metro’s biggest Portuguese and Brazilian ' +
      'district — here are the bars and restaurants showing the 2026 World Cup.',
    answer:
      'The Ironbound (Newark, NJ) is the metro area’s biggest Portuguese and Brazilian ' +
      'neighborhood and one of the best places anywhere near NYC to watch the World Cup. ' +
      'Below are Ironbound venues showing the 2026 matches — tap any for directions, or ' +
      'open the live map to RSVP.',
    faq: [
      {
        q: 'Which teams does the Ironbound support?',
        a: 'The Ironbound skews heavily Portuguese and Brazilian, with Spanish and other communities too — it’s a top spot for those teams’ matches.',
      },
      {
        q: 'How do I get to the Ironbound from NYC?',
        a: 'Newark Penn Station sits at the edge of the Ironbound, about 20–30 minutes from Manhattan by PATH or NJ Transit.',
      },
      {
        q: 'Will it be crowded?',
        a: 'For Portugal and Brazil matches, yes — arrive early. Listings note any minimums or RSVPs.',
      },
    ],
  },
  {
    slug: 'where-to-watch-world-cup-astoria-queens',
    kind: 'hood',
    select: { hoodTerms: ['astoria'] },
    metaTitle: 'Where to Watch the 2026 World Cup in Astoria, Queens',
    h1: 'Where to Watch the 2026 World Cup in Astoria, Queens',
    metaDescription:
      'Astoria, Queens is one of NYC’s most international neighborhoods — here are the ' +
      'bars and restaurants showing the 2026 World Cup, by country.',
    answer:
      'Astoria, Queens is one of the most international neighborhoods in NYC, with strong ' +
      'Brazilian, Egyptian, and many other communities — a great place to watch the 2026 ' +
      'World Cup. Below are Astoria venues showing matches — tap any for directions, or ' +
      'open the live map to RSVP.',
    faq: [
      {
        q: 'Which teams can I watch in Astoria?',
        a: 'Astoria spans many communities (Brazil, Egypt, and more), so a range of teams have a home here. The list below groups venues by the country they support.',
      },
      {
        q: 'How do I get to Astoria?',
        a: 'Astoria is on the N/W trains in Queens, roughly 20–30 minutes from Midtown Manhattan.',
      },
      {
        q: 'When is the 2026 World Cup?',
        a: 'June 11 – July 19, 2026. Open the app for the full schedule in ET and which Astoria venues are hosting.',
      },
    ],
  },
  {
    slug: 'where-to-watch-world-cup-jackson-heights-queens',
    kind: 'hood',
    select: { hoodTerms: ['jackson heights'] },
    metaTitle: 'Where to Watch the 2026 World Cup in Jackson Heights, Queens',
    h1: 'Where to Watch the 2026 World Cup in Jackson Heights, Queens',
    metaDescription:
      'Jackson Heights, Queens is the heart of Colombian and Ecuadorian NYC — here are ' +
      'the bars and restaurants showing the 2026 World Cup.',
    answer:
      'Jackson Heights, Queens is the center of Colombian and Ecuadorian life in NYC and ' +
      'a prime spot to watch the 2026 World Cup. Below are Jackson Heights venues showing ' +
      'matches — tap any for directions, or open the live map to RSVP.',
    faq: [
      {
        q: 'Which teams does Jackson Heights support?',
        a: 'Jackson Heights skews strongly Colombian and Ecuadorian, with other Latin American communities too — a top spot for those teams’ matches.',
      },
      {
        q: 'How do I get to Jackson Heights?',
        a: 'It’s on the 7, E, F, M, and R trains in Queens — roughly 25–35 minutes from Midtown Manhattan.',
      },
      {
        q: 'When is the 2026 World Cup?',
        a: 'June 11 – July 19, 2026. Open the app for the schedule in ET and the venues hosting each match.',
      },
    ],
  },
];

// The /guides/ hub (also answers the broad "watch-party map by country" query).
export const HUB = {
  metaTitle: 'World Cup 2026 Watch Parties in NYC & NJ — by Country & Neighborhood',
  h1: 'Where to Watch the 2026 World Cup in NYC & New Jersey',
  metaDescription:
    'The complete guide to 2026 World Cup watch parties across New York City and New ' +
    'Jersey — diaspora bars and restaurants by country and neighborhood, on a live map.',
  answer:
    'NYNJ World Cup maps watch parties at diaspora bars and venues across the NYC and ' +
    'New Jersey metro for the 2026 FIFA World Cup (June 11 – July 19, 2026). Browse by ' +
    'country or neighborhood below, or open the live, interactive map to find a spot near ' +
    'you and RSVP.',
};
