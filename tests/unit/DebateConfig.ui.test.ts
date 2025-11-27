import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { DEFAULT_UI_CONFIG, createUIConfig } from '../../src/models/UIConfig';
import { DEFAULT_COLOR_SCHEME } from '../../src/models/ColorScheme';
import { DEFAULT_FORMATTING_RULES } from '../../src/models/FormattingRules';

describe('DebateConfig UI Integration', () => {
  it('should include UI configuration in default config', () => {
    expect(DEFAULT_CONFIG.ui).toBeDefined();
    expect(DEFAULT_CONFIG.ui).toEqual(DEFAULT_UI_CONFIG);
  });

  it('should allow custom UI configuration', () => {
    const customConfig: DebateConfig = {
      ...DEFAULT_CONFIG,
      ui: createUIConfig({
        enableAnimations: false,
        colorScheme: 'high-contrast'
      })
    };

    expect(customConfig.ui?.enableAnimations).toBe(false);
    expect(customConfig.ui?.colorScheme).toBe('high-contrast');
  });

  it('should work without UI configuration (optional)', () => {
    const minimalConfig: DebateConfig = {
      strictMode: false,
      showPreparation: true,
      numCrossExamQuestions: 3
    };

    expect(minimalConfig.ui).toBeUndefined();
  });

  it('should support all UI configuration options', () => {
    const fullConfig: DebateConfig = {
      ...DEFAULT_CONFIG,
      ui: {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        terminalWidth: 100,
        showPreparationProgress: true,
        enableHyperlinks: true,
        customColorScheme: DEFAULT_COLOR_SCHEME,
        customFormattingRules: DEFAULT_FORMATTING_RULES
      }
    };

    expect(fullConfig.ui?.enableRichFormatting).toBe(true);
    expect(fullConfig.ui?.terminalWidth).toBe(100);
    expect(fullConfig.ui?.customColorScheme).toBeDefined();
    expect(fullConfig.ui?.customFormattingRules).toBeDefined();
  });
});
