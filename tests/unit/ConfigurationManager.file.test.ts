import { ConfigurationManager } from '../../src/utils/ConfigurationManager';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigurationManager - File Loading', () => {
  const testConfigPath = path.join(__dirname, '.debaterc.test');
  let configManager: ConfigurationManager;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    // Clean up any existing test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Clean up test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  test('should load configuration from file', () => {
    const testConfig = {
      timeLimit: 120,
      wordLimit: 500,
      strictMode: true
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadFromFile(testConfigPath);
    
    expect(loaded.timeLimit).toBe(120);
    expect(loaded.wordLimit).toBe(500);
    expect(loaded.strictMode).toBe(true);
  });

  test('should return empty object if file does not exist', () => {
    const loaded = configManager.loadFromFile('/nonexistent/path/.debaterc');
    expect(loaded).toEqual({});
  });

  test('should handle invalid JSON gracefully', () => {
    fs.writeFileSync(testConfigPath, 'invalid json {');
    
    const loaded = configManager.loadFromFile(testConfigPath);
    expect(loaded).toEqual({});
  });

  test('should load all supported configuration options', () => {
    const testConfig = {
      timeLimit: 90,
      wordLimit: 400,
      strictMode: false,
      showPreparation: false,
      numCrossExamQuestions: 5
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadFromFile(testConfigPath);
    
    expect(loaded.timeLimit).toBe(90);
    expect(loaded.wordLimit).toBe(400);
    expect(loaded.strictMode).toBe(false);
    expect(loaded.showPreparation).toBe(false);
    expect(loaded.numCrossExamQuestions).toBe(5);
  });

  test('should ignore unknown properties in config file', () => {
    const testConfig = {
      timeLimit: 120,
      unknownProperty: 'should be ignored',
      anotherUnknown: 42
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadFromFile(testConfigPath);
    
    expect(loaded.timeLimit).toBe(120);
    expect((loaded as any).unknownProperty).toBeUndefined();
    expect((loaded as any).anotherUnknown).toBeUndefined();
  });
});

describe('ConfigurationManager - API Key File Loading', () => {
  const testConfigPath = path.join(__dirname, '.debaterc.test');
  let configManager: ConfigurationManager;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    // Clean up any existing test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Clean up test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  test('should load API keys from file', () => {
    const testConfig = {
      openaiApiKey: 'sk-test-openai-key',
      anthropicApiKey: 'sk-ant-test-anthropic-key'
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadAPIKeysFromFile(testConfigPath);
    
    expect(loaded.openaiApiKey).toBe('sk-test-openai-key');
    expect(loaded.anthropicApiKey).toBe('sk-ant-test-anthropic-key');
  });

  test('should return empty object if file does not exist', () => {
    const loaded = configManager.loadAPIKeysFromFile('/nonexistent/path/.debaterc');
    expect(loaded).toEqual({});
  });

  test('should handle invalid JSON gracefully', () => {
    fs.writeFileSync(testConfigPath, 'invalid json {');
    
    const loaded = configManager.loadAPIKeysFromFile(testConfigPath);
    expect(loaded).toEqual({});
  });

  test('should load only valid API key properties', () => {
    const testConfig = {
      openaiApiKey: 'sk-test-openai-key',
      anthropicApiKey: 'sk-ant-test-anthropic-key',
      invalidKey: 'should be ignored',
      openaiApiKeyNumber: 12345 // should be ignored (not a string)
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadAPIKeysFromFile(testConfigPath);
    
    expect(loaded.openaiApiKey).toBe('sk-test-openai-key');
    expect(loaded.anthropicApiKey).toBe('sk-ant-test-anthropic-key');
    expect((loaded as any).invalidKey).toBeUndefined();
    expect((loaded as any).openaiApiKeyNumber).toBeUndefined();
  });

  test('should load partial API keys if only one is present', () => {
    const testConfig = {
      openaiApiKey: 'sk-test-openai-key'
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadAPIKeysFromFile(testConfigPath);
    
    expect(loaded.openaiApiKey).toBe('sk-test-openai-key');
    expect(loaded.anthropicApiKey).toBeUndefined();
  });
});

describe('ConfigurationManager - API Key Environment Variables', () => {
  let configManager: ConfigurationManager;
  const originalEnv = process.env;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    // Clear environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should load API keys from environment variables', () => {
    process.env.OPENAI_API_KEY = 'sk-env-openai-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-anthropic-key';
    
    const loaded = configManager.loadAPIKeysFromEnv();
    
    expect(loaded.openaiApiKey).toBe('sk-env-openai-key');
    expect(loaded.anthropicApiKey).toBe('sk-ant-env-anthropic-key');
  });

  test('should return empty object if environment variables are not set', () => {
    const loaded = configManager.loadAPIKeysFromEnv();
    expect(loaded).toEqual({});
  });

  test('should load partial API keys if only one is set', () => {
    process.env.OPENAI_API_KEY = 'sk-env-openai-key';
    
    const loaded = configManager.loadAPIKeysFromEnv();
    
    expect(loaded.openaiApiKey).toBe('sk-env-openai-key');
    expect(loaded.anthropicApiKey).toBeUndefined();
  });
});

describe('ConfigurationManager - API Key Merging', () => {
  const testConfigPath = path.join(__dirname, '.debaterc.test');
  let configManager: ConfigurationManager;
  const originalEnv = process.env;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    // Clear environment variables
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    // Clean up any existing test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    // Clean up test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  test('should merge API keys with CLI taking precedence over env and file', () => {
    // Set up file config
    const fileConfig = {
      openaiApiKey: 'sk-file-openai-key',
      anthropicApiKey: 'sk-ant-file-anthropic-key'
    };
    fs.writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2));
    
    // Set up env config
    process.env.OPENAI_API_KEY = 'sk-env-openai-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-anthropic-key';
    
    // CLI config (highest precedence)
    const cliConfig = {
      openaiApiKey: 'sk-cli-openai-key',
      anthropicApiKey: 'sk-ant-cli-anthropic-key'
    };
    
    const merged = configManager.loadAndMergeAPIKeys(cliConfig, testConfigPath);
    
    // CLI should win
    expect(merged.openaiApiKey).toBe('sk-cli-openai-key');
    expect(merged.anthropicApiKey).toBe('sk-ant-cli-anthropic-key');
  });

  test('should merge API keys with env taking precedence over file', () => {
    // Set up file config
    const fileConfig = {
      openaiApiKey: 'sk-file-openai-key',
      anthropicApiKey: 'sk-ant-file-anthropic-key'
    };
    fs.writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2));
    
    // Set up env config
    process.env.OPENAI_API_KEY = 'sk-env-openai-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-anthropic-key';
    
    // No CLI config
    const merged = configManager.loadAndMergeAPIKeys({}, testConfigPath);
    
    // Env should win over file
    expect(merged.openaiApiKey).toBe('sk-env-openai-key');
    expect(merged.anthropicApiKey).toBe('sk-ant-env-anthropic-key');
  });

  test('should use file config when env and CLI are not set', () => {
    // Set up file config
    const fileConfig = {
      openaiApiKey: 'sk-file-openai-key',
      anthropicApiKey: 'sk-ant-file-anthropic-key'
    };
    fs.writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2));
    
    // No env or CLI config
    const merged = configManager.loadAndMergeAPIKeys({}, testConfigPath);
    
    // File should be used
    expect(merged.openaiApiKey).toBe('sk-file-openai-key');
    expect(merged.anthropicApiKey).toBe('sk-ant-file-anthropic-key');
  });

  test('should merge partial API keys from different sources', () => {
    // Set up file config with only OpenAI key
    const fileConfig = {
      openaiApiKey: 'sk-file-openai-key'
    };
    fs.writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2));
    
    // Set up env config with only Anthropic key
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-anthropic-key';
    
    // No CLI config
    const merged = configManager.loadAndMergeAPIKeys({}, testConfigPath);
    
    // Should merge both
    expect(merged.openaiApiKey).toBe('sk-file-openai-key');
    expect(merged.anthropicApiKey).toBe('sk-ant-env-anthropic-key');
  });

  test('should allow CLI to override only one key', () => {
    // Set up file config with both keys
    const fileConfig = {
      openaiApiKey: 'sk-file-openai-key',
      anthropicApiKey: 'sk-ant-file-anthropic-key'
    };
    fs.writeFileSync(testConfigPath, JSON.stringify(fileConfig, null, 2));
    
    // Set up env config with both keys
    process.env.OPENAI_API_KEY = 'sk-env-openai-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-env-anthropic-key';
    
    // CLI config with only OpenAI key
    const cliConfig = {
      openaiApiKey: 'sk-cli-openai-key'
    };
    
    const merged = configManager.loadAndMergeAPIKeys(cliConfig, testConfigPath);
    
    // CLI OpenAI should win, env Anthropic should win over file
    expect(merged.openaiApiKey).toBe('sk-cli-openai-key');
    expect(merged.anthropicApiKey).toBe('sk-ant-env-anthropic-key');
  });
});

describe('ConfigurationManager - Environment Variables', () => {
  let configManager: ConfigurationManager;
  const originalEnv = process.env;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    // Clear environment variables
    delete process.env.DEBATE_TIME_LIMIT;
    delete process.env.DEBATE_WORD_LIMIT;
    delete process.env.DEBATE_STRICT_MODE;
    delete process.env.DEBATE_SHOW_PREPARATION;
    delete process.env.DEBATE_CROSS_EXAM_QUESTIONS;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should load configuration from environment variables', () => {
    process.env.DEBATE_TIME_LIMIT = '90';
    process.env.DEBATE_WORD_LIMIT = '400';
    process.env.DEBATE_STRICT_MODE = 'true';
    process.env.DEBATE_SHOW_PREPARATION = 'false';
    process.env.DEBATE_CROSS_EXAM_QUESTIONS = '5';
    
    const loaded = configManager.loadFromEnv();
    
    expect(loaded.timeLimit).toBe(90);
    expect(loaded.wordLimit).toBe(400);
    expect(loaded.strictMode).toBe(true);
    expect(loaded.showPreparation).toBe(false);
    expect(loaded.numCrossExamQuestions).toBe(5);
  });

  test('should return empty object if environment variables are not set', () => {
    const loaded = configManager.loadFromEnv();
    expect(loaded).toEqual({});
  });

  test('should handle invalid numeric values gracefully', () => {
    process.env.DEBATE_TIME_LIMIT = 'invalid';
    process.env.DEBATE_WORD_LIMIT = 'not-a-number';
    
    const loaded = configManager.loadFromEnv();
    
    expect(loaded.timeLimit).toBeUndefined();
    expect(loaded.wordLimit).toBeUndefined();
  });
});