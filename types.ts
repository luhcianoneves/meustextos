
export interface BibleCitation {
  reference: string;
  text: string;
}

export interface TextVersion {
  timestamp: number;
  title: string;
  body: string;
}

export interface TextEntry {
  id: string;
  originalTitle: string;
  originalBody: string;
  correctedTitle: string;
  correctedBody: string;
  summary: string; // New: Executive summary
  tags: string[];
  bibleCitations: BibleCitation[];
  creationDate: string;
  savedAt: number;
  isFavorite: boolean; // New: Favorites
  collectionId?: string; // New: For "Estudos" grouping
  versions: TextVersion[]; // New: History
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface ProcessedContent {
  correctedTitle: string;
  correctedBody: string;
  summary: string;
  tags: string[];
  bibleCitations: BibleCitation[];
}

export interface Stats {
  totalWords: number;
  totalTexts: number;
  topTags: { tag: string; count: number }[];
  textsPerMonth: { month: string; count: number }[];
}

export interface Slide {
  title: string;
  points: string[];
}

export enum ViewState {
  LOGIN = 'LOGIN',
  EDITOR = 'EDITOR',
  LIBRARY = 'LIBRARY',
  STATS = 'STATS',
  IMPORT = 'IMPORT'
}

export interface SupabaseConfig {
  url: string;
  key: string;
  isEnabled: boolean;
  email?: string;
  password?: string;
  geminiApiKey?: string;
}
