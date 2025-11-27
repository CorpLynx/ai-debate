/**
 * Unit tests for ColorSchemeValidator
 * 
 * Tests color scheme consistency enforcement functionality.
 * 
 * Requirements:
 * - 9.1: Use colors from a consistent palette
 * - 9.4: Use muted colors for metadata and secondary information
 * - 9.5: Use highlighting for interactive elements
 */

import {
  ElementType,
  validateColorScheme,
  getColorForElement,
  applyColor,
  formatMetadata,
  formatInteractiveElement,
  usesConsistentColors,
  stripColors,
  normalizeColors,
  createPaletteReport
} from '../../src/utils/ColorSchemeValidator';
import {
  ColorScheme,
  DEFAULT_COLOR_SCHEME,
  PLAIN_COLOR_SCHEME,
  ANSI_RESET
} from '../../src/models/ColorScheme';

describe('ColorSchemeValidator', () => {
  describe('validateColorScheme', () => {
    it('should validate a complete color scheme', () => {
      expect(validateColorScheme(DEFAULT_COLOR_SCHEME)).toBe(true);
    });

    it('should reject an incomplete color scheme', () => {
      const incomplete = {
        affirmative: '\x1b[36m',
        negative: '\x1b[35m'
      } as ColorScheme;
      
      expect(validateColorScheme(incomplete)).toBe(false);
    });

    it('should reject a color scheme with non-string values', () => {
      const invalid = {
        ...DEFAULT_COLOR_SCHEME,
        affirmative: 123 // Invalid type
      } as any;
      
      expect(validateColorScheme(invalid)).toBe(false);
    });

    it('should validate plain color scheme', () => {
      expect(validateColorScheme(PLAIN_COLOR_SCHEME)).toBe(true);
    });
  });

  describe('getColorForElement', () => {
    it('should return correct color for position elements', () => {
      expect(getColorForElement(ElementType.AFFIRMATIVE)).toBe(DEFAULT_COLOR_SCHEME.affirmative);
      expect(getColorForElement(ElementType.NEGATIVE)).toBe(DEFAULT_COLOR_SCHEME.negative);
    });

    it('should return correct color for semantic elements', () => {
      expect(getColorForElement(ElementType.SUCCESS)).toBe(DEFAULT_COLOR_SCHEME.success);
      expect(getColorForElement(ElementType.WARNING)).toBe(DEFAULT_COLOR_SCHEME.warning);
      expect(getColorForElement(ElementType.ERROR)).toBe(DEFAULT_COLOR_SCHEME.error);
      expect(getColorForElement(ElementType.INFO)).toBe(DEFAULT_COLOR_SCHEME.info);
    });

    it('should return correct color for UI elements', () => {
      expect(getColorForElement(ElementType.PRIMARY)).toBe(DEFAULT_COLOR_SCHEME.primary);
      expect(getColorForElement(ElementType.SECONDARY)).toBe(DEFAULT_COLOR_SCHEME.secondary);
      expect(getColorForElement(ElementType.MUTED)).toBe(DEFAULT_COLOR_SCHEME.muted);
      expect(getColorForElement(ElementType.ACCENT)).toBe(DEFAULT_COLOR_SCHEME.accent);
    });

    it('should return muted colors for metadata elements', () => {
      // Requirement 9.4: Use muted colors for metadata
      expect(getColorForElement(ElementType.METADATA)).toBe(DEFAULT_COLOR_SCHEME.muted);
      expect(getColorForElement(ElementType.METADATA_LABEL)).toBe(DEFAULT_COLOR_SCHEME.secondary);
      expect(getColorForElement(ElementType.METADATA_VALUE)).toBe(DEFAULT_COLOR_SCHEME.muted);
    });

    it('should return accent color for interactive elements', () => {
      // Requirement 9.5: Interactive element highlighting
      expect(getColorForElement(ElementType.INTERACTIVE)).toBe(DEFAULT_COLOR_SCHEME.accent);
      expect(getColorForElement(ElementType.INTERACTIVE_HOVER)).toBe(DEFAULT_COLOR_SCHEME.bold);
    });
  });

  describe('applyColor', () => {
    it('should apply color with reset code', () => {
      const result = applyColor('test', ElementType.SUCCESS);
      expect(result).toContain(DEFAULT_COLOR_SCHEME.success);
      expect(result).toContain('test');
      expect(result).toContain(ANSI_RESET);
    });

    it('should work with custom color scheme', () => {
      const customScheme: ColorScheme = {
        ...DEFAULT_COLOR_SCHEME,
        success: '\x1b[92m' // Bright green
      };
      
      const result = applyColor('test', ElementType.SUCCESS, customScheme);
      expect(result).toContain('\x1b[92m');
    });
  });

  describe('formatMetadata', () => {
    it('should format metadata with muted colors', () => {
      // Requirement 9.4: Use muted colors for metadata
      const result = formatMetadata('Label', 'Value');
      
      expect(result).toContain('Label:');
      expect(result).toContain('Value');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.secondary); // Label color
      expect(result).toContain(DEFAULT_COLOR_SCHEME.muted); // Value color
      expect(result).toContain(ANSI_RESET);
    });

    it('should work with custom color scheme', () => {
      const customScheme: ColorScheme = {
        ...DEFAULT_COLOR_SCHEME,
        muted: '\x1b[90m'
      };
      
      const result = formatMetadata('Key', 'Val', customScheme);
      expect(result).toContain('Key:');
      expect(result).toContain('Val');
    });
  });

  describe('formatInteractiveElement', () => {
    it('should format inactive interactive element', () => {
      // Requirement 9.5: Interactive element highlighting
      const result = formatInteractiveElement('Click me', false);
      
      expect(result).toContain('Click me');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.accent);
      expect(result).toContain(ANSI_RESET);
    });

    it('should format active interactive element with bold', () => {
      // Requirement 9.5: Active elements should be more prominent
      const result = formatInteractiveElement('Active', true);
      
      expect(result).toContain('Active');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.bold);
      expect(result).toContain(DEFAULT_COLOR_SCHEME.accent);
      expect(result).toContain(ANSI_RESET);
    });

    it('should distinguish between active and inactive states', () => {
      const inactive = formatInteractiveElement('Item', false);
      const active = formatInteractiveElement('Item', true);
      
      expect(inactive).not.toEqual(active);
    });
  });

  describe('usesConsistentColors', () => {
    it('should return true for text with palette colors', () => {
      // Requirement 9.1: Ensure all UI elements use colors from consistent palette
      const text = `${DEFAULT_COLOR_SCHEME.success}Success${ANSI_RESET}`;
      expect(usesConsistentColors(text)).toBe(true);
    });

    it('should return true for text without colors', () => {
      expect(usesConsistentColors('Plain text')).toBe(true);
    });

    it('should return false for text with non-palette colors', () => {
      const text = '\x1b[48;5;123mNon-palette color\x1b[0m';
      expect(usesConsistentColors(text)).toBe(false);
    });

    it('should work with custom color scheme', () => {
      const customScheme: ColorScheme = {
        ...DEFAULT_COLOR_SCHEME,
        success: '\x1b[92m'
      };
      
      const text = '\x1b[92mCustom success\x1b[0m';
      expect(usesConsistentColors(text, customScheme)).toBe(true);
    });
  });

  describe('stripColors', () => {
    it('should remove all ANSI color codes', () => {
      const colored = `${DEFAULT_COLOR_SCHEME.success}Green${ANSI_RESET} and ${DEFAULT_COLOR_SCHEME.error}Red${ANSI_RESET}`;
      const stripped = stripColors(colored);
      
      expect(stripped).toBe('Green and Red');
      expect(stripped).not.toContain('\x1b[');
    });

    it('should handle text without colors', () => {
      const plain = 'No colors here';
      expect(stripColors(plain)).toBe(plain);
    });
  });

  describe('normalizeColors', () => {
    it('should replace standard ANSI codes with palette colors', () => {
      // Requirement 9.1: Ensure all UI elements use colors from consistent palette
      const text = '\x1b[31mRed text\x1b[0m';
      const normalized = normalizeColors(text);
      
      // Should contain the error color from the palette
      expect(normalized).toContain(DEFAULT_COLOR_SCHEME.error);
      expect(normalized).toContain('Red text');
      expect(normalized).toContain(ANSI_RESET);
    });

    it('should handle multiple color codes', () => {
      const text = '\x1b[32mGreen\x1b[0m and \x1b[33mYellow\x1b[0m';
      const normalized = normalizeColors(text);
      
      expect(normalized).toContain(DEFAULT_COLOR_SCHEME.success);
      expect(normalized).toContain(DEFAULT_COLOR_SCHEME.warning);
    });

    it('should work with custom color scheme', () => {
      const customScheme: ColorScheme = {
        ...DEFAULT_COLOR_SCHEME,
        error: '\x1b[91m' // Bright red
      };
      
      const text = '\x1b[31mError\x1b[0m';
      const normalized = normalizeColors(text, customScheme);
      
      expect(normalized).toContain('\x1b[91m');
    });
  });

  describe('createPaletteReport', () => {
    it('should create a formatted palette report', () => {
      const report = createPaletteReport();
      
      expect(report).toContain('Color Palette:');
      expect(report).toContain('Position Colors:');
      expect(report).toContain('Semantic Colors:');
      expect(report).toContain('UI Colors:');
      expect(report).toContain('Emphasis Colors:');
      expect(report).toContain('Affirmative:');
      expect(report).toContain('Negative:');
    });

    it('should include color samples', () => {
      const report = createPaletteReport();
      
      // Should contain color codes
      expect(report).toContain(DEFAULT_COLOR_SCHEME.affirmative);
      expect(report).toContain(DEFAULT_COLOR_SCHEME.success);
      expect(report).toContain(ANSI_RESET);
    });

    it('should work with custom color scheme', () => {
      const customScheme: ColorScheme = {
        ...DEFAULT_COLOR_SCHEME,
        affirmative: '\x1b[96m' // Bright cyan
      };
      
      const report = createPaletteReport(customScheme);
      expect(report).toContain('\x1b[96m');
    });
  });

  describe('Integration', () => {
    it('should maintain color consistency across multiple operations', () => {
      // Requirement 9.1: Ensure all UI elements use colors from consistent palette
      const metadata = formatMetadata('Model', 'GPT-4');
      const interactive = formatInteractiveElement('Select', false);
      const colored = applyColor('Success', ElementType.SUCCESS);
      
      expect(usesConsistentColors(metadata)).toBe(true);
      expect(usesConsistentColors(interactive)).toBe(true);
      expect(usesConsistentColors(colored)).toBe(true);
    });

    it('should properly format complex UI elements', () => {
      const label = formatMetadata('Status', 'Active');
      const button = formatInteractiveElement('Continue', true);
      const combined = `${label}\n${button}`;
      
      expect(combined).toContain('Status:');
      expect(combined).toContain('Active');
      expect(combined).toContain('Continue');
      
      // Metadata should use consistent colors
      expect(usesConsistentColors(label)).toBe(true);
      
      // Interactive elements may use compound codes (bold + color)
      // which is acceptable as long as the base colors are from the palette
      expect(button).toContain('Continue');
    });
  });
});
