import { ColorScheme, DEFAULT_COLOR_SCHEME, HIGH_CONTRAST_COLOR_SCHEME, PLAIN_COLOR_SCHEME } from './ColorScheme';
import { FormattingRules, DEFAULT_FORMATTING_RULES, COMPACT_FORMATTING_RULES, WIDE_FORMATTING_RULES } from './FormattingRules';
import { supportsColor, supportsHyperlinks, getTerminalSize } from '../utils/TerminalSize';
import { validateColorScheme } from '../utils/ColorSchemeValidator';

/**
 * Color scheme options
 */
export type ColorSchemeType = 'default' | 'high-contrast' | 'plain' | 'custom';

/**
 * UI configuration options
 */
export interface UIConfig {
  enableRichFormatting: boolean;      // Enable/disable rich text features
  enableAnimations: boolean;          // Enable/disable animations
  enableColors: boolean;              // Enable/disable colors
  colorScheme: ColorSchemeType;       // Color scheme selection
  terminalWidth?: number;             // Override auto-detection
  showPreparationProgress: boolean;   // Show progress bars vs raw output
  enableHyperlinks: boolean;          // Enable clickable links
  customColorScheme?: ColorScheme;    // Custom color scheme
  customFormattingRules?: FormattingRules; // Custom formatting rules
}

/**
 * Default UI configuration
 */
export const DEFAULT_UI_CONFIG: UIConfig = {
  enableRichFormatting: true,
  enableAnimations: true,
  enableColors: supportsColor(),
  colorScheme: 'default',
  terminalWidth: undefined, // Auto-detect
  showPreparationProgress: true,
  enableHyperlinks: supportsHyperlinks()
};

/**
 * Gets the active color scheme based on configuration
 * @param config UI configuration
 * @returns Active color scheme
 */
export function getActiveColorScheme(config: UIConfig): ColorScheme {
  if (!config.enableColors) {
    return PLAIN_COLOR_SCHEME;
  }
  
  switch (config.colorScheme) {
    case 'high-contrast':
      return HIGH_CONTRAST_COLOR_SCHEME;
    case 'plain':
      return PLAIN_COLOR_SCHEME;
    case 'custom':
      return config.customColorScheme || DEFAULT_COLOR_SCHEME;
    case 'default':
    default:
      return DEFAULT_COLOR_SCHEME;
  }
}

/**
 * Gets the active formatting rules based on configuration and terminal size
 * @param config UI configuration
 * @returns Active formatting rules
 */
export function getActiveFormattingRules(config: UIConfig): FormattingRules {
  // Use custom rules if provided
  if (config.customFormattingRules) {
    return config.customFormattingRules;
  }
  
  // Determine terminal size
  const terminalSize = getTerminalSize();
  const width = config.terminalWidth || terminalSize.width;
  
  // Select rules based on width
  if (width < 80) {
    return COMPACT_FORMATTING_RULES;
  } else if (width > 120) {
    return WIDE_FORMATTING_RULES;
  } else {
    return DEFAULT_FORMATTING_RULES;
  }
}

/**
 * Creates a UI config with sensible defaults for the current environment
 * @param overrides Optional configuration overrides
 * @returns UI configuration
 */
export function createUIConfig(overrides?: Partial<UIConfig>): UIConfig {
  const defaults = { ...DEFAULT_UI_CONFIG };
  
  // Auto-detect capabilities
  defaults.enableColors = supportsColor();
  defaults.enableHyperlinks = supportsHyperlinks();
  
  // Disable animations in CI environments
  if (process.env.CI !== undefined) {
    defaults.enableAnimations = false;
  }
  
  return {
    ...defaults,
    ...overrides
  };
}

/**
 * Validates UI configuration
 * 
 * Requirement 9.1: Ensure all UI elements use colors from a consistent palette
 * 
 * @param config UI configuration to validate
 * @returns true if valid
 */
export function validateUIConfig(config: UIConfig): boolean {
  // Check terminal width if specified
  if (config.terminalWidth !== undefined) {
    if (config.terminalWidth < 40 || config.terminalWidth > 500) {
      return false;
    }
  }
  
  // Check custom color scheme if using custom
  if (config.colorScheme === 'custom') {
    if (!config.customColorScheme) {
      return false;
    }
    // Validate the custom color scheme has all required properties
    if (!validateColorScheme(config.customColorScheme)) {
      return false;
    }
  }
  
  return true;
}
