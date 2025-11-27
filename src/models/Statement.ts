import { Position } from './Position';

export interface Statement {
  model: string;
  position: Position;
  content: string;
  wordCount: number;
  generatedAt: Date;
}
