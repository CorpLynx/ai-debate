import { Position } from './Position';
import { RoundType } from './RoundType';
import { Statement } from './Statement';

export interface DebateContext {
  topic: string;
  position: Position;
  roundType: RoundType;
  previousStatements: Statement[];
  preparationMaterial?: string;
}
