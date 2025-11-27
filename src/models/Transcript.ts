import { Debate } from './Debate';
import { Citation } from './Citation';

export interface TranscriptSummary {
  topic: string;
  models: { affirmative: string; negative: string };
  totalDuration: number;
  roundCount: number;
}

export interface FormattedRound {
  roundType: string;
  affirmativeContent?: string;
  negativeContent?: string;
  timestamp: Date;
}

export interface Transcript {
  debate: Debate;
  formattedRounds: FormattedRound[];
  summary: TranscriptSummary;
  citations?: Citation[];
}

export enum OutputFormat {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json'
}
