import { Debate } from './Debate';
import { AIModelProvider } from '../providers/AIModelProvider';
import { ModeratorContext } from './ModeratorContext';
import { PersonalityProfile } from './PersonalityProfile';
import { ModeratorCommentary } from './ModeratorCommentary';
import { RuleViolation } from './RuleViolation';
import { ModeratorIntervention } from './ModeratorIntervention';
import { Position } from './Position';

export interface EnhancedDebate extends Debate {
  moderatorEnabled: boolean;
  moderatorModel?: AIModelProvider;
  moderatorContext?: ModeratorContext;
  affirmativePersonality: PersonalityProfile;
  negativePersonality: PersonalityProfile;
  moderatorCommentary: ModeratorCommentary[];
  ruleViolations: Map<Position, RuleViolation[]>;
  interventions: ModeratorIntervention[];
}
