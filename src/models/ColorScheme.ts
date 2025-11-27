/**
 * Defines the consistent color palette for the interface
 */
export interface ColorScheme {
  // Position colors
  affirmative: string;      // Cyan (#00BCD4)
  negative: string;         // Magenta (#E91E63)
  
  // Semantic colors
  success: string;          // Green (#4CAF50)
  warning: string;          // Yellow (#FFC107)
  error: string;            // Red (#F44336)
  info: string;             // Blue (#2196F3)
  
  // UI colors
  primary: string;          // Bright white
  secondary: string;        // Light gray
  muted: string;            // Dark gray
  accent: string;           // Gold (#FFD700)
  
  // Emphasis colors
  bold: string;             // Bright white + bold
  italic: string;           // Light gray + italic
  code: string;             // Green monospace
  quote: string;            // Cyan + dim
  
  // Background colors (for boxes)
  boxBorder: string;        // Cyan
  boxBackground: string;    // Default terminal background
}

/**
 * Default color scheme using ANSI color codes
 */
export const DEFAULT_COLOR_SCHEME: ColorScheme = {
  // Position colors
  affirmative: '\x1b[36m',      // Cyan
  negative: '\x1b[35m',         // Magenta
  
  // Semantic colors
  success: '\x1b[32m',          // Green
  warning: '\x1b[33m',          // Yellow
  error: '\x1b[31m',            // Red
  info: '\x1b[34m',             // Blue
  
  // UI colors
  primary: '\x1b[97m',          // Bright white
  secondary: '\x1b[37m',        // Light gray
  muted: '\x1b[90m',            // Dark gray
  accent: '\x1b[93m',           // Bright yellow (gold)
  
  // Emphasis colors
  bold: '\x1b[1m\x1b[97m',      // Bold bright white
  italic: '\x1b[3m\x1b[37m',    // Italic light gray
  code: '\x1b[32m',             // Green
  quote: '\x1b[2m\x1b[36m',     // Dim cyan
  
  // Background colors (for boxes)
  boxBorder: '\x1b[36m',        // Cyan
  boxBackground: '\x1b[0m'      // Reset (default terminal background)
};

/**
 * High contrast color scheme for accessibility
 */
export const HIGH_CONTRAST_COLOR_SCHEME: ColorScheme = {
  // Position colors
  affirmative: '\x1b[96m',      // Bright cyan
  negative: '\x1b[95m',         // Bright magenta
  
  // Semantic colors
  success: '\x1b[92m',          // Bright green
  warning: '\x1b[93m',          // Bright yellow
  error: '\x1b[91m',            // Bright red
  info: '\x1b[94m',             // Bright blue
  
  // UI colors
  primary: '\x1b[97m',          // Bright white
  secondary: '\x1b[97m',        // Bright white
  muted: '\x1b[37m',            // White (less muted)
  accent: '\x1b[93m',           // Bright yellow
  
  // Emphasis colors
  bold: '\x1b[1m\x1b[97m',      // Bold bright white
  italic: '\x1b[1m\x1b[97m',    // Bold bright white (no italic)
  code: '\x1b[92m',             // Bright green
  quote: '\x1b[96m',            // Bright cyan
  
  // Background colors (for boxes)
  boxBorder: '\x1b[96m',        // Bright cyan
  boxBackground: '\x1b[0m'      // Reset
};

/**
 * Plain color scheme (no colors) for accessibility
 */
export const PLAIN_COLOR_SCHEME: ColorScheme = {
  affirmative: '',
  negative: '',
  success: '',
  warning: '',
  error: '',
  info: '',
  primary: '',
  secondary: '',
  muted: '',
  accent: '',
  bold: '\x1b[1m',              // Keep bold for emphasis
  italic: '',
  code: '',
  quote: '',
  boxBorder: '',
  boxBackground: ''
};

/**
 * ANSI reset code to clear all formatting
 */
export const ANSI_RESET = '\x1b[0m';
