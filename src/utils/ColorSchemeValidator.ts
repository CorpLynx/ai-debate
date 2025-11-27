/**
 * Color Scheme Validator
 * 
 * Ensures consistent application of color schemes across all UI elements.
 * 
 * Requirements:
 * - 9.1: Use colors from a consistent palette
 * - 9.4: Use muted colors for metadata and secondary information
 * - 9.5: Use highlighting that is visually distinct but harmonious for interactive elements
 */

import { ColorScheme, DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../models/ColorScheme';

/**
 * Element type for color application
 */
export enum ElementType {
  // Position elements
  AFFIRMATIVE = 'affirmative',
  NEGATIVE = 'negative',
  
  // Semantic elements
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
  
  // UI elements
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  MUTED = 'muted',
  ACCENT = 'accent',
  
  // Emphasis elements
  BOLD = 'bold',
  ITALIC = 'italic',
  CODE = 'code',
  QUOTE = 'quote',
  
  // Box elements
  BOX_BORDER = 'boxBorder',
  BOX_BACKGROUND = 'boxBackground',
  
  // Interactive elements
  INTERACTIVE = 'interactive',
  INTERACTIVE_HOVER = 'interactiveHover',
  
  // Metadata elements
  METADATA = 'metadata',
  METADATA_LABEL = 'metadataLabel',
  METADATA_VALUE = 'metadataValue'
}

/**
 * Validates that a color scheme has all required properties
 * 
 * Requirement 9.1: Ensure all UI elements use colors from a consistent palette
 * 
 * @param scheme Color scheme to validate
 * @returns true if valid, false otherwise
 */
export function validateColorScheme(scheme: ColorScheme): boolean {
  const requiredProperties: (keyof ColorScheme)[] = [
    'affirmative',
    'negative',
    'success',
    'warning',
    'error',
    'info',
    'primary',
    'secondary',
    'muted',
    'accent',
    'bold',
    'italic',
    'code',
    'quote',
    'boxBorder',
    'boxBackground'
  ];
  
  // Check that all required properties exist
  for (const prop of requiredProperties) {
    if (!(prop in scheme)) {
      return false;
    }
  }
  
  // Check that color values are strings
  for (const prop of requiredProperties) {
    if (typeof scheme[prop] !== 'string') {
      return false;
    }
  }
  
  return true;
}

/**
 * Gets the appropriate color for an element type from the color scheme
 * 
 * Requirement 9.1: Ensure all UI elements use colors from a consistent palette
 * 
 * @param elementType Type of element
 * @param scheme Color scheme to use
 * @returns ANSI color code
 */
export function getColorForElement(
  elementType: ElementType,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  switch (elementType) {
    // Position colors
    case ElementType.AFFIRMATIVE:
      return scheme.affirmative;
    case ElementType.NEGATIVE:
      return scheme.negative;
    
    // Semantic colors
    case ElementType.SUCCESS:
      return scheme.success;
    case ElementType.WARNING:
      return scheme.warning;
    case ElementType.ERROR:
      return scheme.error;
    case ElementType.INFO:
      return scheme.info;
    
    // UI colors
    case ElementType.PRIMARY:
      return scheme.primary;
    case ElementType.SECONDARY:
      return scheme.secondary;
    case ElementType.MUTED:
      return scheme.muted;
    case ElementType.ACCENT:
      return scheme.accent;
    
    // Emphasis colors
    case ElementType.BOLD:
      return scheme.bold;
    case ElementType.ITALIC:
      return scheme.italic;
    case ElementType.CODE:
      return scheme.code;
    case ElementType.QUOTE:
      return scheme.quote;
    
    // Box colors
    case ElementType.BOX_BORDER:
      return scheme.boxBorder;
    case ElementType.BOX_BACKGROUND:
      return scheme.boxBackground;
    
    // Interactive elements - use accent color with bold for prominence
    // Requirement 9.5: Interactive element highlighting should be visually distinct
    case ElementType.INTERACTIVE:
      return scheme.accent;
    case ElementType.INTERACTIVE_HOVER:
      return scheme.bold;
    
    // Metadata elements - use muted colors
    // Requirement 9.4: Use muted colors for metadata and secondary information
    case ElementType.METADATA:
      return scheme.muted;
    case ElementType.METADATA_LABEL:
      return scheme.secondary;
    case ElementType.METADATA_VALUE:
      return scheme.muted;
    
    default:
      return scheme.primary;
  }
}

/**
 * Applies color to text with automatic reset
 * 
 * Requirement 9.1: Ensure all UI elements use colors from a consistent palette
 * 
 * @param text Text to colorize
 * @param elementType Type of element
 * @param scheme Color scheme to use
 * @returns Colorized text with reset code
 */
export function applyColor(
  text: string,
  elementType: ElementType,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  const color = getColorForElement(elementType, scheme);
  return `${color}${text}${ANSI_RESET}`;
}

/**
 * Formats metadata with consistent muted colors
 * 
 * Requirement 9.4: Use muted colors for metadata and secondary information
 * 
 * @param label Metadata label
 * @param value Metadata value
 * @param scheme Color scheme to use
 * @returns Formatted metadata string
 */
export function formatMetadata(
  label: string,
  value: string,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  const labelColor = getColorForElement(ElementType.METADATA_LABEL, scheme);
  const valueColor = getColorForElement(ElementType.METADATA_VALUE, scheme);
  
  return `${labelColor}${label}:${ANSI_RESET} ${valueColor}${value}${ANSI_RESET}`;
}

/**
 * Formats an interactive element with highlighting
 * 
 * Requirement 9.5: Interactive element highlighting should be visually distinct but harmonious
 * 
 * @param text Text to format
 * @param isActive Whether the element is currently active/selected
 * @param scheme Color scheme to use
 * @returns Formatted interactive element string
 */
export function formatInteractiveElement(
  text: string,
  isActive: boolean = false,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  if (isActive) {
    // Active elements use bold accent color for prominence
    const color = getColorForElement(ElementType.INTERACTIVE_HOVER, scheme);
    const accentColor = getColorForElement(ElementType.ACCENT, scheme);
    return `${color}${accentColor}${text}${ANSI_RESET}`;
  } else {
    // Inactive elements use regular accent color
    const color = getColorForElement(ElementType.INTERACTIVE, scheme);
    return `${color}${text}${ANSI_RESET}`;
  }
}

/**
 * Checks if a string contains only colors from the defined palette
 * 
 * Requirement 9.1: Ensure all UI elements use colors from a consistent palette
 * 
 * @param text Text to check
 * @param scheme Color scheme to validate against
 * @returns true if all colors are from the palette
 */
export function usesConsistentColors(
  text: string,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): boolean {
  // Extract all ANSI color codes from the text
  const ansiColorRegex = /\x1b\[[0-9;]*m/g;
  const matches = text.match(ansiColorRegex);
  
  if (!matches) {
    return true; // No colors used
  }
  
  // Get all valid colors from the scheme
  const validColors = new Set<string>(Object.values(scheme));
  validColors.add(ANSI_RESET); // Reset is always valid
  
  // Check if all found colors are in the valid set
  for (const match of matches) {
    if (!validColors.has(match)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Strips all ANSI color codes from text
 * 
 * @param text Text to strip
 * @returns Text without ANSI codes
 */
export function stripColors(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Replaces any non-palette colors with palette colors
 * 
 * Requirement 9.1: Ensure all UI elements use colors from a consistent palette
 * 
 * @param text Text to normalize
 * @param scheme Color scheme to use
 * @returns Text with normalized colors
 */
export function normalizeColors(
  text: string,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  // Map of common ANSI codes to palette colors
  const colorMap: Record<string, string> = {
    '\x1b[31m': scheme.error,      // Red -> error
    '\x1b[32m': scheme.success,    // Green -> success
    '\x1b[33m': scheme.warning,    // Yellow -> warning
    '\x1b[34m': scheme.info,       // Blue -> info
    '\x1b[35m': scheme.negative,   // Magenta -> negative
    '\x1b[36m': scheme.affirmative, // Cyan -> affirmative
    '\x1b[37m': scheme.secondary,  // White -> secondary
    '\x1b[90m': scheme.muted,      // Gray -> muted
    '\x1b[91m': scheme.error,      // Bright red -> error
    '\x1b[92m': scheme.success,    // Bright green -> success
    '\x1b[93m': scheme.accent,     // Bright yellow -> accent
    '\x1b[94m': scheme.info,       // Bright blue -> info
    '\x1b[95m': scheme.negative,   // Bright magenta -> negative
    '\x1b[96m': scheme.affirmative, // Bright cyan -> affirmative
    '\x1b[97m': scheme.primary     // Bright white -> primary
  };
  
  let normalized = text;
  for (const [oldColor, newColor] of Object.entries(colorMap)) {
    // Use split and join instead of regex for exact string replacement
    normalized = normalized.split(oldColor).join(newColor);
  }
  
  return normalized;
}

/**
 * Creates a color palette report showing all colors in the scheme
 * 
 * @param scheme Color scheme to report
 * @returns Formatted palette report
 */
export function createPaletteReport(scheme: ColorScheme = DEFAULT_COLOR_SCHEME): string {
  const lines: string[] = [];
  
  lines.push('');
  lines.push('Color Palette:');
  lines.push('─'.repeat(60));
  lines.push('');
  
  // Position colors
  lines.push('Position Colors:');
  lines.push(`  Affirmative: ${scheme.affirmative}████${ANSI_RESET}`);
  lines.push(`  Negative:    ${scheme.negative}████${ANSI_RESET}`);
  lines.push('');
  
  // Semantic colors
  lines.push('Semantic Colors:');
  lines.push(`  Success: ${scheme.success}████${ANSI_RESET}`);
  lines.push(`  Warning: ${scheme.warning}████${ANSI_RESET}`);
  lines.push(`  Error:   ${scheme.error}████${ANSI_RESET}`);
  lines.push(`  Info:    ${scheme.info}████${ANSI_RESET}`);
  lines.push('');
  
  // UI colors
  lines.push('UI Colors:');
  lines.push(`  Primary:   ${scheme.primary}████${ANSI_RESET}`);
  lines.push(`  Secondary: ${scheme.secondary}████${ANSI_RESET}`);
  lines.push(`  Muted:     ${scheme.muted}████${ANSI_RESET}`);
  lines.push(`  Accent:    ${scheme.accent}████${ANSI_RESET}`);
  lines.push('');
  
  // Emphasis colors
  lines.push('Emphasis Colors:');
  lines.push(`  Bold:   ${scheme.bold}Bold Text${ANSI_RESET}`);
  lines.push(`  Italic: ${scheme.italic}Italic Text${ANSI_RESET}`);
  lines.push(`  Code:   ${scheme.code}code${ANSI_RESET}`);
  lines.push(`  Quote:  ${scheme.quote}"quoted text"${ANSI_RESET}`);
  lines.push('');
  
  return lines.join('\n');
}

