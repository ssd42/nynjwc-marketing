export type CountryCode =
  | 'USA'
  | 'BRA'
  | 'FRA'
  | 'ARG'
  | 'POR'
  | 'ECU'
  | 'MEX'
  | 'COL'
  | 'KOR'
  | 'CRO'
  | 'POL'
  | 'JPN'
  | 'ENG'
  | 'SEN'
  | 'GER'
  | 'MAR';

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

export interface Match {
  id: string;
  home: CountryCode;
  away: CountryCode;
  time: string;
  stage: string;
  stadium: string;
  live: boolean;
  minute?: number;
  score?: string;
}

export interface Friend {
  name: string;
  tint: string;
}

export type Variant = 'editorial' | 'minimal' | 'sporty';

export type ScreenKey = 'home' | 'country' | 'map' | 'follow' | 'saved';

export interface NotificationPrefs {
  matchStart: boolean;
  goals: boolean;
  newSpots: boolean;
  friendsGoing: boolean;
}
