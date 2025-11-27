import { Debate } from './Debate';

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
}

export enum OutputFormat {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json'
}
