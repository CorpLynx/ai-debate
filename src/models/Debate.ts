import { DebateConfig } from './DebateConfig';
import { DebateState } from './DebateState';
import { DebateRound } from './DebateRound';
import { AIModelProvider } from '../providers/AIModelProvider';
import { DebateError } from './DebateError';
import { PersonalityProfile } from './PersonalityProfile';

export interface Debate {
  id: string;
  topic: string;
  config: DebateConfig;
  affirmativeModel: AIModelProvider;
  negativeModel: AIModelProvider;
  affirmativePersonality: PersonalityProfile;
  negativePersonality: PersonalityProfile;
  state: DebateState;
  rounds: DebateRound[];
  createdAt: Date;
  completedAt?: Date;
  errors?: DebateError[];
}
