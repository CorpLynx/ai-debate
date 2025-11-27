import { DebateConfig, DEFAULT_CONFIG } from '../models/DebateConfig';
import { UIConfig, createUIConfig, validateUIConfig, ColorSchemeType } from '../models/UIConfig';
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
        } else if (key === 'ui') {
          // Special handling for UI config
          const uiConfig = createUIConfig(value as Partial<UIConfig>);
          if (validateUIConfig(uiConfig)) {
            mergedConfig.ui = uiConfig;
          } else {
            warnings.push('Invalid UI configuration, using defaults');
            invalidParams.push('ui');
          }
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
      
      // Load UI configuration if present
      if (parsed.ui !== undefined) {
        const uiConfig = this.parseUIConfig(parsed.ui, warnings);
        // Always set ui config even if empty (to trigger warnings)
        config.ui = uiConfig as UIConfig;
      }
      
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
   * Parses UI configuration from a parsed JSON object
   * 
   * @param uiData - Parsed UI configuration data
   * @param warnings - Array to collect warnings
   * @returns Partial UIConfig (empty object if all values are invalid)
   */
  private parseUIConfig(uiData: any, warnings: string[]): Partial<UIConfig> {
    if (typeof uiData !== 'object' || uiData === null) {
      warnings.push('UI configuration must be an object. Using default UI settings.');
      return {};
    }
    
    const uiConfig: Partial<UIConfig> = {};
    
    // Parse boolean flags
    if (uiData.enableRichFormatting !== undefined) {
      if (typeof uiData.enableRichFormatting === 'boolean') {
        uiConfig.enableRichFormatting = uiData.enableRichFormatting;
      } else {
        warnings.push('enableRichFormatting must be a boolean. Using default.');
      }
    }
    
    if (uiData.enableAnimations !== undefined) {
      if (typeof uiData.enableAnimations === 'boolean') {
        uiConfig.enableAnimations = uiData.enableAnimations;
      } else {
        warnings.push('enableAnimations must be a boolean. Using default.');
      }
    }
    
    if (uiData.enableColors !== undefined) {
      if (typeof uiData.enableColors === 'boolean') {
        uiConfig.enableColors = uiData.enableColors;
      } else {
        warnings.push('enableColors must be a boolean. Using default.');
      }
    }
    
    if (uiData.showPreparationProgress !== undefined) {
      if (typeof uiData.showPreparationProgress === 'boolean') {
        uiConfig.showPreparationProgress = uiData.showPreparationProgress;
      } else {
        warnings.push('showPreparationProgress must be a boolean. Using default.');
      }
    }
    
    if (uiData.enableHyperlinks !== undefined) {
      if (typeof uiData.enableHyperlinks === 'boolean') {
        uiConfig.enableHyperlinks = uiData.enableHyperlinks;
      } else {
        warnings.push('enableHyperlinks must be a boolean. Using default.');
      }
    }
    
    // Parse color scheme
    if (uiData.colorScheme !== undefined) {
      const validSchemes: ColorSchemeType[] = ['default', 'high-contrast', 'plain', 'custom'];
      if (typeof uiData.colorScheme === 'string' && validSchemes.includes(uiData.colorScheme as ColorSchemeType)) {
        uiConfig.colorScheme = uiData.colorScheme as ColorSchemeType;
      } else {
        warnings.push(`colorScheme must be one of: ${validSchemes.join(', ')}. Using default.`);
      }
    }
    
    // Parse terminal width
    if (uiData.terminalWidth !== undefined) {
      if (typeof uiData.terminalWidth === 'number' && uiData.terminalWidth >= 40 && uiData.terminalWidth <= 500) {
        uiConfig.terminalWidth = uiData.terminalWidth;
      } else {
        warnings.push('terminalWidth must be a number between 40 and 500. Using auto-detection.');
      }
    }
    
    // Parse custom color scheme if present
    if (uiData.customColorScheme !== undefined) {
      if (typeof uiData.customColorScheme === 'object' && uiData.customColorScheme !== null) {
        uiConfig.customColorScheme = uiData.customColorScheme;
      } else {
        warnings.push('customColorScheme must be an object. Ignoring custom color scheme.');
      }
    }
    
    // Parse custom formatting rules if present
    if (uiData.customFormattingRules !== undefined) {
      if (typeof uiData.customFormattingRules === 'object' && uiData.customFormattingRules !== null) {
        uiConfig.customFormattingRules = uiData.customFormattingRules;
      } else {
        warnings.push('customFormattingRules must be an object. Ignoring custom formatting rules.');
      }
    }
    
    return uiConfig;
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
   * - DEBATE_UI_ENABLE_RICH_FORMATTING
   * - DEBATE_UI_ENABLE_ANIMATIONS
   * - DEBATE_UI_ENABLE_COLORS
   * - DEBATE_UI_COLOR_SCHEME
   * - DEBATE_UI_TERMINAL_WIDTH
   * - DEBATE_UI_SHOW_PREPARATION_PROGRESS
   * - DEBATE_UI_ENABLE_HYPERLINKS
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
    
    // Load UI configuration from environment
    const uiConfig = this.loadUIConfigFromEnv();
    // Set ui config if any UI env vars were present (even if invalid)
    const hasUIEnvVars = process.env.DEBATE_UI_ENABLE_RICH_FORMATTING !== undefined ||
                         process.env.DEBATE_UI_ENABLE_ANIMATIONS !== undefined ||
                         process.env.DEBATE_UI_ENABLE_COLORS !== undefined ||
                         process.env.DEBATE_UI_COLOR_SCHEME !== undefined ||
                         process.env.DEBATE_UI_TERMINAL_WIDTH !== undefined ||
                         process.env.DEBATE_UI_SHOW_PREPARATION_PROGRESS !== undefined ||
                         process.env.DEBATE_UI_ENABLE_HYPERLINKS !== undefined;
    
    if (hasUIEnvVars) {
      config.ui = uiConfig as UIConfig;
    }
    
    return config;
  }

  /**
   * Loads UI configuration from environment variables
   * 
   * @returns Partial UIConfig from environment variables
   */
  private loadUIConfigFromEnv(): Partial<UIConfig> {
    const uiConfig: Partial<UIConfig> = {};
    
    if (process.env.DEBATE_UI_ENABLE_RICH_FORMATTING !== undefined) {
      uiConfig.enableRichFormatting = process.env.DEBATE_UI_ENABLE_RICH_FORMATTING === 'true';
    }
    
    if (process.env.DEBATE_UI_ENABLE_ANIMATIONS !== undefined) {
      uiConfig.enableAnimations = process.env.DEBATE_UI_ENABLE_ANIMATIONS === 'true';
    }
    
    if (process.env.DEBATE_UI_ENABLE_COLORS !== undefined) {
      uiConfig.enableColors = process.env.DEBATE_UI_ENABLE_COLORS === 'true';
    }
    
    if (process.env.DEBATE_UI_SHOW_PREPARATION_PROGRESS !== undefined) {
      uiConfig.showPreparationProgress = process.env.DEBATE_UI_SHOW_PREPARATION_PROGRESS === 'true';
    }
    
    if (process.env.DEBATE_UI_ENABLE_HYPERLINKS !== undefined) {
      uiConfig.enableHyperlinks = process.env.DEBATE_UI_ENABLE_HYPERLINKS === 'true';
    }
    
    if (process.env.DEBATE_UI_COLOR_SCHEME) {
      const validSchemes: ColorSchemeType[] = ['default', 'high-contrast', 'plain', 'custom'];
      const scheme = process.env.DEBATE_UI_COLOR_SCHEME as ColorSchemeType;
      if (validSchemes.includes(scheme)) {
        uiConfig.colorScheme = scheme;
      }
    }
    
    if (process.env.DEBATE_UI_TERMINAL_WIDTH) {
      const value = parseInt(process.env.DEBATE_UI_TERMINAL_WIDTH, 10);
      if (!isNaN(value) && value >= 40 && value <= 500) {
        uiConfig.terminalWidth = value;
      }
    }
    
    return uiConfig;
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
