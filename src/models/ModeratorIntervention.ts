import { Position } from './Position';

export enum InterventionType {
  WARNING = 'warning',
  CORRECTION = 'correction',
  PENALTY = 'penalty'
}

export interface ModeratorIntervention {
  type: InterventionType;
  target: Position;
  message: string;
  timestamp: Date;
}
