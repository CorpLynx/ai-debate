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
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.timeLimit).toBe(120);
    expect(result.config.wordLimit).toBe(500);
    expect(result.config.strictMode).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  test('should return empty object if file does not exist', () => {
    const result = configManager.loadFromFile('/nonexistent/path/.debaterc');
    expect(result.config).toEqual({});
    expect(result.warnings).toHaveLength(0);
  });

  test('should handle invalid JSON gracefully and display warning', () => {
    fs.writeFileSync(testConfigPath, 'invalid json {');
    
    const result = configManager.loadFromFile(testConfigPath);
    expect(result.config).toEqual({});
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('invalid JSON format');
    expect(result.warnings[0]).toContain('Using default values');
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
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.timeLimit).toBe(90);
    expect(result.config.wordLimit).toBe(400);
    expect(result.config.strictMode).toBe(false);
    expect(result.config.showPreparation).toBe(false);
    expect(result.config.numCrossExamQuestions).toBe(5);
    expect(result.warnings).toHaveLength(0);
  });

  test('should ignore unknown properties in config file', () => {
    const testConfig = {
      timeLimit: 120,
      unknownProperty: 'should be ignored',
      anotherUnknown: 42
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.timeLimit).toBe(120);
    expect((result.config as any).unknownProperty).toBeUndefined();
    expect((result.config as any).anotherUnknown).toBeUndefined();
    expect(result.warnings).toHaveLength(0);
  });

  test('should display warning for file read errors', () => {
    // Try to read from a directory instead of a file
    const dirPath = path.join(__dirname, 'test-dir');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
    
    const result = configManager.loadFromFile(dirPath);
    
    expect(result.config).toEqual({});
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('error reading configuration file');
    expect(result.warnings[0]).toContain('Using default values');
    
    // Clean up
    fs.rmdirSync(dirPath);
  });

  test('should handle missing individual parameters by using defaults', () => {
    const testConfig = {
      timeLimit: 120
      // Other parameters are missing
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    // Specified parameter should be loaded
    expect(result.config.timeLimit).toBe(120);
    
    // Missing parameters should not be in the config (will use defaults later)
    expect(result.config.wordLimit).toBeUndefined();
    expect(result.config.strictMode).toBeUndefined();
    
    // No warnings for missing parameters (this is expected behavior)
    expect(result.warnings).toHaveLength(0);
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

describe('ConfigurationManager - Error Handling in loadAndMerge', () => {
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

  test('should handle missing configuration file by using defaults', () => {
    const result = configManager.loadAndMerge({}, '/nonexistent/path/.debaterc');
    
    // Should use default config
    expect(result.config.timeLimit).toBe(120);
    expect(result.config.wordLimit).toBe(500);
    
    // No warnings for missing file (expected behavior)
    expect(result.warnings).toHaveLength(0);
  });

  test('should handle invalid JSON format and display warning', () => {
    fs.writeFileSync(testConfigPath, 'invalid json {');
    
    const result = configManager.loadAndMerge({}, testConfigPath);
    
    // Should use default config
    expect(result.config.timeLimit).toBe(120);
    expect(result.config.wordLimit).toBe(500);
    
    // Should have warning about invalid JSON
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('invalid JSON format'))).toBe(true);
  });

  test('should handle invalid individual parameters and display warnings', () => {
    const testConfig = {
      timeLimit: -50, // invalid
      wordLimit: 300, // valid
      strictMode: 'not a boolean' // invalid
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadAndMerge({}, testConfigPath);
    
    // Valid parameter should be used
    expect(result.config.wordLimit).toBe(300);
    
    // Invalid parameters should fall back to defaults
    expect(result.config.timeLimit).toBe(120); // default
    expect(result.config.strictMode).toBe(false); // default
    
    // Should have warnings for invalid parameters
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some(w => w.includes('timeLimit'))).toBe(true);
    expect(result.warnings.some(w => w.includes('strictMode'))).toBe(true);
    
    // Should track invalid parameters
    expect(result.invalidParams).toContain('timeLimit');
    expect(result.invalidParams).toContain('strictMode');
  });

  test('should handle missing individual parameters by using defaults', () => {
    const testConfig = {
      timeLimit: 90
      // Other parameters missing
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadAndMerge({}, testConfigPath);
    
    // Specified parameter should be used
    expect(result.config.timeLimit).toBe(90);
    
    // Missing parameters should use defaults
    expect(result.config.wordLimit).toBe(500); // default
    expect(result.config.strictMode).toBe(false); // default
    expect(result.config.showPreparation).toBe(true); // default
    
    // No warnings for missing parameters (expected behavior)
    expect(result.warnings).toHaveLength(0);
  });

  test('should combine warnings from file loading and validation', () => {
    const testConfig = {
      timeLimit: -10, // invalid
      wordLimit: 0 // invalid
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadAndMerge({}, testConfigPath);
    
    // Should have warnings for both invalid parameters
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
    expect(result.warnings.some(w => w.includes('timeLimit'))).toBe(true);
    expect(result.warnings.some(w => w.includes('wordLimit'))).toBe(true);
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

describe('ConfigurationManager - UI Configuration File Loading', () => {
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

  test('should load UI configuration from file', () => {
    const testConfig = {
      timeLimit: 120,
      ui: {
        enableRichFormatting: false,
        enableAnimations: false,
        enableColors: true,
        colorScheme: 'high-contrast',
        terminalWidth: 100,
        showPreparationProgress: false,
        enableHyperlinks: false
      }
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.ui).toBeDefined();
    expect(result.config.ui?.enableRichFormatting).toBe(false);
    expect(result.config.ui?.enableAnimations).toBe(false);
    expect(result.config.ui?.enableColors).toBe(true);
    expect(result.config.ui?.colorScheme).toBe('high-contrast');
    expect(result.config.ui?.terminalWidth).toBe(100);
    expect(result.config.ui?.showPreparationProgress).toBe(false);
    expect(result.config.ui?.enableHyperlinks).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  test('should handle invalid UI configuration gracefully', () => {
    const testConfig = {
      timeLimit: 120,
      ui: 'not an object'
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.ui).toBeDefined();
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('UI configuration must be an object');
  });

  test('should handle invalid boolean values in UI config', () => {
    const testConfig = {
      ui: {
        enableRichFormatting: 'not a boolean',
        enableAnimations: 123,
        enableColors: true
      }
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.ui).toBeDefined();
    expect(result.config.ui?.enableRichFormatting).toBeUndefined();
    expect(result.config.ui?.enableAnimations).toBeUndefined();
    expect(result.config.ui?.enableColors).toBe(true);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });

  test('should handle invalid color scheme value', () => {
    const testConfig = {
      ui: {
        colorScheme: 'invalid-scheme'
      }
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.ui).toBeDefined();
    expect(result.config.ui?.colorScheme).toBeUndefined();
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('colorScheme must be one of');
  });

  test('should handle invalid terminal width value', () => {
    const testConfig = {
      ui: {
        terminalWidth: 10 // too small
      }
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.ui).toBeDefined();
    expect(result.config.ui?.terminalWidth).toBeUndefined();
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('terminalWidth must be a number between 40 and 500');
  });

  test('should load partial UI configuration', () => {
    const testConfig = {
      ui: {
        enableColors: false,
        colorScheme: 'plain'
      }
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const result = configManager.loadFromFile(testConfigPath);
    
    expect(result.config.ui).toBeDefined();
    expect(result.config.ui?.enableColors).toBe(false);
    expect(result.config.ui?.colorScheme).toBe('plain');
    expect(result.warnings).toHaveLength(0);
  });
});

describe('ConfigurationManager - UI Configuration Environment Variables', () => {
  let configManager: ConfigurationManager;
  const originalEnv = process.env;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    // Clear UI environment variables
    delete process.env.DEBATE_UI_ENABLE_RICH_FORMATTING;
    delete process.env.DEBATE_UI_ENABLE_ANIMATIONS;
    delete process.env.DEBATE_UI_ENABLE_COLORS;
    delete process.env.DEBATE_UI_COLOR_SCHEME;
    delete process.env.DEBATE_UI_TERMINAL_WIDTH;
    delete process.env.DEBATE_UI_SHOW_PREPARATION_PROGRESS;
    delete process.env.DEBATE_UI_ENABLE_HYPERLINKS;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  test('should load UI configuration from environment variables', () => {
    process.env.DEBATE_UI_ENABLE_RICH_FORMATTING = 'false';
    process.env.DEBATE_UI_ENABLE_ANIMATIONS = 'false';
    process.env.DEBATE_UI_ENABLE_COLORS = 'true';
    process.env.DEBATE_UI_COLOR_SCHEME = 'high-contrast';
    process.env.DEBATE_UI_TERMINAL_WIDTH = '100';
    process.env.DEBATE_UI_SHOW_PREPARATION_PROGRESS = 'false';
    process.env.DEBATE_UI_ENABLE_HYPERLINKS = 'false';
    
    const loaded = configManager.loadFromEnv();
    
    expect(loaded.ui).toBeDefined();
    expect(loaded.ui?.enableRichFormatting).toBe(false);
    expect(loaded.ui?.enableAnimations).toBe(false);
    expect(loaded.ui?.enableColors).toBe(true);
    expect(loaded.ui?.colorScheme).toBe('high-contrast');
    expect(loaded.ui?.terminalWidth).toBe(100);
    expect(loaded.ui?.showPreparationProgress).toBe(false);
    expect(loaded.ui?.enableHyperlinks).toBe(false);
  });

  test('should handle invalid terminal width from environment', () => {
    process.env.DEBATE_UI_TERMINAL_WIDTH = '10'; // too small
    
    const loaded = configManager.loadFromEnv();
    
    expect(loaded.ui).toBeDefined();
    expect(loaded.ui?.terminalWidth).toBeUndefined();
  });

  test('should handle invalid color scheme from environment', () => {
    process.env.DEBATE_UI_COLOR_SCHEME = 'invalid-scheme';
    
    const loaded = configManager.loadFromEnv();
    
    expect(loaded.ui).toBeDefined();
    expect(loaded.ui?.colorScheme).toBeUndefined();
  });

  test('should load partial UI configuration from environment', () => {
    process.env.DEBATE_UI_ENABLE_COLORS = 'false';
    process.env.DEBATE_UI_COLOR_SCHEME = 'plain';
    
    const loaded = configManager.loadFromEnv();
    
    expect(loaded.ui).toBeDefined();
    expect(loaded.ui?.enableColors).toBe(false);
    expect(loaded.ui?.colorScheme).toBe('plain');
  });
});
