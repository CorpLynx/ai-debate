import { AIModelProvider } from '../providers/AIModelProvider';
import { ModeratorStrictness } from './ModeratorStrictness';
import { DebateRules } from './DebateRules';
import { RuleViolation } from './RuleViolation';
import { Position } from './Position';

export interface ModeratorContext {
  moderatorModel: AIModelProvider;
  strictness: ModeratorStrictness;
  rules: DebateRules;
  violationHistory: Map<Position, RuleViolation[]>;
  interventionCount: Map<Position, number>;
}
