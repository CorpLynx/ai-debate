import {
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
  HIGH_CONTRAST_COLOR_SCHEME,
  PLAIN_COLOR_SCHEME,
  ANSI_RESET
} from '../../src/models/ColorScheme';
import {
  FormattingRules,
  BoxStyle,
  DEFAULT_FORMATTING_RULES,
  COMPACT_FORMATTING_RULES,
  WIDE_FORMATTING_RULES,
  BOX_CHARS
} from '../../src/models/FormattingRules';
import {
  UIConfig,
  DEFAULT_UI_CONFIG,
  getActiveColorScheme,
  getActiveFormattingRules,
  createUIConfig,
  validateUIConfig
} from '../../src/models/UIConfig';
import {
  getTerminalSize,
  supportsColor,
  supportsHyperlinks,
  getEffectiveWidth
} from '../../src/utils/TerminalSize';

describe('Core Formatting Infrastructure', () => {
  describe('ColorScheme', () => {
    it('should have default color scheme with all required properties', () => {
      expect(DEFAULT_COLOR_SCHEME).toBeDefined();
      expect(DEFAULT_COLOR_SCHEME.affirmative).toBeDefined();
      expect(DEFAULT_COLOR_SCHEME.negative).toBeDefined();
      expect(DEFAULT_COLOR_SCHEME.success).toBeDefined();
      expect(DEFAULT_COLOR_SCHEME.error).toBeDefined();
      expect(DEFAULT_COLOR_SCHEME.primary).toBeDefined();
    });

    it('should have high contrast color scheme', () => {
      expect(HIGH_CONTRAST_COLOR_SCHEME).toBeDefined();
      expect(HIGH_CONTRAST_COLOR_SCHEME.affirmative).toBeDefined();
    });

    it('should have plain color scheme with empty strings', () => {
      expect(PLAIN_COLOR_SCHEME).toBeDefined();
      expect(PLAIN_COLOR_SCHEME.affirmative).toBe('');
      expect(PLAIN_COLOR_SCHEME.negative).toBe('');
    });

    it('should have ANSI reset code', () => {
      expect(ANSI_RESET).toBe('\x1b[0m');
    });
  });

  describe('FormattingRules', () => {
    it('should have default formatting rules', () => {
      expect(DEFAULT_FORMATTING_RULES).toBeDefined();
      expect(DEFAULT_FORMATTING_RULES.paragraphSpacing).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_FORMATTING_RULES.maxLineLength).toBeGreaterThan(0);
      expect(DEFAULT_FORMATTING_RULES.boxStyle).toBeDefined();
    });

    it('should have compact formatting rules for narrow terminals', () => {
      expect(COMPACT_FORMATTING_RULES).toBeDefined();
      expect(COMPACT_FORMATTING_RULES.maxLineLength).toBeLessThan(DEFAULT_FORMATTING_RULES.maxLineLength);
    });

    it('should have wide formatting rules for wide terminals', () => {
      expect(WIDE_FORMATTING_RULES).toBeDefined();
      expect(WIDE_FORMATTING_RULES.maxLineLength).toBeGreaterThan(DEFAULT_FORMATTING_RULES.maxLineLength);
    });

    it('should have box characters for all box styles', () => {
      expect(BOX_CHARS[BoxStyle.SINGLE]).toBeDefined();
      expect(BOX_CHARS[BoxStyle.DOUBLE]).toBeDefined();
      expect(BOX_CHARS[BoxStyle.ROUNDED]).toBeDefined();
      expect(BOX_CHARS[BoxStyle.HEAVY]).toBeDefined();
      
      expect(BOX_CHARS[BoxStyle.SINGLE].topLeft).toBe('┌');
      expect(BOX_CHARS[BoxStyle.ROUNDED].topLeft).toBe('╭');
    });
  });

  describe('TerminalSize', () => {
    it('should detect terminal size', () => {
      const size = getTerminalSize();
      expect(size).toBeDefined();
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
      expect(typeof size.isNarrow).toBe('boolean');
      expect(typeof size.isWide).toBe('boolean');
    });

    it('should return effective width with margin', () => {
      const width = getEffectiveWidth(4);
      expect(width).toBeGreaterThanOrEqual(40);
    });

    it('should detect color support', () => {
      const hasColor = supportsColor();
      expect(typeof hasColor).toBe('boolean');
    });

    it('should detect hyperlink support', () => {
      const hasHyperlinks = supportsHyperlinks();
      expect(typeof hasHyperlinks).toBe('boolean');
    });
  });

  describe('UIConfig', () => {
    it('should have default UI config', () => {
      expect(DEFAULT_UI_CONFIG).toBeDefined();
      expect(typeof DEFAULT_UI_CONFIG.enableRichFormatting).toBe('boolean');
      expect(typeof DEFAULT_UI_CONFIG.enableAnimations).toBe('boolean');
      expect(typeof DEFAULT_UI_CONFIG.enableColors).toBe('boolean');
    });

    it('should get active color scheme based on config', () => {
      const defaultScheme = getActiveColorScheme({ ...DEFAULT_UI_CONFIG, enableColors: true, colorScheme: 'default' });
      expect(defaultScheme).toEqual(DEFAULT_COLOR_SCHEME);

      const highContrastScheme = getActiveColorScheme({ ...DEFAULT_UI_CONFIG, enableColors: true, colorScheme: 'high-contrast' });
      expect(highContrastScheme).toEqual(HIGH_CONTRAST_COLOR_SCHEME);

      const plainScheme = getActiveColorScheme({ ...DEFAULT_UI_CONFIG, enableColors: false, colorScheme: 'default' });
      expect(plainScheme).toEqual(PLAIN_COLOR_SCHEME);
    });

    it('should get active formatting rules based on terminal size', () => {
      const rules = getActiveFormattingRules(DEFAULT_UI_CONFIG);
      expect(rules).toBeDefined();
      expect(rules.maxLineLength).toBeGreaterThan(0);
    });

    it('should create UI config with overrides', () => {
      const config = createUIConfig({ enableAnimations: false });
      expect(config.enableAnimations).toBe(false);
      expect(config.enableRichFormatting).toBeDefined();
    });

    it('should validate UI config', () => {
      expect(validateUIConfig(DEFAULT_UI_CONFIG)).toBe(true);
      
      const invalidConfig: UIConfig = { ...DEFAULT_UI_CONFIG, terminalWidth: 10 };
      expect(validateUIConfig(invalidConfig)).toBe(false);
      
      const customWithoutScheme: UIConfig = { ...DEFAULT_UI_CONFIG, colorScheme: 'custom' };
      expect(validateUIConfig(customWithoutScheme)).toBe(false);
    });

    it('should use custom formatting rules when provided', () => {
      const customRules: FormattingRules = {
        ...DEFAULT_FORMATTING_RULES,
        maxLineLength: 150
      };
      
      const config: UIConfig = {
        ...DEFAULT_UI_CONFIG,
        customFormattingRules: customRules
      };
      
      const rules = getActiveFormattingRules(config);
      expect(rules.maxLineLength).toBe(150);
    });
  });

  describe('Integration', () => {
    it('should work together to provide complete formatting configuration', () => {
      const config = createUIConfig();
      const colorScheme = getActiveColorScheme(config);
      const formattingRules = getActiveFormattingRules(config);
      const terminalSize = getTerminalSize();
      
      expect(config).toBeDefined();
      expect(colorScheme).toBeDefined();
      expect(formattingRules).toBeDefined();
      expect(terminalSize).toBeDefined();
      
      // Verify they can be used together
      expect(colorScheme.affirmative).toBeDefined();
      expect(formattingRules.maxLineLength).toBeGreaterThan(0);
      expect(terminalSize.width).toBeGreaterThan(0);
    });
  });
});
