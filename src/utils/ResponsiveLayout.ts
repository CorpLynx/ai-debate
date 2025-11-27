import { getTerminalSize, getEffectiveWidth } from './TerminalSize';
import { FormattingRules, DEFAULT_FORMATTING_RULES, COMPACT_FORMATTING_RULES, WIDE_FORMATTING_RULES, BOX_CHARS, BoxStyle } from '../models/FormattingRules';
import { ColorScheme, DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../models/ColorScheme';

/**
 * Terminal size information (re-exported for convenience)
 */
export { TerminalSize } from './TerminalSize';

/**
 * Options for text wrapping
 */
export interface WrapOptions {
  width: number;
  indent: number;
  preserveNewlines?: boolean;
  hangingIndent?: number;
}

/**
 * Options for box creation
 */
export interface BoxOptions {
  title?: string;
  padding?: number;
  style?: BoxStyle;
  color?: string;
  width?: number;
}

/**
 * ResponsiveLayout handles terminal-aware formatting and responsive layout
 */
export class ResponsiveLayout {
  private colorScheme: ColorScheme;
  private formattingRules: FormattingRules;

  constructor(colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME) {
    this.colorScheme = colorScheme;
    this.formattingRules = this.selectFormattingRules();
  }

  /**
   * Selects appropriate formatting rules based on terminal size
   */
  private selectFormattingRules(): FormattingRules {
    const size = getTerminalSize();
    
    if (size.isNarrow) {
      return COMPACT_FORMATTING_RULES;
    } else if (size.isWide) {
      return WIDE_FORMATTING_RULES;
    } else {
      return DEFAULT_FORMATTING_RULES;
    }
  }

  /**
   * Gets the current terminal size
   */
  public getTerminalSize() {
    return getTerminalSize();
  }

  /**
   * Wraps text to fit within the specified width
   * @param text Text to wrap
   * @param width Maximum line width (defaults to terminal width)
   * @param indent Indentation for all lines (default: 0)
   * @returns Wrapped text
   */
  public wrapText(text: string, width?: number, indent: number = 0): string {
    const effectiveWidth = width || this.getEffectiveContentWidth();
    const options: WrapOptions = {
      width: effectiveWidth,
      indent,
      preserveNewlines: true
    };

    return this.wrapTextWithOptions(text, options);
  }

  /**
   * Wraps text with detailed options
   */
  private wrapTextWithOptions(text: string, options: WrapOptions): string {
    const { width, indent, preserveNewlines = true, hangingIndent = 0 } = options;
    const indentStr = ' '.repeat(indent);
    const hangingIndentStr = ' '.repeat(indent + hangingIndent);
    
    // Split by paragraphs if preserving newlines
    const paragraphs = preserveNewlines ? text.split('\n') : [text];
    const wrappedParagraphs: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        wrappedParagraphs.push('');
        continue;
      }

      const words = paragraph.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';
      let isFirstLine = true;

      for (const word of words) {
        const currentIndent = isFirstLine ? indentStr : hangingIndentStr;
        const availableWidth = width - currentIndent.length;
        
        // Check if adding this word would exceed the width
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        if (testLine.length <= availableWidth) {
          currentLine = testLine;
        } else {
          // Line is full, push it and start a new line
          if (currentLine) {
            lines.push(currentIndent + currentLine);
            isFirstLine = false;
          }
          
          // Handle words longer than available width
          if (word.length > availableWidth) {
            // Split the word
            let remainingWord = word;
            while (remainingWord.length > 0) {
              const chunk = remainingWord.substring(0, availableWidth);
              const nextIndent = isFirstLine ? indentStr : hangingIndentStr;
              lines.push(nextIndent + chunk);
              remainingWord = remainingWord.substring(availableWidth);
              isFirstLine = false;
            }
            currentLine = '';
          } else {
            currentLine = word;
          }
        }
      }

      // Push the last line
      if (currentLine) {
        const finalIndent = isFirstLine ? indentStr : hangingIndentStr;
        lines.push(finalIndent + currentLine);
      }

      wrappedParagraphs.push(lines.join('\n'));
    }

    return wrappedParagraphs.join('\n');
  }

  /**
   * Creates a responsive box with optional title
   * @param content Content to display in the box
   * @param options Box options
   * @returns Formatted box string
   */
  public createResponsiveBox(content: string, options: BoxOptions = {}): string {
    const {
      title,
      padding = 1,
      style = this.formattingRules.boxStyle,
      color = this.colorScheme.boxBorder,
      width
    } = options;

    const terminalSize = getTerminalSize();
    const boxWidth = width || this.getEffectiveBoxWidth();
    const chars = BOX_CHARS[style];
    
    // Calculate content width (box width minus borders and padding)
    const contentWidth = boxWidth - 2 - (padding * 2);
    
    // Wrap content to fit
    const wrappedContent = this.wrapText(content, contentWidth, 0);
    const contentLines = wrappedContent.split('\n');
    
    // Build the box
    const lines: string[] = [];
    
    // Top border with optional title
    if (title) {
      const titleText = ` ${title} `;
      const titleLength = titleText.length;
      const remainingWidth = boxWidth - 2 - titleLength;
      const leftWidth = Math.floor(remainingWidth / 2);
      const rightWidth = remainingWidth - leftWidth;
      
      const topLine = color + chars.topLeft + 
                     chars.horizontal.repeat(leftWidth) + 
                     titleText + 
                     chars.horizontal.repeat(rightWidth) + 
                     chars.topRight + ANSI_RESET;
      lines.push(topLine);
    } else {
      const topLine = color + chars.topLeft + 
                     chars.horizontal.repeat(boxWidth - 2) + 
                     chars.topRight + ANSI_RESET;
      lines.push(topLine);
    }
    
    // Add padding lines at top
    for (let i = 0; i < padding; i++) {
      lines.push(color + chars.vertical + ANSI_RESET + 
                ' '.repeat(boxWidth - 2) + 
                color + chars.vertical + ANSI_RESET);
    }
    
    // Content lines
    for (const line of contentLines) {
      const paddedLine = ' '.repeat(padding) + line + ' '.repeat(padding);
      const lineLength = this.getVisibleLength(paddedLine);
      const spacesNeeded = boxWidth - 2 - lineLength;
      
      lines.push(color + chars.vertical + ANSI_RESET + 
                paddedLine + 
                ' '.repeat(Math.max(0, spacesNeeded)) + 
                color + chars.vertical + ANSI_RESET);
    }
    
    // Add padding lines at bottom
    for (let i = 0; i < padding; i++) {
      lines.push(color + chars.vertical + ANSI_RESET + 
                ' '.repeat(boxWidth - 2) + 
                color + chars.vertical + ANSI_RESET);
    }
    
    // Bottom border
    const bottomLine = color + chars.bottomLeft + 
                      chars.horizontal.repeat(boxWidth - 2) + 
                      chars.bottomRight + ANSI_RESET;
    lines.push(bottomLine);
    
    return lines.join('\n');
  }

  /**
   * Adapts formatting based on terminal size
   * @param content Content to format
   * @returns Formatted content adapted to terminal size
   */
  public adaptFormatting(content: string): string {
    const size = getTerminalSize();
    
    if (size.isNarrow) {
      // Graceful degradation for narrow terminals
      return this.degradeForNarrowTerminal(content);
    } else if (size.isWide) {
      // Apply line length limits for wide terminals
      return this.limitLinesForWideTerminal(content);
    } else {
      // Standard formatting
      return this.wrapText(content);
    }
  }

  /**
   * Gracefully degrades formatting for narrow terminals
   */
  private degradeForNarrowTerminal(content: string): string {
    // Use compact formatting rules
    const narrowWidth = Math.max(40, getTerminalSize().width - 4);
    return this.wrapText(content, narrowWidth, 0);
  }

  /**
   * Applies line length limits for wide terminals
   */
  private limitLinesForWideTerminal(content: string): string {
    // Even on wide terminals, limit line length for readability
    const maxWidth = Math.min(120, getTerminalSize().width - 8);
    return this.wrapText(content, maxWidth, 0);
  }

  /**
   * Gets the effective content width for the current terminal
   */
  private getEffectiveContentWidth(): number {
    const size = getTerminalSize();
    const margin = 4; // 2 spaces on each side
    
    if (size.isNarrow) {
      return Math.max(40, size.width - margin);
    } else if (size.isWide) {
      // Limit to 120 even on very wide terminals
      return Math.min(120, size.width - margin);
    } else {
      return Math.max(60, size.width - margin);
    }
  }

  /**
   * Gets the effective box width for the current terminal
   */
  private getEffectiveBoxWidth(): number {
    const size = getTerminalSize();
    const margin = 2; // 1 space on each side
    
    if (size.isNarrow) {
      return Math.max(40, size.width - margin);
    } else if (size.isWide) {
      // Limit to 100 for boxes even on wide terminals
      return Math.min(100, size.width - margin);
    } else {
      return Math.max(60, size.width - margin);
    }
  }

  /**
   * Gets the visible length of a string (excluding ANSI codes)
   */
  private getVisibleLength(text: string): number {
    // Remove ANSI escape codes
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
    return stripped.length;
  }

  /**
   * Gets the current formatting rules
   */
  public getFormattingRules(): FormattingRules {
    return this.formattingRules;
  }

  /**
   * Updates the color scheme
   */
  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
  }
}

/**
 * Default instance for convenience
 */
export const defaultLayout = new ResponsiveLayout();

/**
 * Convenience function to wrap text
 */
export function wrapText(text: string, width?: number, indent: number = 0): string {
  return defaultLayout.wrapText(text, width, indent);
}

/**
 * Convenience function to create a box
 */
export function createBox(content: string, options: BoxOptions = {}): string {
  return defaultLayout.createResponsiveBox(content, options);
}

/**
 * Convenience function to adapt formatting
 */
export function adaptFormatting(content: string): string {
  return defaultLayout.adaptFormatting(content);
}
