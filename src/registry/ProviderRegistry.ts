import { ConfigurationManager, APIKeyConfig } from '../utils/ConfigurationManager';
import { OpenAIProvider, OpenAIProviderConfig } from '../providers/OpenAIProvider';
import { AnthropicProvider, AnthropicProviderConfig } from '../providers/AnthropicProvider';
import { LocalModelProvider, LocalModelProviderConfig } from '../providers/LocalModelProvider';
import { AIModelProvider, ModelInfo } from '../providers/AIModelProvider';

export interface ProviderInfo {
  type: string;
  name: string;
  description: string;
  isConfigured: boolean;
  requiresCredentials: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Re-export ModelInfo for convenience
export type { ModelInfo };

/**
 * Manages available AI providers and their configuration status.
 * Tracks which providers are installed and configured, validates credentials,
 * and provides provider metadata.
 */
export class ProviderRegistry {
  private configManager: ConfigurationManager;
  private apiKeys: APIKeyConfig;

  constructor(configPath?: string) {
    this.configManager = new ConfigurationManager();
    this.apiKeys = this.configManager.loadAndMergeAPIKeys({}, configPath);
  }

  /**
   * Get a list of all available provider types with their configuration status.
   * 
   * @returns Array of provider information including configuration status
   */
  getAvailableProviders(): ProviderInfo[] {
    return [
      {
        type: 'openai',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5, and other OpenAI models',
        isConfigured: this.isProviderConfigured('openai'),
        requiresCredentials: true
      },
      {
        type: 'anthropic',
        name: 'Anthropic',
        description: 'Claude 3 and other Anthropic models',
        isConfigured: this.isProviderConfigured('anthropic'),
        requiresCredentials: true
      },
      {
        type: 'ollama',
        name: 'Ollama',
        description: 'Local models via Ollama',
        isConfigured: this.isProviderConfigured('ollama'),
        requiresCredentials: false
      }
    ];
  }

  /**
   * Check if a provider is properly configured with necessary credentials.
   * 
   * @param providerType - The type of provider (e.g., 'openai', 'anthropic', 'ollama')
   * @returns True if the provider is configured and ready to use
   */
  isProviderConfigured(providerType: string): boolean {
    switch (providerType.toLowerCase()) {
      case 'openai':
        return !!(this.apiKeys.openaiApiKey || process.env.OPENAI_API_KEY);
      
      case 'anthropic':
        return !!(this.apiKeys.anthropicApiKey || process.env.ANTHROPIC_API_KEY);
      
      case 'ollama':
        // Ollama doesn't require credentials, just needs to be running
        // We consider it "configured" if it's a known provider type
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Validate that a provider is properly configured and can be used.
   * 
   * @param providerType - The type of provider to validate
   * @returns ValidationResult indicating if the provider is valid and any error message
   */
  validateProvider(providerType: string): ValidationResult {
    const normalizedType = providerType.toLowerCase();
    
    switch (normalizedType) {
      case 'openai':
        if (!this.isProviderConfigured('openai')) {
          return {
            isValid: false,
            error: 'OpenAI provider is not configured. Please set OPENAI_API_KEY environment variable or add openaiApiKey to .debaterc file.'
          };
        }
        return { isValid: true };
      
      case 'anthropic':
        if (!this.isProviderConfigured('anthropic')) {
          return {
            isValid: false,
            error: 'Anthropic provider is not configured. Please set ANTHROPIC_API_KEY environment variable or add anthropicApiKey to .debaterc file.'
          };
        }
        return { isValid: true };
      
      case 'ollama':
        // Ollama doesn't require credentials
        return { isValid: true };
      
      default:
        return {
          isValid: false,
          error: `Unknown provider type: ${providerType}`
        };
    }
  }

  /**
   * Create a provider instance for the given provider type and model.
   * 
   * @param providerType - The type of provider (e.g., 'openai', 'anthropic', 'ollama')
   * @param modelId - The model ID to use
   * @returns AIModelProvider instance
   * @throws Error if provider is not configured or invalid
   */
  createProvider(providerType: string, modelId: string): AIModelProvider {
    const validation = this.validateProvider(providerType);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const normalizedType = providerType.toLowerCase();

    switch (normalizedType) {
      case 'openai': {
        const apiKey = this.apiKeys.openaiApiKey || process.env.OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error('OpenAI API key not found');
        }
        const config: OpenAIProviderConfig = {
          apiKey,
          model: modelId
        };
        return new OpenAIProvider(config);
      }

      case 'anthropic': {
        const apiKey = this.apiKeys.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error('Anthropic API key not found');
        }
        const config: AnthropicProviderConfig = {
          apiKey,
          model: modelId
        };
        return new AnthropicProvider(config);
      }

      case 'ollama': {
        const config: LocalModelProviderConfig = {
          baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          model: modelId,
          apiFormat: 'ollama'
        };
        return new LocalModelProvider(config);
      }

      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }

  /**
   * Get available models for a specific provider.
   * 
   * @param providerType - The type of provider (e.g., 'openai', 'anthropic', 'ollama')
   * @returns Array of available models for the provider
   * @throws Error if provider is not configured or invalid
   */
  async getModelsForProvider(providerType: string): Promise<ModelInfo[]> {
    const validation = this.validateProvider(providerType);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const normalizedType = providerType.toLowerCase();

    // Create a temporary provider instance to list models
    // We use a default model just to instantiate the provider
    let tempProvider: AIModelProvider;

    try {
      switch (normalizedType) {
        case 'openai': {
          const apiKey = this.apiKeys.openaiApiKey || process.env.OPENAI_API_KEY;
          if (!apiKey) {
            throw new Error('OpenAI API key not found');
          }
          tempProvider = new OpenAIProvider({ apiKey, model: 'gpt-4' });
          break;
        }

        case 'anthropic': {
          const apiKey = this.apiKeys.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
          if (!apiKey) {
            throw new Error('Anthropic API key not found');
          }
          tempProvider = new AnthropicProvider({ apiKey, model: 'claude-3-5-sonnet-20241022' });
          break;
        }

        case 'ollama': {
          const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
          tempProvider = new LocalModelProvider({ baseUrl, model: 'llama2', apiFormat: 'ollama' });
          break;
        }

        default:
          throw new Error(`Unknown provider type: ${providerType}`);
      }

      // Attempt to list models with error handling
      const models = await tempProvider.listAvailableModels();
      
      // Handle case where provider returns empty list
      if (!models || models.length === 0) {
        throw new Error(`No models available from ${providerType}. Please check that the provider is running and accessible.`);
      }
      
      return models;
    } catch (error) {
      // Enhance error messages with recovery suggestions
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Network/connection errors
        if (message.includes('fetch') || message.includes('network') || message.includes('econnrefused') || message.includes('timeout')) {
          if (normalizedType === 'ollama') {
            throw new Error(`Failed to connect to Ollama server. Please ensure Ollama is running at ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}. You can start it with: ollama serve`);
          } else {
            throw new Error(`Failed to connect to ${providerType} API. Please check your internet connection and try again.`);
          }
        }
        
        // Authentication errors
        if (message.includes('401') || message.includes('403') || message.includes('unauthorized') || message.includes('api key')) {
          throw new Error(`Authentication failed for ${providerType}. Please verify your API key is correct and has the necessary permissions.`);
        }
        
        // Rate limiting
        if (message.includes('429') || message.includes('rate limit')) {
          throw new Error(`Rate limit exceeded for ${providerType}. Please wait a moment and try again.`);
        }
        
        // Server errors
        if (message.includes('500') || message.includes('502') || message.includes('503')) {
          throw new Error(`${providerType} service is temporarily unavailable. Please try again in a few moments.`);
        }
        
        // Re-throw with original message if no specific handling
        throw error;
      }
      
      throw new Error(`Failed to fetch models from ${providerType}: Unknown error occurred`);
    }
  }

  /**
   * Get a random model from a specific provider.
   * 
   * @param providerType - The type of provider (e.g., 'openai', 'anthropic', 'ollama')
   * @returns A randomly selected model from the provider
   * @throws Error if provider has no available models or is not configured
   */
  async getRandomModel(providerType: string): Promise<ModelInfo> {
    try {
      const models = await this.getModelsForProvider(providerType);
      
      if (!models || models.length === 0) {
        throw new Error(`No models available for random selection from ${providerType}. Please select a specific model or choose a different provider.`);
      }

      // Use cryptographically secure random selection
      const randomIndex = Math.floor(Math.random() * models.length);
      return models[randomIndex];
    } catch (error) {
      // If getModelsForProvider already threw a detailed error, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to get random model from ${providerType}: Unknown error occurred`);
    }
  }

  /**
   * Reload API keys from configuration sources.
   * Useful when configuration has changed.
   * 
   * @param configPath - Optional path to config file
   */
  reloadAPIKeys(configPath?: string): void {
    this.apiKeys = this.configManager.loadAndMergeAPIKeys({}, configPath);
  }
}
