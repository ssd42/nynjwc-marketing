// Types for the marketing site's own landing-page content — the country
// ticker and the country grid in src/data.ts.
//
// The phone preview does NOT use these: it renders the real app screens,
// which carry the full app domain model from `@/types/domain`. See
// src/landing/fixtures.ts.

// All 48 nations in the 2026 World Cup field. Must stay a subset of the
// app's `CountryCode` (@/types/domain) so country data flows into the real
// preview components.
export type CountryCode =
  | 'BRA'
  | 'ARG'
  | 'POR'
  | 'COL'
  | 'ECU'
  | 'MEX'
  | 'FRA'
  | 'USA'
  | 'KOR'
  | 'CRO'
  | 'JPN'
  | 'ENG'
  | 'SEN'
  | 'GER'
  | 'MAR'
  | 'ESP'
  | 'NED'
  | 'NOR'
  | 'BEL'
  | 'SUI'
  | 'URU'
  | 'TUR'
  | 'SWE'
  | 'AUT'
  | 'SCO'
  | 'CAN'
  | 'CZE'
  | 'CIV'
  | 'GHA'
  | 'EGY'
  | 'PAR'
  | 'ALG'
  | 'BIH'
  | 'AUS'
  | 'TUN'
  | 'IRN'
  | 'COD'
  | 'RSA'
  | 'CPV'
  | 'KSA'
  | 'PAN'
  | 'UZB'
  | 'QAT'
  | 'NZL'
  | 'IRQ'
  | 'HAI'
  | 'CUW'
  | 'JOR';

export interface FlagPalette {
  primary: string;
  secondary: string;
  tertiary: string;
}

export interface Venue {
  name: string;
  type: string;
  hood: string;
  distance: string;
  rsvps: number;
  friends: number;
  photo: string;
  lat: number;
  lng: number;
}

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  colors: FlagPalette;
  tagline: string;
  neighborhoods: string[];
  venues: Venue[];
}
