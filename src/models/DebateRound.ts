import { RoundType } from './RoundType';
import { Statement } from './Statement';

export interface DebateRound {
  type: RoundType;
  affirmativeStatement?: Statement;
  negativeStatement?: Statement;
  timestamp: Date;
}
