import { AIModelProvider, ModelInfo } from './AIModelProvider';
import { DebateContext } from '../models/DebateContext';

export interface LocalModelProviderConfig {
  baseUrl: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  apiFormat?: 'ollama' | 'openai-compatible';
}

/**
 * Local Model Provider for generating debate responses using locally hosted models.
 * Supports Ollama, LM Studio, and other OpenAI-compatible local model servers.
 */
export class LocalModelProvider implements AIModelProvider {
  private baseUrl: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;
  private timeout: number;
  private apiFormat: 'ollama' | 'openai-compatible';

  constructor(config: LocalModelProviderConfig) {
    if (!config.baseUrl) {
      throw new Error('Base URL is required for local model provider');
    }
    if (!config.model) {
      throw new Error('Model name is required for local model provider');
    }

    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.model = config.model;
    this.maxTokens = config.maxTokens || 1000;
    this.temperature = config.temperature || 0.7;
    this.timeout = config.timeout || 120000; // 2 minutes default for local models
    this.apiFormat = config.apiFormat || 'ollama';
  }

  /**
   * Generate a response using the local model API.
   */
  async generateResponse(prompt: string, context: DebateContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(prompt, context);

      if (this.apiFormat === 'ollama') {
        return await this.generateOllamaResponse(systemPrompt, userPrompt);
      } else {
        return await this.generateOpenAICompatibleResponse(systemPrompt, userPrompt);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Local model API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling local model API');
    }
  }

  /**
   * Generate response using Ollama API format.
   */
  private async generateOllamaResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as { response?: string };
      
      if (!data.response) {
        throw new Error('No response generated from local model');
      }

      return data.response.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during Ollama API call');
    }
  }

  /**
   * Generate response using OpenAI-compatible API format (LM Studio, etc.).
   */
  private async generateOpenAICompatibleResponse(systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No response generated from local model');
      }

      return content.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during OpenAI-compatible API call');
    }
  }

  /**
   * Get the name of this model.
   */
  getModelName(): string {
    return `Local-${this.model}`;
  }

  /**
   * Validate that the local model server is available.
   */
  async validateAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for health check

      let response: Response;

      if (this.apiFormat === 'ollama') {
        // Check Ollama health endpoint
        response = await fetch(`${this.baseUrl}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });
      } else {
        // Check OpenAI-compatible health endpoint
        response = await fetch(`${this.baseUrl}/v1/models`, {
          method: 'GET',
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models from the local model server.
   */
  async listAvailableModels(): Promise<ModelInfo[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let response: Response;

      if (this.apiFormat === 'ollama') {
        response = await fetch(`${this.baseUrl}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as { models?: Array<{ name: string; details?: { family?: string } }> };
        
        if (!data.models) {
          return [];
        }

        return data.models.map(model => ({
          id: model.name,
          name: model.name,
          description: model.details?.family ? `${model.details.family} model` : 'Local model',
          provider: 'ollama'
        }));
      } else {
        // OpenAI-compatible format
        response = await fetch(`${this.baseUrl}/v1/models`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as { data?: Array<{ id: string; object?: string }> };
        
        if (!data.data) {
          return [];
        }

        return data.data.map(model => ({
          id: model.id,
          name: model.id,
          description: 'Local model',
          provider: 'local'
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout while listing models');
        }
        throw new Error(`Failed to list local models: ${error.message}`);
      }
      throw new Error('Failed to list local models');
    }
  }

  /**
   * Generate a response using the local model streaming API.
   */
  async generateResponseStream(
    prompt: string,
    context: DebateContext,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const userPrompt = this.buildUserPrompt(prompt, context);

      if (this.apiFormat === 'ollama') {
        return await this.generateOllamaStreamResponse(systemPrompt, userPrompt, onChunk);
      } else {
        return await this.generateOpenAICompatibleStreamResponse(systemPrompt, userPrompt, onChunk);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Local model streaming API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling local model streaming API');
    }
  }

  /**
   * Generate streaming response using Ollama API format.
   */
  private async generateOllamaStreamResponse(
    systemPrompt: string,
    userPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: true,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body from Ollama');
      }

      let fullResponse = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as { response?: string; done?: boolean };
            if (data.response) {
              fullResponse += data.response;
              onChunk(data.response);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      if (!fullResponse) {
        throw new Error('No response generated from local model');
      }

      return fullResponse.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during Ollama streaming API call');
    }
  }

  /**
   * Generate streaming response using OpenAI-compatible API format.
   */
  private async generateOpenAICompatibleStreamResponse(
    systemPrompt: string,
    userPrompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: true,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body from local model');
      }

      let fullResponse = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() && line.startsWith('data: '));

        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      if (!fullResponse) {
        throw new Error('No response generated from local model');
      }

      return fullResponse.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      throw new Error('Unknown error during OpenAI-compatible streaming API call');
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
