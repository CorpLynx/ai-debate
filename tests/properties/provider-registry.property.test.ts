import * as fc from 'fast-check';
import { ProviderRegistry } from '../../src/registry/ProviderRegistry';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Provider Registry Properties', () => {
  let tempDir: string;
  let tempConfigPath: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Create a temporary directory for test config files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'provider-registry-test-'));
    tempConfigPath = path.join(tempDir, '.debaterc');
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up temporary files
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  // Feature: interactive-mode, Property 2: Provider configuration status is accurate
  // Validates: Requirements 2.2
  it('should accurately report provider configuration status based on credentials', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasOpenAIKey: fc.boolean(),
          hasAnthropicKey: fc.boolean(),
          useEnv: fc.boolean() // Whether to use env vars or config file
        }),
        (testCase) => {
          // Clear environment variables
          delete process.env.OPENAI_API_KEY;
          delete process.env.ANTHROPIC_API_KEY;

          if (testCase.useEnv) {
            // Set environment variables
            if (testCase.hasOpenAIKey) {
              process.env.OPENAI_API_KEY = 'test-openai-key';
            }
            if (testCase.hasAnthropicKey) {
              process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
            }
          } else {
            // Write to config file
            const config: any = {};
            if (testCase.hasOpenAIKey) {
              config.openaiApiKey = 'test-openai-key';
            }
            if (testCase.hasAnthropicKey) {
              config.anthropicApiKey = 'test-anthropic-key';
            }
            fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
          }

          // Create registry
          const registry = new ProviderRegistry(testCase.useEnv ? undefined : tempConfigPath);

          // Get available providers
          const providers = registry.getAvailableProviders();

          // Find each provider
          const openaiProvider = providers.find(p => p.type === 'openai');
          const anthropicProvider = providers.find(p => p.type === 'anthropic');
          const ollamaProvider = providers.find(p => p.type === 'ollama');

          // Verify OpenAI configuration status matches credential availability
          expect(openaiProvider).toBeDefined();
          expect(openaiProvider!.isConfigured).toBe(testCase.hasOpenAIKey);

          // Verify Anthropic configuration status matches credential availability
          expect(anthropicProvider).toBeDefined();
          expect(anthropicProvider!.isConfigured).toBe(testCase.hasAnthropicKey);

          // Verify Ollama is always configured (no credentials required)
          expect(ollamaProvider).toBeDefined();
          expect(ollamaProvider!.isConfigured).toBe(true);

          // Also verify isProviderConfigured method
          expect(registry.isProviderConfigured('openai')).toBe(testCase.hasOpenAIKey);
          expect(registry.isProviderConfigured('anthropic')).toBe(testCase.hasAnthropicKey);
          expect(registry.isProviderConfigured('ollama')).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Configuration status should be case-insensitive
  it('should handle case-insensitive provider type checks', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('openai', 'OpenAI', 'OPENAI', 'OpEnAi'),
        (providerType) => {
          // Set up OpenAI credentials
          process.env.OPENAI_API_KEY = 'test-key';
          
          const registry = new ProviderRegistry();
          
          // Should work regardless of case
          expect(registry.isProviderConfigured(providerType)).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  // Additional test: Unknown providers should not be configured
  it('should return false for unknown provider types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !['openai', 'anthropic', 'ollama'].includes(s.toLowerCase())),
        (unknownProvider) => {
          const registry = new ProviderRegistry();
          
          // Unknown providers should not be configured
          expect(registry.isProviderConfigured(unknownProvider)).toBe(false);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 3: Provider validation is correct
  // Validates: Requirements 2.3
  it('should fail validation when provider lacks valid credentials', () => {
    fc.assert(
      fc.property(
        fc.record({
          provider: fc.constantFrom('openai', 'anthropic'),
          hasCredentials: fc.boolean()
        }),
        (testCase) => {
          // Clear environment variables
          delete process.env.OPENAI_API_KEY;
          delete process.env.ANTHROPIC_API_KEY;

          if (testCase.hasCredentials) {
            // Set credentials for the provider
            if (testCase.provider === 'openai') {
              process.env.OPENAI_API_KEY = 'test-key';
            } else if (testCase.provider === 'anthropic') {
              process.env.ANTHROPIC_API_KEY = 'test-key';
            }
          }

          const registry = new ProviderRegistry();
          const validation = registry.validateProvider(testCase.provider);

          if (testCase.hasCredentials) {
            // Should be valid when credentials exist
            expect(validation.isValid).toBe(true);
            expect(validation.error).toBeUndefined();
          } else {
            // Should fail validation when credentials are missing
            expect(validation.isValid).toBe(false);
            expect(validation.error).toBeDefined();
            expect(validation.error).toContain(testCase.provider === 'openai' ? 'OpenAI' : 'Anthropic');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Ollama should always validate successfully
  it('should always validate ollama provider successfully', () => {
    const registry = new ProviderRegistry();
    const validation = registry.validateProvider('ollama');

    expect(validation.isValid).toBe(true);
    expect(validation.error).toBeUndefined();
  });

  // Additional test: Unknown providers should fail validation
  it('should fail validation for unknown provider types', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !['openai', 'anthropic', 'ollama'].includes(s.toLowerCase())),
        (unknownProvider) => {
          const registry = new ProviderRegistry();
          const validation = registry.validateProvider(unknownProvider);

          // Unknown providers should fail validation
          expect(validation.isValid).toBe(false);
          expect(validation.error).toBeDefined();
          expect(validation.error).toContain('Unknown provider type');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 5: Model lists include required information
  // Validates: Requirements 3.2
  it('should include name and description for all models in provider lists', async () => {
    // Set up credentials for Anthropic (doesn't require API call)
    process.env.ANTHROPIC_API_KEY = 'test-key';
    
    const registry = new ProviderRegistry();
    
    // Test with Anthropic since it returns a static list
    const models = await registry.getModelsForProvider('anthropic');
    
    // Verify all models have required fields
    expect(models.length).toBeGreaterThan(0);
    
    for (const model of models) {
      expect(model.id).toBeDefined();
      expect(typeof model.id).toBe('string');
      expect(model.id.length).toBeGreaterThan(0);
      
      expect(model.name).toBeDefined();
      expect(typeof model.name).toBe('string');
      expect(model.name.length).toBeGreaterThan(0);
      
      expect(model.description).toBeDefined();
      expect(typeof model.description).toBe('string');
      expect(model.description.length).toBeGreaterThan(0);
      
      expect(model.provider).toBeDefined();
      expect(typeof model.provider).toBe('string');
    }
  });

  // Feature: interactive-mode, Property 6: Random option is always available
  // Validates: Requirements 3.3
  it('should provide random model selection for any provider with models', async () => {
    // Set up credentials for Anthropic
    process.env.ANTHROPIC_API_KEY = 'test-key';
    
    const registry = new ProviderRegistry();
    
    // Get models for Anthropic
    const models = await registry.getModelsForProvider('anthropic');
    
    // If provider has at least one model, random selection should work
    if (models.length > 0) {
      const randomModel = await registry.getRandomModel('anthropic');
      
      // Random model should be one of the available models
      expect(randomModel).toBeDefined();
      expect(models.some(m => m.id === randomModel.id)).toBe(true);
    }
  });

  // Feature: interactive-mode, Property 7: Random selection returns valid model
  // Validates: Requirements 3.4
  it('should return a valid model from the provider when selecting randomly', async () => {
    // Set up credentials for Anthropic
    process.env.ANTHROPIC_API_KEY = 'test-key';
    
    const registry = new ProviderRegistry();
    
    // Get available models
    const availableModels = await registry.getModelsForProvider('anthropic');
    expect(availableModels.length).toBeGreaterThan(0);
    
    // Test multiple random selections
    for (let i = 0; i < 10; i++) {
      const randomModel = await registry.getRandomModel('anthropic');
      
      // Verify the random model is in the available models list
      const isValid = availableModels.some(m => 
        m.id === randomModel.id && 
        m.name === randomModel.name &&
        m.provider === randomModel.provider
      );
      
      expect(isValid).toBe(true);
    }
  });
});
