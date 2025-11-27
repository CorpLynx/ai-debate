import { ConfigurationManager } from '../../src/utils/ConfigurationManager';
import { DebateConfig } from '../../src/models/DebateConfig';
import { UIConfig, getActiveColorScheme, getActiveFormattingRules } from '../../src/models/UIConfig';
import { DEFAULT_COLOR_SCHEME, HIGH_CONTRAST_COLOR_SCHEME, PLAIN_COLOR_SCHEME } from '../../src/models/ColorScheme';
import { DEFAULT_FORMATTING_RULES, COMPACT_FORMATTING_RULES, WIDE_FORMATTING_RULES } from '../../src/models/FormattingRules';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('UI Configuration Integration', () => {
  let configManager: ConfigurationManager;
  let tempDir: string;
  let tempConfigPath: string;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debate-test-'));
    tempConfigPath = path.join(tempDir, '.debaterc');
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  describe('Configuration Loading', () => {
    it('should load UI config from file', () => {
      const config = {
        timeLimit: 60,
        ui: {
          enableColors: false,
          colorScheme: 'plain',
          enableAnimations: false
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      expect(result.config.ui?.enableColors).toBe(false);
      expect(result.config.ui?.colorScheme).toBe('plain');
      expect(result.config.ui?.enableAnimations).toBe(false);
    });

    it('should merge UI config from multiple sources', () => {
      // File config
      const fileConfig = {
        ui: {
          enableColors: false,
          colorScheme: 'plain'
        }
      };
      fs.writeFileSync(tempConfigPath, JSON.stringify(fileConfig, null, 2));

      // CLI config
      const cliConfig: Partial<DebateConfig> = {
        ui: {
          enableAnimations: false,
          showPreparationProgress: false
        } as UIConfig
      };

      const result = configManager.loadAndMerge(cliConfig, tempConfigPath);
      
      // CLI should override file
      expect(result.config.ui?.enableAnimations).toBe(false);
      expect(result.config.ui?.showPreparationProgress).toBe(false);
    });

    it('should validate UI config and warn on invalid values', () => {
      const config = {
        ui: {
          terminalWidth: 1000, // Invalid - too large
          colorScheme: 'invalid-scheme'
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));

      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('terminalWidth'))).toBe(true);
      expect(result.warnings.some(w => w.includes('colorScheme'))).toBe(true);
    });
  });

  describe('Color Scheme Selection', () => {
    it('should use default color scheme', () => {
      const config = {
        ui: {
          colorScheme: 'default',
          enableColors: true
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      const colorScheme = getActiveColorScheme(result.config.ui!);
      expect(colorScheme).toBe(DEFAULT_COLOR_SCHEME);
    });

    it('should use high-contrast color scheme', () => {
      const config = {
        ui: {
          colorScheme: 'high-contrast',
          enableColors: true
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      const colorScheme = getActiveColorScheme(result.config.ui!);
      expect(colorScheme).toBe(HIGH_CONTRAST_COLOR_SCHEME);
    });

    it('should use plain color scheme when colors disabled', () => {
      const config = {
        ui: {
          colorScheme: 'default',
          enableColors: false
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      const colorScheme = getActiveColorScheme(result.config.ui!);
      expect(colorScheme).toBe(PLAIN_COLOR_SCHEME);
    });
  });

  describe('Formatting Rules Selection', () => {
    it('should use compact rules for narrow terminal', () => {
      const config = {
        ui: {
          terminalWidth: 60
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      const rules = getActiveFormattingRules(result.config.ui!);
      expect(rules).toBe(COMPACT_FORMATTING_RULES);
    });

    it('should use wide rules for wide terminal', () => {
      const config = {
        ui: {
          terminalWidth: 150
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      const rules = getActiveFormattingRules(result.config.ui!);
      expect(rules).toBe(WIDE_FORMATTING_RULES);
    });

    it('should use default rules for normal terminal', () => {
      const config = {
        ui: {
          terminalWidth: 100
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      const rules = getActiveFormattingRules(result.config.ui!);
      expect(rules).toBe(DEFAULT_FORMATTING_RULES);
    });
  });

  describe('Accessibility Configuration', () => {
    it('should support full accessibility mode', () => {
      const config = {
        ui: {
          enableColors: false,
          enableAnimations: false,
          colorScheme: 'plain',
          enableRichFormatting: false
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      expect(result.config.ui?.enableColors).toBe(false);
      expect(result.config.ui?.enableAnimations).toBe(false);
      expect(result.config.ui?.colorScheme).toBe('plain');
      expect(result.config.ui?.enableRichFormatting).toBe(false);
      
      const colorScheme = getActiveColorScheme(result.config.ui!);
      expect(colorScheme).toBe(PLAIN_COLOR_SCHEME);
    });
  });

  describe('Environment Variable Integration', () => {
    beforeEach(() => {
      // Clear any existing UI env vars
      delete process.env.DEBATE_UI_ENABLE_COLORS;
      delete process.env.DEBATE_UI_ENABLE_ANIMATIONS;
      delete process.env.DEBATE_UI_COLOR_SCHEME;
      delete process.env.DEBATE_UI_TERMINAL_WIDTH;
    });

    it('should load UI config from environment variables', () => {
      process.env.DEBATE_UI_ENABLE_COLORS = 'false';
      process.env.DEBATE_UI_ENABLE_ANIMATIONS = 'false';
      process.env.DEBATE_UI_COLOR_SCHEME = 'plain';

      const result = configManager.loadAndMerge({});
      
      expect(result.config.ui?.enableColors).toBe(false);
      expect(result.config.ui?.enableAnimations).toBe(false);
      expect(result.config.ui?.colorScheme).toBe('plain');
    });

    it('should prioritize CLI over environment variables', () => {
      process.env.DEBATE_UI_ENABLE_COLORS = 'false';

      const cliConfig: Partial<DebateConfig> = {
        ui: {
          enableColors: true
        } as UIConfig
      };

      const result = configManager.loadAndMerge(cliConfig);
      
      expect(result.config.ui?.enableColors).toBe(true);
    });
  });

  describe('Feature Flags', () => {
    it('should support all feature flags', () => {
      const config = {
        ui: {
          enableRichFormatting: false,
          enableAnimations: false,
          enableColors: false,
          showPreparationProgress: false,
          enableHyperlinks: false
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      expect(result.config.ui?.enableRichFormatting).toBe(false);
      expect(result.config.ui?.enableAnimations).toBe(false);
      expect(result.config.ui?.enableColors).toBe(false);
      expect(result.config.ui?.showPreparationProgress).toBe(false);
      expect(result.config.ui?.enableHyperlinks).toBe(false);
    });
  });

  describe('Custom Color Scheme', () => {
    it('should support custom color scheme', () => {
      const customScheme = {
        affirmative: '\x1b[32m',
        negative: '\x1b[31m',
        success: '\x1b[32m',
        warning: '\x1b[33m',
        error: '\x1b[31m',
        info: '\x1b[34m',
        primary: '\x1b[97m',
        secondary: '\x1b[37m',
        muted: '\x1b[90m',
        accent: '\x1b[93m',
        bold: '\x1b[1m',
        italic: '\x1b[3m',
        code: '\x1b[32m',
        quote: '\x1b[36m',
        boxBorder: '\x1b[36m',
        boxBackground: '\x1b[0m'
      };

      const config = {
        ui: {
          colorScheme: 'custom',
          customColorScheme: customScheme
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      expect(result.config.ui?.colorScheme).toBe('custom');
      expect(result.config.ui?.customColorScheme).toBeDefined();
    });
  });

  describe('Terminal Width Override', () => {
    it('should support terminal width override', () => {
      const config = {
        ui: {
          terminalWidth: 120
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      expect(result.config.ui?.terminalWidth).toBe(120);
    });

    it('should reject invalid terminal width', () => {
      const config = {
        ui: {
          terminalWidth: 30 // Too small
        }
      };

      fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      expect(result.warnings.some(w => w.includes('terminalWidth'))).toBe(true);
    });
  });
});
