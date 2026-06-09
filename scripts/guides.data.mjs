// Guide definitions for the static /guides/* pages (see scripts/generate-guides.mjs
// and docs/spikes/ai-agent-discovery.md). Plain JS so the Node build step can import
// it directly — the React app does not use this; guides are static HTML.
//
// Voice: see the guide voice brief — Jaeki Cho / "Righteous Eats" energy as a tone
// anchor (NYC-native, warm, diaspora-proud), applied to `intro`, `hoodColor`, and FAQ
// answers. `answer` stays crisp/factual (it's the hero lead + what AI quotes). Venue
// lists are pulled from scripts/data/venues.json by `select`; never hand-listed here.

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

export const HOOD_ACCENT = '#B5532A';
export const HUB_ACCENT = '#1a1612';

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
      'the Ironbound in Newark, with Brazilian churrascarias and bars scattered across ' +
      'both states.',
    intro:
      'Brazil doesn’t just watch the World Cup — it throws a party for it. When the Seleção ' +
      'play, the churrascarias and botecos around the metro turn into supporter sections: ' +
      'yellow everywhere, a samba beat between goals, a plate of picanha in one hand.',
    hoodColor:
      'Astoria is Brazil’s living room in Queens, and the Ironbound in Newark is the ' +
      'heavyweight across the river — both go full-volume on matchday. For the big games, ' +
      'show up early; the good tables go fast.',
    faq: [
      {
        q: 'Where is the best place to watch Brazil games in NYC?',
        a: 'Astoria, Queens has the densest cluster of Brazilian venues in the five boroughs. Across the river, the Ironbound in Newark is the metro’s biggest Brazilian hub — both are great shouts.',
      },
      {
        q: 'Are the watch parties free?',
        a: 'Most diaspora bars and restaurants are free to walk into; a few ticketed fan-zone events pop up too. Each spot on the live map flags free vs. ticketed where we know it.',
      },
      {
        q: 'When does Brazil play in the 2026 World Cup?',
        a: 'The tournament runs June 11 – July 19, 2026. Open the app for Brazil’s full schedule in Eastern Time and which venues are hosting each match.',
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
      'The Ironbound in Newark, NJ is the heart of Portuguese soccer culture in the metro ' +
      'and the best place to watch Portugal, with a handful of NYC spots too.',
    intro:
      'If you want Portugal, you go to the Ironbound. Newark’s Portuguese quarter lives and ' +
      'breathes futebol — grilled sardines, a glass of vinho verde, and a room that holds ' +
      'its breath every time the Seleção das Quinas step out.',
    hoodColor:
      'On a Portugal matchday the Ironbound’s restaurants and bars basically run as one big ' +
      'supporter section. NYC has its pockets, but this is the main event — get there early ' +
      'or call ahead for the marquee games.',
    faq: [
      {
        q: 'Where do Portugal fans watch the World Cup near NYC?',
        a: 'The Ironbound (Newark, NJ) is the biggest Portuguese district in the area — block after block of Portuguese restaurants and bars showing every match. A few NYC spots carry it too.',
      },
      {
        q: 'Do I need a reservation?',
        a: 'For the big matches the Ironbound fills fast, so arriving early or calling ahead helps. Some venues run a minimum or RSVP — check the spot’s listing on the map.',
      },
      {
        q: 'When does Portugal play?',
        a: 'June 11 – July 19, 2026. Open the app for Portugal’s schedule in ET and which venues are hosting.',
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
      'Argentina’s fans gather at parrillas (Argentine steakhouses) and bars spread across ' +
      'Queens, Manhattan, and North Jersey.',
    intro:
      'The reigning champions travel deep in this city. When Argentina play, the parrillas ' +
      'turn into a sea of celeste y blanco — choripán on the grill, nerves everywhere, and ' +
      'the loudest “vamos” you’ll hear outside Buenos Aires.',
    hoodColor:
      'The spots are spread across Queens, Manhattan, and Bergen County rather than one ' +
      'block, so pick the one near you. Big matches pull a crowd — arrive early.',
    faq: [
      {
        q: 'Where can I watch Argentina games in Queens?',
        a: 'Several Argentine parrillas and bars in Queens carry the matches, plus more across Manhattan and North Jersey. The full list is below and on the live map.',
      },
      {
        q: 'Is it busy for Argentina matches?',
        a: 'They’re the defending champions, so the big games draw real crowds — get there early. Listings note any minimums or RSVPs.',
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
      'crowds — find Mexican cantinas and bars across NYC and NJ.',
    intro:
      'Mexico is a host nation in 2026, so the El Tri energy is turned all the way up. ' +
      'Cantinas and taquerías across the boroughs and Jersey go green-white-red on matchday ' +
      '— micheladas going, the whole room singing, every save a roar.',
    hoodColor:
      'From Manhattan cantinas to Queens taquerías to North Jersey, the spots are ' +
      'everywhere — one of the easiest fanbases to find a room for. Expect a crowd for the ' +
      'big ones.',
    faq: [
      {
        q: 'Where do Mexico fans watch the World Cup in NYC?',
        a: 'Mexican cantinas and bars across Manhattan, Queens, and New Jersey host watch parties. See the list below and the live map.',
      },
      {
        q: 'Is Mexico hosting in 2026?',
        a: 'Yes — the 2026 World Cup is co-hosted by the USA, Mexico, and Canada, so Mexico fan energy runs especially high.',
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
      'The USA co-hosts the 2026 World Cup, with matches at MetLife Stadium — catch the ' +
      'USMNT at sports bars across NYC and North Jersey.',
    intro:
      'Home World Cup, home crowd. With games — and the final — at MetLife right across the ' +
      'river, the metro is ground zero for USMNT fans, and the classic sports bars are ready ' +
      'for it.',
    hoodColor:
      'Manhattan, Hoboken, Jersey City, Williamsburg — the go-to soccer bars are all over ' +
      'the map here. Get in early for the USA group-stage games; they’ll pack out.',
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
      'Jackson Heights, Queens is the center of Colombian life in NYC and the best place to ' +
      'watch Colombia, with more spots across the metro.',
    intro:
      'Jackson Heights is Colombia in Queens. When Los Cafeteros play, Roosevelt Avenue ' +
      'turns yellow — arepas and empanadas going, music between goals, the whole ' +
      'neighborhood locked in.',
    hoodColor:
      'Jackson Heights is the heartbeat, but you’ll find Colombian rooms elsewhere in the ' +
      'metro too. Matchdays get loud and full — come early.',
    faq: [
      {
        q: 'Where do Colombia fans watch in NYC?',
        a: 'Jackson Heights, Queens has the densest cluster of Colombian restaurants and bars. See the list below and the live map.',
      },
      {
        q: 'Are the watch parties family-friendly?',
        a: 'Plenty of the Colombian restaurants in Jackson Heights are family spots that put the game on — check each listing on the map.',
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
      'The Ironbound in Newark, NJ is the metro’s biggest Portuguese and Brazilian ' +
      'neighborhood — one of the best places anywhere near NYC to watch the World Cup.',
    intro:
      'The Ironbound is what people mean when they say “go where the fans are.” Newark’s ' +
      'Portuguese-and-Brazilian quarter is a few dozen blocks of grills, bakeries, and bars ' +
      'that flip into supporter sections the second a match kicks off.',
    hoodColor:
      'It’s about 20 minutes from Manhattan — PATH or NJ Transit to Newark Penn and you’re ' +
      'in it. Portugal and Brazil days are the big ones; go early or call ahead for those.',
    faq: [
      {
        q: 'Which teams does the Ironbound support?',
        a: 'It skews heavily Portuguese and Brazilian, with Spanish and other communities mixed in — a top spot for any of those teams’ matches.',
      },
      {
        q: 'How do I get to the Ironbound from NYC?',
        a: 'Newark Penn Station sits right at the edge of the Ironbound — about 20–30 minutes from Manhattan on PATH or NJ Transit.',
      },
      {
        q: 'Will it be crowded?',
        a: 'For Portugal and Brazil matches, absolutely — arrive early. Listings note any minimums or RSVPs.',
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
      'Astoria, Queens is one of NYC’s most international neighborhoods — strong Brazilian, ' +
      'Egyptian, and many other communities, all watching the World Cup.',
    intro:
      'Astoria is basically the whole World Cup on one set of avenues. Brazilian, Egyptian, ' +
      'Greek, and more — whatever flag you fly, there’s a room here that flies it too, a ' +
      'short hop on the N/W from Midtown.',
    hoodColor:
      'Because so many communities share the neighborhood, the list below is grouped by who ' +
      'each spot is for — pick your team and head to the matching block.',
    faq: [
      {
        q: 'Which teams can I watch in Astoria?',
        a: 'A lot of them — Astoria spans Brazilian, Egyptian, and other communities, so several teams have a home here. The list below groups venues by the country they support.',
      },
      {
        q: 'How do I get to Astoria?',
        a: 'Astoria sits on the N/W trains in Queens, roughly 20–30 minutes from Midtown Manhattan.',
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
      'Jackson Heights, Queens is the heart of Colombian and Ecuadorian NYC — a prime spot ' +
      'to watch the 2026 World Cup.',
    intro:
      'Roosevelt Avenue is South America in Queens. Jackson Heights goes hardest for ' +
      'Colombia and Ecuador — arepas, empanadas, and a block that turns into a party the ' +
      'moment either side scores.',
    hoodColor:
      'It’s strongly Colombian and Ecuadorian with other Latin American communities mixed ' +
      'in, so the spots below are grouped by team. The 7, E, F, M, and R all get you there.',
    faq: [
      {
        q: 'Which teams does Jackson Heights support?',
        a: 'It skews strongly Colombian and Ecuadorian, with other Latin American communities too — a top spot for those teams’ matches.',
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
    'NYNJ World Cup maps watch parties at diaspora bars and venues across the NYC and New ' +
    'Jersey metro for the 2026 FIFA World Cup (June 11 – July 19, 2026).',
  intro:
    'Every nation in this tournament already has a home in this metro — a bar, a ' +
    'churrascaria, a cantina, a block — where its fans show up loud. We map them. Browse by ' +
    'country or neighborhood below, then open the live map to find a room near you and RSVP.',
};
