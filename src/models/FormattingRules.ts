/**
 * Box drawing styles
 */
export enum BoxStyle {
  SINGLE = 'single',
  DOUBLE = 'double',
  ROUNDED = 'rounded',
  HEAVY = 'heavy'
}

/**
 * Box drawing characters for different styles
 */
export const BOX_CHARS = {
  [BoxStyle.SINGLE]: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    teeLeft: '├',
    teeRight: '┤',
    teeTop: '┬',
    teeBottom: '┴'
  },
  [BoxStyle.DOUBLE]: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    cross: '╬',
    teeLeft: '╠',
    teeRight: '╣',
    teeTop: '╦',
    teeBottom: '╩'
  },
  [BoxStyle.ROUNDED]: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    teeLeft: '├',
    teeRight: '┤',
    teeTop: '┬',
    teeBottom: '┴'
  },
  [BoxStyle.HEAVY]: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
    cross: '╋',
    teeLeft: '┣',
    teeRight: '┫',
    teeTop: '┳',
    teeBottom: '┻'
  }
};

/**
 * Defines consistent formatting rules across the interface
 */
export interface FormattingRules {
  // Spacing
  paragraphSpacing: number;      // Lines between paragraphs
  sectionSpacing: number;        // Lines between sections
  statementSpacing: number;      // Lines between statements
  
  // Indentation
  baseIndent: number;            // Base indentation level
  quoteIndent: number;           // Additional indent for quotes
  listIndent: number;            // Indent for list items
  
  // Line wrapping
  maxLineLength: number;         // Maximum line length
  wrapIndent: number;            // Indent for wrapped lines
  
  // Visual elements
  separatorChar: string;         // Character for separators
  bulletChar: string;            // Character for bullet lists
  progressBarChar: string;       // Character for progress bars
  
  // Box drawing
  boxStyle: BoxStyle;            // Style for boxes (single, double, rounded)
}

/**
 * Default formatting rules
 */
export const DEFAULT_FORMATTING_RULES: FormattingRules = {
  // Spacing
  paragraphSpacing: 1,           // 1 blank line between paragraphs
  sectionSpacing: 2,             // 2 blank lines between sections
  statementSpacing: 2,           // 2 blank lines between statements
  
  // Indentation
  baseIndent: 2,                 // 2 spaces base indent
  quoteIndent: 4,                // 4 additional spaces for quotes
  listIndent: 2,                 // 2 spaces for list items
  
  // Line wrapping
  maxLineLength: 100,            // 100 characters max
  wrapIndent: 2,                 // 2 spaces for wrapped lines
  
  // Visual elements
  separatorChar: '─',            // Horizontal line character
  bulletChar: '•',               // Bullet point character
  progressBarChar: '█',          // Filled progress bar character
  
  // Box drawing
  boxStyle: BoxStyle.ROUNDED     // Rounded corners by default
};

/**
 * Compact formatting rules for narrow terminals
 */
export const COMPACT_FORMATTING_RULES: FormattingRules = {
  paragraphSpacing: 1,
  sectionSpacing: 1,
  statementSpacing: 1,
  baseIndent: 1,
  quoteIndent: 2,
  listIndent: 1,
  maxLineLength: 60,
  wrapIndent: 1,
  separatorChar: '-',
  bulletChar: '*',
  progressBarChar: '=',
  boxStyle: BoxStyle.SINGLE
};

/**
 * Wide formatting rules for wide terminals
 */
export const WIDE_FORMATTING_RULES: FormattingRules = {
  paragraphSpacing: 1,
  sectionSpacing: 2,
  statementSpacing: 3,
  baseIndent: 4,
  quoteIndent: 6,
  listIndent: 4,
  maxLineLength: 120,
  wrapIndent: 4,
  separatorChar: '─',
  bulletChar: '•',
  progressBarChar: '█',
  boxStyle: BoxStyle.DOUBLE
};
