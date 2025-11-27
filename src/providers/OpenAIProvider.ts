import OpenAI from 'openai';
import { AIModelProvider, ModelInfo } from './AIModelProvider';
import { DebateContext } from '../models/DebateContext';

export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  maxRetries?: number;
}

/**
 * OpenAI Provider for generating debate responses using OpenAI's API.
 * Supports GPT-4, GPT-3.5, and other OpenAI models.
 */
export class OpenAIProvider implements AIModelProvider {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private timeout: number;
  private maxRetries: number;

  constructor(config: OpenAIProviderConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 60000, // 60 seconds default
      maxRetries: config.maxRetries || 2,
    });

    this.model = config.model || 'gpt-4';
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 60000;
    this.maxRetries = config.maxRetries || 2;
  }

  /**
   * Generate a response using OpenAI's API.
   */
  async generateResponse(prompt: string, context: DebateContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(prompt, context);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI API');
    }
  }

  /**
   * Get the name of this model.
   */
  getModelName(): string {
    return `OpenAI-${this.model}`;
  }

  /**
   * Validate that the OpenAI API is available and credentials are valid.
   */
  async validateAvailability(): Promise<boolean> {
    try {
      // Make a minimal API call to verify credentials
      await this.client.models.retrieve(this.model);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models from OpenAI.
   */
  async listAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.client.models.list();
      const models: ModelInfo[] = [];

      // Filter for chat models and map to ModelInfo
      for await (const model of response) {
        // Only include GPT models suitable for chat
        if (model.id.includes('gpt')) {
          models.push({
            id: model.id,
            name: model.id,
            description: this.getModelDescription(model.id),
            provider: 'openai'
          });
        }
      }

      // Sort by model name for consistent ordering
      return models.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to list OpenAI models: ${error.message}`);
      }
      throw new Error('Failed to list OpenAI models');
    }
  }

  /**
   * Generate a response using OpenAI's streaming API.
   */
  async generateResponseStream(
    prompt: string,
    context: DebateContext,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(prompt, context);

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      if (!fullResponse) {
        throw new Error('No response generated from OpenAI');
      }

      return fullResponse.trim();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI streaming API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI streaming API');
    }
  }

  /**
   * Check if this provider supports streaming.
   */
  supportsStreaming(): boolean {
    return true;
  }

  /**
   * Get a human-readable description for a model.
   */
  private getModelDescription(modelId: string): string {
    if (modelId.includes('gpt-4')) {
      return 'Advanced reasoning and complex task handling';
    } else if (modelId.includes('gpt-3.5')) {
      return 'Fast and efficient for most tasks';
    }
    return 'OpenAI language model';
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
