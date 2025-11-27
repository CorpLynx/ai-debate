import { ProviderRegistry } from '../../src/registry/ProviderRegistry';

describe('ProviderRegistry Error Handling', () => {
  describe('getModelsForProvider', () => {
    it('should throw descriptive error when provider is not configured', async () => {
      const registry = new ProviderRegistry();
      
      // Try to get models from unconfigured provider
      await expect(registry.getModelsForProvider('openai')).rejects.toThrow(
        /OpenAI provider is not configured/
      );
    });

    it('should throw descriptive error for unknown provider type', async () => {
      const registry = new ProviderRegistry();
      
      await expect(registry.getModelsForProvider('unknown-provider')).rejects.toThrow(
        /Unknown provider type/
      );
    });
  });

  describe('getRandomModel', () => {
    it('should throw descriptive error when provider is not configured', async () => {
      const registry = new ProviderRegistry();
      
      await expect(registry.getRandomModel('anthropic')).rejects.toThrow(
        /Anthropic provider is not configured/
      );
    });

    it('should throw descriptive error for unknown provider type', async () => {
      const registry = new ProviderRegistry();
      
      await expect(registry.getRandomModel('invalid')).rejects.toThrow(
        /Unknown provider type/
      );
    });
  });

  describe('validateProvider', () => {
    it('should return validation error with helpful message for unconfigured OpenAI', () => {
      const registry = new ProviderRegistry();
      
      const result = registry.validateProvider('openai');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('OpenAI provider is not configured');
      expect(result.error).toContain('OPENAI_API_KEY');
    });

    it('should return validation error with helpful message for unconfigured Anthropic', () => {
      const registry = new ProviderRegistry();
      
      const result = registry.validateProvider('anthropic');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Anthropic provider is not configured');
      expect(result.error).toContain('ANTHROPIC_API_KEY');
    });

    it('should return validation error for unknown provider', () => {
      const registry = new ProviderRegistry();
      
      const result = registry.validateProvider('unknown');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown provider type');
    });

    it('should validate ollama provider successfully without credentials', () => {
      const registry = new ProviderRegistry();
      
      const result = registry.validateProvider('ollama');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
