import * as fc from 'fast-check';
import { ConfigurationManager } from '../../src/utils/ConfigurationManager';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Configuration Loading Properties', () => {
  const configManager = new ConfigurationManager();
  let tempDir: string;
  let tempConfigPath: string;

  beforeEach(() => {
    // Create a temporary directory for test config files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debate-config-test-'));
    tempConfigPath = path.join(tempDir, '.debaterc');
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  // Feature: interactive-mode, Property 17: Configuration loading reads all parameters
  // Validates: Requirements 7.1
  it('should read all parameters from configuration file', () => {
    fc.assert(
      fc.property(
        fc.record({
          timeLimit: fc.integer({ min: 1, max: 1000 }),
          wordLimit: fc.integer({ min: 1, max: 1000 }),
          strictMode: fc.boolean(),
          showPreparation: fc.boolean(),
          numCrossExamQuestions: fc.integer({ min: 0, max: 10 }),
          preparationTime: fc.integer({ min: 1, max: 600 })
        }),
        (configData) => {
          // Write config to file
          fs.writeFileSync(tempConfigPath, JSON.stringify(configData, null, 2));

          // Load config from file
          const loadedConfig = configManager.loadFromFile(tempConfigPath);

          // All parameters should be loaded
          expect(loadedConfig.timeLimit).toBe(configData.timeLimit);
          expect(loadedConfig.wordLimit).toBe(configData.wordLimit);
          expect(loadedConfig.strictMode).toBe(configData.strictMode);
          expect(loadedConfig.showPreparation).toBe(configData.showPreparation);
          expect(loadedConfig.numCrossExamQuestions).toBe(configData.numCrossExamQuestions);
          expect(loadedConfig.preparationTime).toBe(configData.preparationTime);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 19: Missing parameters use defaults
  // Validates: Requirements 7.3
  it('should use default values for missing parameters', () => {
    fc.assert(
      fc.property(
        // Generate partial configurations with some parameters missing
        fc.record(
          {
            timeLimit: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
            wordLimit: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
            strictMode: fc.option(fc.boolean(), { nil: undefined }),
            showPreparation: fc.option(fc.boolean(), { nil: undefined }),
            numCrossExamQuestions: fc.option(fc.integer({ min: 0, max: 10 }), { nil: undefined }),
            preparationTime: fc.option(fc.integer({ min: 1, max: 600 }), { nil: undefined })
          },
          { requiredKeys: [] } // Allow all keys to be optional
        ),
        (partialConfig) => {
          // Write partial config to file
          fs.writeFileSync(tempConfigPath, JSON.stringify(partialConfig, null, 2));

          // Load and merge config
          const result = configManager.loadAndMerge({}, tempConfigPath);

          // Check each parameter
          const keys: Array<keyof DebateConfig> = [
            'timeLimit',
            'wordLimit',
            'strictMode',
            'showPreparation',
            'numCrossExamQuestions',
            'preparationTime'
          ];

          for (const key of keys) {
            if (partialConfig[key] === undefined) {
              // Missing parameter should use default
              expect(result.config[key]).toBe(DEFAULT_CONFIG[key]);
            } else {
              // Present parameter should use provided value
              expect(result.config[key]).toBe(partialConfig[key]);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Completely empty config file should use all defaults
  it('should use all defaults when config file is empty object', () => {
    fs.writeFileSync(tempConfigPath, JSON.stringify({}, null, 2));

    const result = configManager.loadAndMerge({}, tempConfigPath);

    expect(result.config).toEqual(DEFAULT_CONFIG);
    expect(result.warnings).toHaveLength(0);
    expect(result.invalidParams).toHaveLength(0);
  });

  // Feature: interactive-mode, Property 22: Preparation time is read from config
  // Validates: Requirements 9.1
  it('should read preparation time from configuration file', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 600 }),
        (preparationTime) => {
          // Write config with preparation time
          const configData = { preparationTime };
          fs.writeFileSync(tempConfigPath, JSON.stringify(configData, null, 2));

          // Load config from file
          const loadedConfig = configManager.loadFromFile(tempConfigPath);

          // Preparation time should be loaded
          expect(loadedConfig.preparationTime).toBe(preparationTime);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Preparation time should be used in merged config
  it('should use preparation time from file in merged configuration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 600 }),
        (preparationTime) => {
          // Write config with preparation time
          const configData = { preparationTime };
          fs.writeFileSync(tempConfigPath, JSON.stringify(configData, null, 2));

          // Load and merge config
          const result = configManager.loadAndMerge({}, tempConfigPath);

          // Preparation time should be in final config
          expect(result.config.preparationTime).toBe(preparationTime);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Missing preparation time should use default
  it('should use default preparation time when not specified in config', () => {
    // Write config without preparation time
    const configData = { timeLimit: 60 };
    fs.writeFileSync(tempConfigPath, JSON.stringify(configData, null, 2));

    // Load and merge config
    const result = configManager.loadAndMerge({}, tempConfigPath);

    // Should use default preparation time
    expect(result.config.preparationTime).toBe(DEFAULT_CONFIG.preparationTime);
  });
});
