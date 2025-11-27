import { Position } from './Position';

/**
 * Represents a progress bar for tracking preparation or generation progress
 */
export interface ProgressBar {
  id: string;
  label: string;
  percentage: number;
  statusPhrase: string;
  position: Position;
  startTime: Date;
}

/**
 * Predefined status phrases for cycling during progress display
 */
export const STATUS_PHRASES = [
  "Preparing arguments",
  "Researching sources",
  "Analyzing evidence",
  "Formalizing statements",
  "Structuring logic",
  "Reviewing counterarguments"
];
