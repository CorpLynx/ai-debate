import { Position } from './Position';
import { RoundType } from './RoundType';

export enum CitationType {
  URL = 'url',
  ACADEMIC = 'academic',
  BOOK = 'book',
  ARTICLE = 'article',
  GENERAL = 'general'
}

export interface Citation {
  id: string;
  text: string;
  type: CitationType;
  url?: string;
  author?: string;
  title?: string;
  source?: string;
  year?: number;
  extractedFrom: {
    model: string;
    position: Position;
    round: RoundType;
  };
}

export interface CitationPattern {
  pattern: RegExp;
  type: CitationType;
  extractor: (match: RegExpMatchArray) => Partial<Citation>;
}
