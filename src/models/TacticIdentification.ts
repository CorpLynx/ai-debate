import { DebateTactic } from './DebateTactic';

export interface TacticIdentification {
  tactic: DebateTactic;
  description: string;
  effectiveness: string;  // moderator's assessment
}
