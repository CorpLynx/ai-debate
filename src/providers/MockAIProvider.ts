import { AIModelProvider } from './AIModelProvider';
import { DebateContext } from '../models/DebateContext';

/**
 * Mock AI Provider for testing purposes.
 * Returns configurable responses based on the provided configuration.
 */
export class MockAIProvider implements AIModelProvider {
  private modelName: string;
  private responses: Map<string, string>;
  private defaultResponse: string;
  private available: boolean;
  private shouldFail: boolean;
  private failureMessage: string;
  private delayMs: number;
  private callCount: number;

  constructor(
    modelName: string = 'MockModel',
    options: {
      responses?: Map<string, string>;
      defaultResponse?: string;
      available?: boolean;
      shouldFail?: boolean;
      failureMessage?: string;
      delayMs?: number;
    } = {}
  ) {
    this.modelName = modelName;
    this.responses = options.responses || new Map();
    this.defaultResponse = options.defaultResponse || `Mock response from ${modelName}`;
    this.available = options.available !== undefined ? options.available : true;
    this.shouldFail = options.shouldFail || false;
    this.failureMessage = options.failureMessage || 'Mock provider failure';
    this.delayMs = options.delayMs || 0;
    this.callCount = 0;
  }

  /**
   * Generate a response based on the prompt and context.
   * Returns a configured response if available, otherwise returns the default response.
   */
  async generateResponse(prompt: string, context: DebateContext): Promise<string> {
    this.callCount++;
    
    // Simulate delay if configured
    if (this.delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delayMs));
    }
    
    if (this.shouldFail) {
      throw new Error(this.failureMessage);
    }

    // Check if there's a specific response configured for this prompt
    if (this.responses.has(prompt)) {
      return this.responses.get(prompt)!;
    }

    // Check if there's a response configured for this round type
    const roundTypeKey = `${context.roundType}`;
    if (this.responses.has(roundTypeKey)) {
      return this.responses.get(roundTypeKey)!;
    }

    // Check if there's a response configured for this position
    const positionKey = `${context.position}`;
    if (this.responses.has(positionKey)) {
      return this.responses.get(positionKey)!;
    }

    // Return default response
    return this.defaultResponse;
  }

  /**
   * Get the name of this model.
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Validate that this provider is available.
   */
  async validateAvailability(): Promise<boolean> {
    return this.available;
  }

  /**
   * Configure a specific response for a given key (prompt, round type, or position).
   */
  setResponse(key: string, response: string): void {
    this.responses.set(key, response);
  }

  /**
   * Set the default response for this provider.
   */
  setDefaultResponse(response: string): void {
    this.defaultResponse = response;
  }

  /**
   * Set whether this provider should be available.
   */
  setAvailable(available: boolean): void {
    this.available = available;
  }

  /**
   * Configure this provider to fail on the next generateResponse call.
   */
  setShouldFail(shouldFail: boolean, failureMessage?: string): void {
    this.shouldFail = shouldFail;
    if (failureMessage) {
      this.failureMessage = failureMessage;
    }
  }

  /**
   * Set the delay in milliseconds for generateResponse calls.
   */
  setDelay(delayMs: number): void {
    this.delayMs = delayMs;
  }

  /**
   * Get the number of times generateResponse has been called.
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Reset the call count.
   */
  resetCallCount(): void {
    this.callCount = 0;
  }

  /**
   * Reset this provider to its initial state.
   */
  reset(): void {
    this.responses.clear();
    this.shouldFail = false;
    this.available = true;
    this.delayMs = 0;
    this.callCount = 0;
  }
}
