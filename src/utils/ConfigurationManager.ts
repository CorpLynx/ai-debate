import { DebateConfig, DEFAULT_CONFIG } from '../models/DebateConfig';
import { DebateValidator } from '../validators/DebateValidator';
import * as fs from 'fs';
import * as path from 'path';

export interface ConfigurationResult {
  config: DebateConfig;
  warnings: string[];
  invalidParams: string[];
}

export interface APIKeyConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

/**
 * Manages debate configuration, including validation and fallback to defaults.
 */
export class ConfigurationManager {
  private validator: DebateValidator;

  constructor() {
    this.validator = new DebateValidator();
  }

  /**
   * Merges user configuration with defaults, validates parameters,
   * and falls back to defaults for invalid parameters.
   * 
   * @param userConfig - Partial configuration provided by user
   * @returns ConfigurationResult with merged config, warnings, and invalid params
   */
  mergeAndValidate(userConfig: Partial<DebateConfig> = {}): ConfigurationResult {
    const warnings: string[] = [];
    const invalidParams: string[] = [];
    const mergedConfig: DebateConfig = { ...DEFAULT_CONFIG };

    // Validate the user configuration
    const validationResult = this.validator.validateConfig(userConfig);

    // Track which parameters were invalid
    if (validationResult.invalidParams) {
      invalidParams.push(...validationResult.invalidParams);
    }

    // Merge valid parameters, fall back to defaults for invalid ones
    for (const key of Object.keys(userConfig) as Array<keyof DebateConfig>) {
      const value = userConfig[key];
      
      if (value !== undefined) {
        if (invalidParams.includes(key)) {
          // Invalid parameter - use default and warn
          warnings.push(`Invalid value for ${key}, using default: ${DEFAULT_CONFIG[key]}`);
        } else {
          // Valid parameter - use user value
          (mergedConfig as any)[key] = value;
        }
      }
    }

    return {
      config: mergedConfig,
      warnings,
      invalidParams
    };
  }

  /**
   * Enforces word limit on a statement by truncating if necessary.
   * 
   * @param statement - The statement text
   * @param wordLimit - Maximum number of words allowed
   * @returns Truncated statement if it exceeds the limit
   */
  enforceWordLimit(statement: string, wordLimit: number): string {
    const words = statement.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length <= wordLimit) {
      return statement;
    }

    // Truncate to word limit
    const truncated = words.slice(0, wordLimit).join(' ');
    return truncated + '...';
  }

  /**
   * Checks if a statement exceeds the configured word limit.
   * 
   * @param statement - The statement text
   * @param config - The debate configuration
   * @returns True if statement exceeds word limit
   */
  exceedsWordLimit(statement: string, config: DebateConfig): boolean {
    if (!config.wordLimit || config.wordLimit <= 0) {
      return false;
    }

    const wordCount = statement.split(/\s+/).filter(w => w.length > 0).length;
    return wordCount > config.wordLimit;
  }

  /**
   * Loads configuration from a .debaterc file if it exists
   * 
   * @param configPath - Optional path to config file (defaults to ./.debaterc)
   * @returns Object containing partial configuration and any warnings
   */
  loadFromFile(configPath?: string): { config: Partial<DebateConfig>; warnings: string[] } {
    const filePath = configPath || path.join(process.cwd(), '.debaterc');
    const warnings: string[] = [];
    
    try {
      if (!fs.existsSync(filePath)) {
        // File doesn't exist - not an error, just use defaults
        return { config: {}, warnings: [] };
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      
      // Extract only valid DebateConfig keys
      const config: Partial<DebateConfig> = {};
      
      if (parsed.timeLimit !== undefined) config.timeLimit = parsed.timeLimit;
      if (parsed.wordLimit !== undefined) config.wordLimit = parsed.wordLimit;
      if (parsed.strictMode !== undefined) config.strictMode = parsed.strictMode;
      if (parsed.showPreparation !== undefined) config.showPreparation = parsed.showPreparation;
      if (parsed.numCrossExamQuestions !== undefined) config.numCrossExamQuestions = parsed.numCrossExamQuestions;
      if (parsed.preparationTime !== undefined) config.preparationTime = parsed.preparationTime;
      
      return { config, warnings };
    } catch (error) {
      // Handle parse errors and file read errors
      if (error instanceof SyntaxError) {
        warnings.push(`Configuration file at ${filePath} contains invalid JSON format. Using default values.`);
      } else if (error instanceof Error) {
        warnings.push(`Error reading configuration file at ${filePath}: ${error.message}. Using default values.`);
      } else {
        warnings.push(`Unknown error reading configuration file at ${filePath}. Using default values.`);
      }
      return { config: {}, warnings };
    }
  }

  /**
   * Loads API keys from a .debaterc file if it exists
   * 
   * @param configPath - Optional path to config file (defaults to ./.debaterc)
   * @returns API key configuration from file, or empty object if file doesn't exist
   */
  loadAPIKeysFromFile(configPath?: string): APIKeyConfig {
    const filePath = configPath || path.join(process.cwd(), '.debaterc');
    
    try {
      if (!fs.existsSync(filePath)) {
        return {};
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      
      const apiKeys: APIKeyConfig = {};
      
      if (parsed.openaiApiKey && typeof parsed.openaiApiKey === 'string') {
        apiKeys.openaiApiKey = parsed.openaiApiKey;
      }
      if (parsed.anthropicApiKey && typeof parsed.anthropicApiKey === 'string') {
        apiKeys.anthropicApiKey = parsed.anthropicApiKey;
      }
      
      return apiKeys;
    } catch (error) {
      // Silently return empty config on error
      return {};
    }
  }

  /**
   * Loads configuration from environment variables
   * 
   * Environment variables:
   * - DEBATE_TIME_LIMIT
   * - DEBATE_WORD_LIMIT
   * - DEBATE_STRICT_MODE
   * - DEBATE_SHOW_PREPARATION
   * - DEBATE_CROSS_EXAM_QUESTIONS
   * - DEBATE_PREPARATION_TIME
   * 
   * @returns Partial configuration from environment variables
   */
  loadFromEnv(): Partial<DebateConfig> {
    const config: Partial<DebateConfig> = {};
    
    if (process.env.DEBATE_TIME_LIMIT) {
      const value = parseFloat(process.env.DEBATE_TIME_LIMIT);
      if (!isNaN(value)) config.timeLimit = value;
    }
    
    if (process.env.DEBATE_WORD_LIMIT) {
      const value = parseInt(process.env.DEBATE_WORD_LIMIT, 10);
      if (!isNaN(value)) config.wordLimit = value;
    }
    
    if (process.env.DEBATE_STRICT_MODE) {
      config.strictMode = process.env.DEBATE_STRICT_MODE === 'true';
    }
    
    if (process.env.DEBATE_SHOW_PREPARATION) {
      config.showPreparation = process.env.DEBATE_SHOW_PREPARATION === 'true';
    }
    
    if (process.env.DEBATE_CROSS_EXAM_QUESTIONS) {
      const value = parseInt(process.env.DEBATE_CROSS_EXAM_QUESTIONS, 10);
      if (!isNaN(value)) config.numCrossExamQuestions = value;
    }
    
    if (process.env.DEBATE_PREPARATION_TIME) {
      const value = parseInt(process.env.DEBATE_PREPARATION_TIME, 10);
      if (!isNaN(value)) config.preparationTime = value;
    }
    
    return config;
  }

  /**
   * Loads API keys from environment variables
   * 
   * Environment variables:
   * - OPENAI_API_KEY
   * - ANTHROPIC_API_KEY
   * 
   * @returns API key configuration from environment variables
   */
  loadAPIKeysFromEnv(): APIKeyConfig {
    const apiKeys: APIKeyConfig = {};
    
    if (process.env.OPENAI_API_KEY) {
      apiKeys.openaiApiKey = process.env.OPENAI_API_KEY;
    }
    
    if (process.env.ANTHROPIC_API_KEY) {
      apiKeys.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    }
    
    return apiKeys;
  }

  /**
   * Loads and merges API keys from all sources
   * 
   * Precedence (highest to lowest):
   * 1. CLI options (passed as parameter)
   * 2. Environment variables
   * 3. Configuration file (.debaterc)
   * 
   * @param cliAPIKeys - API keys from CLI flags
   * @param configPath - Optional path to config file
   * @returns Merged API key configuration
   */
  loadAndMergeAPIKeys(cliAPIKeys: APIKeyConfig = {}, configPath?: string): APIKeyConfig {
    // Load from all sources
    const fileAPIKeys = this.loadAPIKeysFromFile(configPath);
    const envAPIKeys = this.loadAPIKeysFromEnv();
    
    // Merge with precedence: CLI > Env > File
    return {
      ...fileAPIKeys,
      ...envAPIKeys,
      ...cliAPIKeys
    };
  }

  /**
   * Loads and merges configuration from all sources
   * 
   * Precedence (highest to lowest):
   * 1. CLI options (passed as parameter)
   * 2. Environment variables
   * 3. Configuration file (.debaterc)
   * 4. Default values
   * 
   * @param cliConfig - Configuration from CLI flags
   * @param configPath - Optional path to config file
   * @returns ConfigurationResult with merged config and warnings
   */
  loadAndMerge(cliConfig: Partial<DebateConfig> = {}, configPath?: string): ConfigurationResult {
    // Load from all sources
    const fileResult = this.loadFromFile(configPath);
    const envConfig = this.loadFromEnv();
    
    // Merge with precedence: CLI > Env > File > Defaults
    const mergedConfig: Partial<DebateConfig> = {
      ...fileResult.config,
      ...envConfig,
      ...cliConfig
    };
    
    // Validate and apply defaults for invalid parameters
    const validationResult = this.mergeAndValidate(mergedConfig);
    
    // Combine warnings from file loading and validation
    const allWarnings = [...fileResult.warnings, ...validationResult.warnings];
    
    return {
      config: validationResult.config,
      warnings: allWarnings,
      invalidParams: validationResult.invalidParams
    };
  }
}
