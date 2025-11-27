import { 
  UIConfig, 
  DEFAULT_UI_CONFIG, 
  createUIConfig, 
  validateUIConfig,
  getActiveColorScheme,
  getActiveFormattingRules,
  ColorSchemeType
} from '../../src/models/UIConfig';
import { DEFAULT_COLOR_SCHEME, HIGH_CONTRAST_COLOR_SCHEME, PLAIN_COLOR_SCHEME } from '../../src/models/ColorScheme';
import { DEFAULT_FORMATTING_RULES, COMPACT_FORMATTING_RULES, WIDE_FORMATTING_RULES } from '../../src/models/FormattingRules';

describe('UIConfig', () => {
  describe('DEFAULT_UI_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_UI_CONFIG.enableRichFormatting).toBe(true);
      expect(DEFAULT_UI_CONFIG.enableAnimations).toBe(true);
      expect(DEFAULT_UI_CONFIG.colorScheme).toBe('default');
      expect(DEFAULT_UI_CONFIG.showPreparationProgress).toBe(true);
    });
  });

  describe('createUIConfig', () => {
    it('should create config with defaults', () => {
      const config = createUIConfig();
      expect(config.enableRichFormatting).toBe(true);
      expect(config.colorScheme).toBe('default');
    });

    it('should merge overrides with defaults', () => {
      const config = createUIConfig({
        enableColors: false,
        colorScheme: 'plain'
      });
      expect(config.enableColors).toBe(false);
      expect(config.colorScheme).toBe('plain');
      expect(config.enableRichFormatting).toBe(true); // Default preserved
    });

    it('should disable animations in CI environment', () => {
      const originalCI = process.env.CI;
      process.env.CI = 'true';
      
      const config = createUIConfig();
      expect(config.enableAnimations).toBe(false);
      
      // Restore
      if (originalCI === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = originalCI;
      }
    });
  });

  describe('validateUIConfig', () => {
    it('should validate valid config', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: true,
        enableHyperlinks: true
      };
      expect(validateUIConfig(config)).toBe(true);
    });

    it('should reject invalid terminal width (too small)', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 30
      };
      expect(validateUIConfig(config)).toBe(false);
    });

    it('should reject invalid terminal width (too large)', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 600
      };
      expect(validateUIConfig(config)).toBe(false);
    });

    it('should accept valid terminal width', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 100
      };
      expect(validateUIConfig(config)).toBe(true);
    });

    it('should reject custom color scheme without customColorScheme', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'custom'
      };
      expect(validateUIConfig(config)).toBe(false);
    });

    it('should accept custom color scheme with customColorScheme', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'custom',
        customColorScheme: DEFAULT_COLOR_SCHEME
      };
      expect(validateUIConfig(config)).toBe(true);
    });
  });

  describe('getActiveColorScheme', () => {
    it('should return default color scheme', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'default'
      };
      const scheme = getActiveColorScheme(config);
      expect(scheme).toBe(DEFAULT_COLOR_SCHEME);
    });

    it('should return high-contrast color scheme', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'high-contrast'
      };
      const scheme = getActiveColorScheme(config);
      expect(scheme).toBe(HIGH_CONTRAST_COLOR_SCHEME);
    });

    it('should return plain color scheme', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'plain'
      };
      const scheme = getActiveColorScheme(config);
      expect(scheme).toBe(PLAIN_COLOR_SCHEME);
    });

    it('should return plain color scheme when colors disabled', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        enableColors: false,
        colorScheme: 'default'
      };
      const scheme = getActiveColorScheme(config);
      expect(scheme).toBe(PLAIN_COLOR_SCHEME);
    });

    it('should return custom color scheme', () => {
      const customScheme = { ...DEFAULT_COLOR_SCHEME };
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'custom',
        customColorScheme: customScheme
      };
      const scheme = getActiveColorScheme(config);
      expect(scheme).toBe(customScheme);
    });

    it('should fallback to default when custom scheme not provided', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'custom'
      };
      const scheme = getActiveColorScheme(config);
      expect(scheme).toBe(DEFAULT_COLOR_SCHEME);
    });
  });

  describe('getActiveFormattingRules', () => {
    it('should return custom formatting rules when provided', () => {
      const customRules = { ...DEFAULT_FORMATTING_RULES };
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        customFormattingRules: customRules
      };
      const rules = getActiveFormattingRules(config);
      expect(rules).toBe(customRules);
    });

    it('should return compact rules for narrow terminal', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 60
      };
      const rules = getActiveFormattingRules(config);
      expect(rules).toBe(COMPACT_FORMATTING_RULES);
    });

    it('should return wide rules for wide terminal', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 150
      };
      const rules = getActiveFormattingRules(config);
      expect(rules).toBe(WIDE_FORMATTING_RULES);
    });

    it('should return default rules for normal terminal', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 100
      };
      const rules = getActiveFormattingRules(config);
      expect(rules).toBe(DEFAULT_FORMATTING_RULES);
    });
  });

  describe('Color Scheme Types', () => {
    it('should support all color scheme types', () => {
      const schemes: ColorSchemeType[] = ['default', 'high-contrast', 'plain', 'custom'];
      
      schemes.forEach(scheme => {
        const config: UIConfig = {
          ...DEFAULT_UI_CONFIG,
          colorScheme: scheme,
          customColorScheme: scheme === 'custom' ? DEFAULT_COLOR_SCHEME : undefined
        };
        
        if (scheme === 'custom') {
          expect(validateUIConfig(config)).toBe(true);
        } else {
          expect(validateUIConfig(config)).toBe(true);
        }
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should support disabling colors for accessibility', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        enableColors: false
      };
      expect(validateUIConfig(config)).toBe(true);
      expect(getActiveColorScheme(config)).toBe(PLAIN_COLOR_SCHEME);
    });

    it('should support disabling animations for accessibility', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        enableAnimations: false
      };
      expect(validateUIConfig(config)).toBe(true);
    });

    it('should support plain color scheme for accessibility', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        colorScheme: 'plain'
      };
      expect(validateUIConfig(config)).toBe(true);
      expect(getActiveColorScheme(config)).toBe(PLAIN_COLOR_SCHEME);
    });
  });

  describe('Terminal Width Override', () => {
    it('should allow terminal width override', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: 120
      };
      expect(validateUIConfig(config)).toBe(true);
    });

    it('should use auto-detection when terminalWidth is undefined', () => {
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        terminalWidth: undefined
      };
      expect(validateUIConfig(config)).toBe(true);
    });
  });

  describe('Feature Flags', () => {
    it('should support enabling/disabling rich formatting', () => {
      const enabled: UIConfig = { ...DEFAULT_UI_CONFIG, enableRichFormatting: true };
      const disabled: UIConfig = { ...DEFAULT_UI_CONFIG, enableRichFormatting: false };
      
      expect(validateUIConfig(enabled)).toBe(true);
      expect(validateUIConfig(disabled)).toBe(true);
    });

    it('should support enabling/disabling animations', () => {
      const enabled: UIConfig = { ...DEFAULT_UI_CONFIG, enableAnimations: true };
      const disabled: UIConfig = { ...DEFAULT_UI_CONFIG, enableAnimations: false };
      
      expect(validateUIConfig(enabled)).toBe(true);
      expect(validateUIConfig(disabled)).toBe(true);
    });

    it('should support enabling/disabling hyperlinks', () => {
      const enabled: UIConfig = { ...DEFAULT_UI_CONFIG, enableHyperlinks: true };
      const disabled: UIConfig = { ...DEFAULT_UI_CONFIG, enableHyperlinks: false };
      
      expect(validateUIConfig(enabled)).toBe(true);
      expect(validateUIConfig(disabled)).toBe(true);
    });

    it('should support showing/hiding preparation progress', () => {
      const show: UIConfig = { ...DEFAULT_UI_CONFIG, showPreparationProgress: true };
      const hide: UIConfig = { ...DEFAULT_UI_CONFIG, showPreparationProgress: false };
      
      expect(validateUIConfig(show)).toBe(true);
      expect(validateUIConfig(hide)).toBe(true);
    });
  });
});
