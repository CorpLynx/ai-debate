import { DebateContext } from '../models/DebateContext';

export interface AIModelProvider {
  generateResponse(prompt: string, context: DebateContext): Promise<string>;
  getModelName(): string;
  validateAvailability(): Promise<boolean>;
}
