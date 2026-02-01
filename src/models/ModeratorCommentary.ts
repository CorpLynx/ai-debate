import { RoundType } from './RoundType';
import { TacticIdentification } from './TacticIdentification';
import { FallacyDetection } from './FallacyDetection';

export interface ModeratorCommentary {
  roundType: RoundType;
  introduction?: string;
  roundSummary?: string;
  tacticalAnalysis?: TacticIdentification[];
  fallacyReport?: FallacyDetection[];
  timestamp: Date;
}
