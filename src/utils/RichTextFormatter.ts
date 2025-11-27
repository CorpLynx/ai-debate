import { ColorScheme, DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../models/ColorScheme';
import { FormattingRules, DEFAULT_FORMATTING_RULES } from '../models/FormattingRules';
import { ResponsiveLayout } from './ResponsiveLayout';

/**
 * Options for rich text formatting
 */
export interface FormatOptions {
  terminalWidth?: number;
  indentLevel?: number;
  preserveFormatting?: boolean;
  colorScheme?: ColorScheme;
  formattingRules?: FormattingRules;
}

/**
 * RichTextFormatter handles advanced text formatting including markdown-like syntax,
 * emphasis, lists, quotes, and code snippets.
 * 
 * Requirements:
 * - 1.1: Format text with proper paragraph breaks and visual spacing
 * - 1.2: Visually distinguish between different sections
 * - 1.4: Preserve and enhance list formatting
 * - 5.1: Visually distinguish quotes with indentation or styling
 * - 5.2: Render emphasis (bold, italic markers) appropriately
 * - 5.3: Enhance list formatting with proper alignment
 * - 5.4: Render section headers with visual prominence
 * - 5.5: Apply monospace formatting to code snippets
 */
export class RichTextFormatter {
  private colorScheme: ColorScheme;
  private formattingRules: FormattingRules;
  private layout: ResponsiveLayout;

  constructor(
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
    formattingRules: FormattingRules = DEFAULT_FORMATTING_RULES
  ) {
    this.colorScheme = colorScheme;
    this.formattingRules = formattingRules;
    this.layout = new ResponsiveLayout(colorScheme);
  }

  /**
   * Formats text with rich typography including paragraphs, lists, quotes, and emphasis
   * 
   * @param text Text to format
   * @param options Formatting options
   * @returns Formatted text with rich typography
   */
  public formatRichText(text: string, options: FormatOptions = {}): string {
    const {
      terminalWidth,
      indentLevel = 0,
      preserveFormatting = true,
      colorScheme = this.colorScheme,
      formattingRules = this.formattingRules
    } = options;

    // Update color scheme if provided
    if (colorScheme !== this.colorScheme) {
      this.colorScheme = colorScheme;
      this.layout.setColorScheme(colorScheme);
    }

    // Split into lines for processing
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let inCodeBlock = false;
    let inList = false;
    let previousLineEmpty = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue; // Skip the fence markers
      }

      if (inCodeBlock) {
        processedLines.push(this.formatCodeLine(line, indentLevel));
        previousLineEmpty = false;
        continue;
      }

      // Empty lines create paragraph breaks
      if (trimmedLine === '') {
        if (!previousLineEmpty) {
          // Add paragraph spacing
          for (let j = 0; j < formattingRules.paragraphSpacing; j++) {
            processedLines.push('');
          }
        }
        previousLineEmpty = true;
        inList = false;
        continue;
      }

      // Detect and format different line types
      let formattedLine: string;

      if (this.isHeader(trimmedLine)) {
        // Add section spacing before headers (if not at start)
        if (processedLines.length > 0 && !previousLineEmpty) {
          for (let j = 0; j < formattingRules.sectionSpacing; j++) {
            processedLines.push('');
          }
        }
        formattedLine = this.formatHeader(trimmedLine, indentLevel);
        inList = false;
      } else if (this.isQuote(trimmedLine)) {
        formattedLine = this.formatQuoteLine(trimmedLine, indentLevel);
        inList = false;
      } else if (this.isListItem(trimmedLine)) {
        formattedLine = this.formatListItem(trimmedLine, indentLevel);
        inList = true;
      } else {
        // Regular paragraph text
        formattedLine = this.formatParagraphLine(trimmedLine, indentLevel);
        if (inList) {
          // Add extra spacing after list ends
          if (processedLines.length > 0) {
            processedLines.push('');
          }
          inList = false;
        }
      }

      // Apply inline formatting (emphasis, code, etc.)
      formattedLine = this.applyInlineFormatting(formattedLine);

      processedLines.push(formattedLine);
      previousLineEmpty = false;
    }

    return processedLines.join('\n');
  }

  /**
   * Detects if a line is a header (starts with #)
   */
  private isHeader(line: string): boolean {
    return /^#{1,6}\s+/.test(line);
  }

  /**
   * Detects if a line is a quote (starts with >)
   */
  private isQuote(line: string): boolean {
    return line.startsWith('>');
  }

  /**
   * Detects if a line is a list item (starts with -, *, or number.)
   */
  private isListItem(line: string): boolean {
    return /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
  }

  /**
   * Formats a header line with visual prominence
   * Requirement 5.4: Render section headers with visual prominence
   */
  public formatHeader(line: string, indentLevel: number = 0): string {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) return line;

    const level = match[1].length;
    const text = match[2];
    const indent = ' '.repeat(indentLevel * this.formattingRules.baseIndent);

    // Apply color and emphasis based on header level
    let formattedText: string;
    if (level === 1) {
      formattedText = `${this.colorScheme.bold}${text}${ANSI_RESET}`;
    } else if (level === 2) {
      formattedText = `${this.colorScheme.accent}${text}${ANSI_RESET}`;
    } else {
      formattedText = `${this.colorScheme.primary}${text}${ANSI_RESET}`;
    }

    return `${indent}${formattedText}`;
  }

  /**
   * Formats a quote line with indentation and styling
   * Requirement 5.1: Visually distinguish quotes with indentation or styling
   */
  private formatQuoteLine(line: string, indentLevel: number = 0): string {
    // Remove the > marker and any leading space
    const content = line.replace(/^>\s*/, '');
    const baseIndent = ' '.repeat(indentLevel * this.formattingRules.baseIndent);
    const quoteIndent = ' '.repeat(this.formattingRules.quoteIndent);
    
    // Apply quote color and styling
    const formattedContent = `${this.colorScheme.quote}${content}${ANSI_RESET}`;
    
    return `${baseIndent}${quoteIndent}${formattedContent}`;
  }

  /**
   * Formats a list item with proper alignment
   * Requirement 5.3: Enhance list formatting with proper alignment
   */
  private formatListItem(line: string, indentLevel: number = 0): string {
    const baseIndent = ' '.repeat(indentLevel * this.formattingRules.baseIndent);
    const listIndent = ' '.repeat(this.formattingRules.listIndent);

    // Check if it's a numbered or bulleted list
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const number = numberedMatch[1];
      const content = numberedMatch[2];
      return `${baseIndent}${listIndent}${this.colorScheme.accent}${number}.${ANSI_RESET} ${content}`;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      const bullet = this.formattingRules.bulletChar;
      return `${baseIndent}${listIndent}${this.colorScheme.accent}${bullet}${ANSI_RESET} ${content}`;
    }

    return line;
  }

  /**
   * Formats a regular paragraph line
   */
  private formatParagraphLine(line: string, indentLevel: number = 0): string {
    const indent = ' '.repeat(indentLevel * this.formattingRules.baseIndent);
    return `${indent}${line}`;
  }

  /**
   * Formats a code line with monospace styling
   * Requirement 5.5: Apply monospace formatting to code snippets
   */
  private formatCodeLine(line: string, indentLevel: number = 0): string {
    const indent = ' '.repeat(indentLevel * this.formattingRules.baseIndent);
    const codeIndent = ' '.repeat(this.formattingRules.quoteIndent);
    return `${indent}${codeIndent}${this.colorScheme.code}${line}${ANSI_RESET}`;
  }

  /**
   * Applies inline formatting (bold, italic, code) to text
   * Requirement 5.2: Render emphasis (bold, italic markers) appropriately
   */
  private applyInlineFormatting(text: string): string {
    let formatted = text;

    // Handle inline code first (to avoid processing emphasis inside code)
    formatted = formatted.replace(/`([^`]+)`/g, (_, code) => {
      return `${this.colorScheme.code}${code}${ANSI_RESET}`;
    });

    // Handle bold (**text** or __text__)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
      return `${this.colorScheme.bold}${content}${ANSI_RESET}`;
    });
    formatted = formatted.replace(/__([^_]+)__/g, (_, content) => {
      return `${this.colorScheme.bold}${content}${ANSI_RESET}`;
    });

    // Handle italic (*text* or _text_)
    formatted = formatted.replace(/\*([^*]+)\*/g, (_, content) => {
      return `${this.colorScheme.italic}${content}${ANSI_RESET}`;
    });
    formatted = formatted.replace(/_([^_]+)_/g, (_, content) => {
      return `${this.colorScheme.italic}${content}${ANSI_RESET}`;
    });

    return formatted;
  }

  /**
   * Formats quotes with visual distinction
   * Requirement 5.1: Visually distinguish quotes with indentation or styling
   */
  public formatQuotes(text: string): string {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      if (this.isQuote(line.trim())) {
        return this.formatQuoteLine(line.trim(), 0);
      }
      return line;
    });
    return formatted.join('\n');
  }

  /**
   * Renders emphasis markers as ANSI codes
   * Requirement 5.2: Render emphasis appropriately
   */
  public renderEmphasis(text: string): string {
    return this.applyInlineFormatting(text);
  }

  /**
   * Formats lists with enhanced alignment
   * Requirement 5.3: Enhance list formatting with proper alignment
   * Requirement 1.4: Preserve and enhance list formatting
   */
  public formatLists(text: string): string {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (this.isListItem(trimmed)) {
        return this.formatListItem(trimmed, 0);
      }
      return line;
    });
    return formatted.join('\n');
  }

  /**
   * Formats headers with visual prominence
   * Requirement 5.4: Render section headers with visual prominence
   */
  public formatHeaders(text: string): string {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (this.isHeader(trimmed)) {
        return this.formatHeader(trimmed, 0);
      }
      return line;
    });
    return formatted.join('\n');
  }

  /**
   * Applies monospace formatting to code snippets
   * Requirement 5.5: Apply monospace formatting to code snippets
   */
  public formatCodeSnippets(text: string): string {
    const lines = text.split('\n');
    const formatted: string[] = [];
    let inCodeBlock = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        formatted.push(this.formatCodeLine(line, 0));
      } else {
        // Handle inline code
        const withInlineCode = line.replace(/`([^`]+)`/g, (_, code) => {
          return `${this.colorScheme.code}${code}${ANSI_RESET}`;
        });
        formatted.push(withInlineCode);
      }
    }

    return formatted.join('\n');
  }

  /**
   * Updates the color scheme
   */
  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
    this.layout.setColorScheme(colorScheme);
  }

  /**
   * Updates the formatting rules
   */
  public setFormattingRules(rules: FormattingRules): void {
    this.formattingRules = rules;
  }
}

/**
 * Default instance for convenience
 */
export const defaultRichTextFormatter = new RichTextFormatter();

/**
 * Convenience function to format rich text
 */
export function formatRichText(text: string, options: FormatOptions = {}): string {
  return defaultRichTextFormatter.formatRichText(text, options);
}

/**
 * Convenience function to format quotes
 */
export function formatQuotes(text: string): string {
  return defaultRichTextFormatter.formatQuotes(text);
}

/**
 * Convenience function to render emphasis
 */
export function renderEmphasis(text: string): string {
  return defaultRichTextFormatter.renderEmphasis(text);
}

/**
 * Convenience function to format lists
 */
export function formatLists(text: string): string {
  return defaultRichTextFormatter.formatLists(text);
}

/**
 * Convenience function to format headers
 */
export function formatHeaders(text: string): string {
  return defaultRichTextFormatter.formatHeaders(text);
}

/**
 * Convenience function to format code snippets
 */
export function formatCodeSnippets(text: string): string {
  return defaultRichTextFormatter.formatCodeSnippets(text);
}
