import { DebateState } from './DebateState';
import { RoundType } from './RoundType';

/**
 * Represents an error that occurred during a debate
 */
export interface DebateError {
  timestamp: Date;
  message: string;
  state: DebateState;
  round?: RoundType;
  model?: string;
  originalError?: Error;
}
