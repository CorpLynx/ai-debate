import { DebateTactic } from './DebateTactic';

export interface DebateRules {
  stayOnTopic: boolean;
  noPersonalAttacks: boolean;
  citeSources: boolean;
  timeLimit: number;
  wordLimit: number;
  allowedTactics: DebateTactic[];
  forbiddenTactics: DebateTactic[];
}
