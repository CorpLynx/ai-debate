import Anthropic from '@anthropic-ai/sdk';
import { AIModelProvider, ModelInfo } from './AIModelProvider';
import { DebateContext } from '../models/DebateContext';

export interface AnthropicProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Anthropic Provider for generating debate responses using Anthropic's Claude API.
 * Supports Claude 3 and other Anthropic models.
 */
export class AnthropicProvider implements AIModelProvider {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private timeout: number;
  private maxRetries: number;

  constructor(config: AnthropicProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeout || 60000, // 60 seconds default
      maxRetries: config.maxRetries || 2,
    });

    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 60000;
    this.maxRetries = config.maxRetries || 2;
  }

  /**
   * Generate a response using Anthropic's API.
   */
  async generateResponse(prompt: string, context: DebateContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(prompt, context);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      });

      const response = message.content[0];
      if (response.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return response.text.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling Anthropic API');
    }
  }

  /**
   * Get the name of this model.
   */
  getModelName(): string {
    return `Anthropic-${this.model}`;
  }

  /**
   * Validate that the Anthropic API is available and credentials are valid.
   */
  async validateAvailability(): Promise<boolean> {
    try {
      // Make a minimal API call to verify credentials
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models from Anthropic.
   * Note: Anthropic doesn't provide a models list API, so we return a curated list.
   */
  async listAvailableModels(): Promise<ModelInfo[]> {
    // Anthropic doesn't have a public API to list models, so we maintain a curated list
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model, best for complex tasks',
        provider: 'anthropic'
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fastest model, best for quick responses',
        provider: 'anthropic'
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Powerful model for complex reasoning',
        provider: 'anthropic'
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        provider: 'anthropic'
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fast and efficient',
        provider: 'anthropic'
      }
    ];
  }

  /**
   * Generate a response using Anthropic's streaming API.
   */
  async generateResponseStream(
    prompt: string,
    context: DebateContext,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(prompt, context);

      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const content = chunk.delta.text;
          fullResponse += content;
          onChunk(content);
        }
      }

      if (!fullResponse) {
        throw new Error('No response generated from Anthropic');
      }

      return fullResponse.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic streaming API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling Anthropic streaming API');
    }
  }

  /**
   * Check if this provider supports streaming.
   */
  supportsStreaming(): boolean {
    return true;
  }

  /**
   * Build the system prompt based on the debate context.
   */
  private buildSystemPrompt(context: DebateContext): string {
    const positionText = context.position === 'affirmative' 
      ? 'in favor of' 
      : 'against';
    
    let systemPrompt = `You are participating in a formal debate. You are arguing ${positionText} the topic: "${context.topic}".

Your role is to present well-reasoned arguments, use evidence and logic, and engage constructively with opposing viewpoints.

Current round: ${context.roundType}
Your position: ${context.position}

Debate guidelines:
- Present clear, logical arguments
- Use evidence and reasoning to support your points
- Address counterarguments thoughtfully
- Maintain a respectful and professional tone
- Stay focused on the topic`;

    if (context.preparationMaterial) {
      systemPrompt += `\n\nYour preparation materials:\n${context.preparationMaterial}`;
    }

    return systemPrompt;
  }

  /**
   * Build the user prompt including previous statements for context.
   */
  private buildUserPrompt(prompt: string, context: DebateContext): string {
    let userPrompt = '';

    // Include previous statements for context
    if (context.previousStatements.length > 0) {
      userPrompt += 'Previous statements in this debate:\n\n';
      for (const statement of context.previousStatements) {
        userPrompt += `[${statement.position.toUpperCase()} - ${statement.model}]:\n${statement.content}\n\n`;
      }
      userPrompt += '---\n\n';
    }

    userPrompt += prompt;

    return userPrompt;
  }
}
