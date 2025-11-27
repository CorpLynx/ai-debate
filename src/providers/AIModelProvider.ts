import { DebateContext } from '../models/DebateContext';

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export interface AIModelProvider {
  generateResponse(prompt: string, context: DebateContext): Promise<string>;
  getModelName(): string;
  validateAvailability(): Promise<boolean>;
  listAvailableModels(): Promise<ModelInfo[]>;
  
  // Streaming support
  generateResponseStream(
    prompt: string,
    context: DebateContext,
    onChunk: (chunk: string) => void
  ): Promise<string>;
  supportsStreaming(): boolean;
}
