import { Statement } from './Statement';
import { RuleViolation } from './RuleViolation';
import { TacticIdentification } from './TacticIdentification';
import { FallacyDetection } from './FallacyDetection';

export interface ModeratorReview {
  statement: Statement;
  violations: RuleViolation[];
  tacticsIdentified: TacticIdentification[];
  fallaciesDetected: FallacyDetection[];
  requiresIntervention: boolean;
  commentary?: string;
}
