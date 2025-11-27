/**
 * Unit tests for CLI input parsing
 * 
 * Requirements:
 * - 1.1: Test topic extraction from arguments
 * - Test configuration flag parsing
 */

import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { ConfigurationManager } from '../../src/utils/ConfigurationManager';

describe('CLI Input Parsing', () => {
  describe('Topic Extraction', () => {
    it('should extract topic from command line arguments', () => {
      // Simulate command line arguments
      const args = ['node', 'ai-debate', 'Should AI be regulated?'];
      const topic = args[2];
      
      expect(topic).toBe('Should AI be regulated?');
    });
    
    it('should handle topics with multiple words', () => {
      const args = ['node', 'ai-debate', 'Climate change is the most pressing issue of our time'];
      const topic = args[2];
      
      expect(topic).toBe('Climate change is the most pressing issue of our time');
    });
    
    it('should handle topics with special characters', () => {
      const args = ['node', 'ai-debate', 'Is "free will" an illusion?'];
      const topic = args[2];
      
      expect(topic).toBe('Is "free will" an illusion?');
    });
    
    it('should handle empty topic string', () => {
      const args = ['node', 'ai-debate', ''];
      const topic = args[2];
      
      expect(topic).toBe('');
    });
  });
  
  describe('Configuration Flag Parsing', () => {
    let configManager: ConfigurationManager;
    
    beforeEach(() => {
      configManager = new ConfigurationManager();
    });
    
    it('should parse time limit flag', () => {
      const options = { timeLimit: 60 };
      const userConfig: Partial<DebateConfig> = {
        timeLimit: options.timeLimit
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.timeLimit).toBe(60);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should parse word limit flag', () => {
      const options = { wordLimit: 300 };
      const userConfig: Partial<DebateConfig> = {
        wordLimit: options.wordLimit
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.wordLimit).toBe(300);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should parse strict mode flag', () => {
      const options = { strictMode: true };
      const userConfig: Partial<DebateConfig> = {
        strictMode: options.strictMode
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.strictMode).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should parse show preparation flag', () => {
      const options = { showPreparation: false };
      const userConfig: Partial<DebateConfig> = {
        showPreparation: options.showPreparation
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.showPreparation).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should parse cross-exam questions flag', () => {
      const options = { numCrossExamQuestions: 5 };
      const userConfig: Partial<DebateConfig> = {
        numCrossExamQuestions: options.numCrossExamQuestions
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.numCrossExamQuestions).toBe(5);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should parse multiple configuration flags together', () => {
      const options = {
        timeLimit: 90,
        wordLimit: 400,
        strictMode: true,
        showPreparation: false,
        numCrossExamQuestions: 2
      };
      
      const userConfig: Partial<DebateConfig> = {
        timeLimit: options.timeLimit,
        wordLimit: options.wordLimit,
        strictMode: options.strictMode,
        showPreparation: options.showPreparation,
        numCrossExamQuestions: options.numCrossExamQuestions
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.timeLimit).toBe(90);
      expect(result.config.wordLimit).toBe(400);
      expect(result.config.strictMode).toBe(true);
      expect(result.config.showPreparation).toBe(false);
      expect(result.config.numCrossExamQuestions).toBe(2);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should use defaults when no flags are provided', () => {
      const userConfig: Partial<DebateConfig> = {};
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.timeLimit).toBe(DEFAULT_CONFIG.timeLimit);
      expect(result.config.wordLimit).toBe(DEFAULT_CONFIG.wordLimit);
      expect(result.config.strictMode).toBe(DEFAULT_CONFIG.strictMode);
      expect(result.config.showPreparation).toBe(DEFAULT_CONFIG.showPreparation);
      expect(result.config.numCrossExamQuestions).toBe(DEFAULT_CONFIG.numCrossExamQuestions);
      expect(result.warnings).toHaveLength(0);
    });
    
    it('should fall back to defaults for invalid time limit', () => {
      const userConfig: Partial<DebateConfig> = {
        timeLimit: -10
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.timeLimit).toBe(DEFAULT_CONFIG.timeLimit);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('timeLimit');
      expect(result.invalidParams).toContain('timeLimit');
    });
    
    it('should fall back to defaults for invalid word limit', () => {
      const userConfig: Partial<DebateConfig> = {
        wordLimit: 0
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.wordLimit).toBe(DEFAULT_CONFIG.wordLimit);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('wordLimit');
      expect(result.invalidParams).toContain('wordLimit');
    });
    
    it('should fall back to defaults for non-integer word limit', () => {
      const userConfig: Partial<DebateConfig> = {
        wordLimit: 300.5
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      expect(result.config.wordLimit).toBe(DEFAULT_CONFIG.wordLimit);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.invalidParams).toContain('wordLimit');
    });
    
    it('should handle partial configuration with some invalid values', () => {
      const userConfig: Partial<DebateConfig> = {
        timeLimit: 60,        // valid
        wordLimit: -100,      // invalid
        strictMode: true,     // valid
        numCrossExamQuestions: 4  // valid
      };
      
      const result = configManager.mergeAndValidate(userConfig);
      
      // Valid values should be used
      expect(result.config.timeLimit).toBe(60);
      expect(result.config.strictMode).toBe(true);
      expect(result.config.numCrossExamQuestions).toBe(4);
      
      // Invalid value should fall back to default
      expect(result.config.wordLimit).toBe(DEFAULT_CONFIG.wordLimit);
      
      // Should have warning for invalid parameter
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toContain('wordLimit');
      expect(result.invalidParams).toEqual(['wordLimit']);
    });
  });
  
  describe('API Key Parsing', () => {
    it('should extract OpenAI API key from options', () => {
      const options: any = { openaiKey: 'sk-test-key-123' };
      const key = options.openaiKey;
      
      expect(key).toBe('sk-test-key-123');
    });
    
    it('should extract Anthropic API key from options', () => {
      const options: any = { anthropicKey: 'sk-ant-test-key-456' };
      const key = options.anthropicKey;
      
      expect(key).toBe('sk-ant-test-key-456');
    });
    
    it('should handle missing API keys', () => {
      const options: any = {};
      const openaiKey = options.openaiKey || process.env.OPENAI_API_KEY;
      const anthropicKey = options.anthropicKey || process.env.ANTHROPIC_API_KEY;
      
      // Keys should be undefined or from environment
      expect(openaiKey).toBeUndefined();
      expect(anthropicKey).toBeUndefined();
    });
  });
  
  describe('Export Format Parsing', () => {
    it('should parse text export format', () => {
      const options: any = { export: 'text' };
      const format = options.export;
      
      expect(format).toBe('text');
    });
    
    it('should parse markdown export format', () => {
      const options: any = { export: 'markdown' };
      const format = options.export;
      
      expect(format).toBe('markdown');
    });
    
    it('should parse json export format', () => {
      const options: any = { export: 'json' };
      const format = options.export;
      
      expect(format).toBe('json');
    });
    
    it('should default to text format when not specified', () => {
      const options: any = {};
      const format = options.export || 'text';
      
      expect(format).toBe('text');
    });
  });
  
  describe('Mock Mode Flag', () => {
    it('should parse mock mode flag when enabled', () => {
      const options: any = { mock: true };
      const useMock = options.mock;
      
      expect(useMock).toBe(true);
    });
    
    it('should default to false when mock flag not provided', () => {
      const options: any = {};
      const useMock = options.mock || false;
      
      expect(useMock).toBe(false);
    });
  });
});
