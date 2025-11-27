import { Statement } from '../models/Statement';
import { Position } from '../models/Position';
import { RoundType } from '../models/RoundType';
import { RichTextFormatter } from './RichTextFormatter';
import { ResponsiveLayout } from './ResponsiveLayout';
import { DEFAULT_COLOR_SCHEME, ANSI_RESET, ColorScheme } from '../models/ColorScheme';
import { DEFAULT_FORMATTING_RULES, BOX_CHARS, BoxStyle } from '../models/FormattingRules';
import { ElementType, getColorForElement } from './ColorSchemeValidator';

/**
 * Shared instances for formatting
 */
const richTextFormatter = new RichTextFormatter(DEFAULT_COLOR_SCHEME, DEFAULT_FORMATTING_RULES);
const responsiveLayout = new ResponsiveLayout(DEFAULT_COLOR_SCHEME);

/**
 * Formats a round type for display
 */
function formatRoundType(roundType: RoundType): string {
  switch (roundType) {
    case RoundType.PREPARATION:
      return 'Preparation';
    case RoundType.OPENING:
      return 'Opening Statement';
    case RoundType.REBUTTAL:
      return 'Rebuttal';
    case RoundType.CROSS_EXAM:
      return 'Cross-Examination';
    case RoundType.CLOSING:
      return 'Closing Statement';
    default:
      return roundType;
  }
}

/**
 * Formats a position for display
 */
function formatPosition(position: Position): string {
  return position === Position.AFFIRMATIVE ? 'Affirmative' : 'Negative';
}

/**
 * Gets the color for a position using the color scheme
 * Requirement 9.1: Use colors from a consistent palette
 */
function getPositionColor(position: Position, scheme: ColorScheme = DEFAULT_COLOR_SCHEME): string {
  return position === Position.AFFIRMATIVE 
    ? getColorForElement(ElementType.AFFIRMATIVE, scheme)
    : getColorForElement(ElementType.NEGATIVE, scheme);
}

/**
 * Creates a separator line
 * Requirement 2.3: Use clear visual separators between statements
 * Requirement 9.1: Use colors from a consistent palette
 */
function createSeparator(length: number = 80, scheme: ColorScheme = DEFAULT_COLOR_SCHEME): string {
  return getColorForElement(ElementType.MUTED, scheme) + '─'.repeat(length) + ANSI_RESET;
}

/**
 * Creates an enhanced separator with decorative elements
 * Requirement 2.3: Use clear visual separators between statements
 * Requirement 9.1: Use colors from a consistent palette
 */
function createEnhancedSeparator(scheme: ColorScheme = DEFAULT_COLOR_SCHEME): string {
  const terminalSize = responsiveLayout.getTerminalSize();
  const width = Math.min(terminalSize.width - 4, 100);
  const chars = BOX_CHARS[BoxStyle.ROUNDED];
  
  return getColorForElement(ElementType.MUTED, scheme) + chars.horizontal.repeat(width) + ANSI_RESET;
}

/**
 * Creates a decorative round header
 * Requirement 2.1: Display visually prominent round header with decorative elements
 * Requirement 9.1: Use colors from a consistent palette
 */
function createRoundHeader(roundType: RoundType, roundNumber?: number, totalRounds?: number, scheme: ColorScheme = DEFAULT_COLOR_SCHEME): string {
  const terminalSize = responsiveLayout.getTerminalSize();
  const width = Math.min(terminalSize.width - 4, 100);
  const chars = BOX_CHARS[BoxStyle.DOUBLE];
  
  const roundTypeText = formatRoundType(roundType);
  const progressText = (roundNumber !== undefined && totalRounds !== undefined) 
    ? ` (Round ${roundNumber}/${totalRounds})` 
    : '';
  
  const titleText = `${roundTypeText}${progressText}`;
  const titleLength = titleText.length;
  
  // Calculate padding for centered title
  const remainingWidth = width - titleLength - 4; // 4 for spaces around title
  const leftPadding = Math.floor(remainingWidth / 2);
  const rightPadding = remainingWidth - leftPadding;
  
  const accentColor = getColorForElement(ElementType.ACCENT, scheme);
  const boldColor = getColorForElement(ElementType.BOLD, scheme);
  
  const topLine = accentColor + chars.topLeft + 
                 chars.horizontal.repeat(width - 2) + 
                 chars.topRight + ANSI_RESET;
  
  const titleLine = accentColor + chars.vertical + ANSI_RESET +
                   ' '.repeat(leftPadding + 1) +
                   boldColor + titleText + ANSI_RESET +
                   ' '.repeat(rightPadding + 1) +
                   accentColor + chars.vertical + ANSI_RESET;
  
  const bottomLine = accentColor + chars.bottomLeft + 
                    chars.horizontal.repeat(width - 2) + 
                    chars.bottomRight + ANSI_RESET;
  
  return [topLine, titleLine, bottomLine].join('\n');
}

/**
 * Formats a statement for display with enhanced visual formatting including rich text,
 * colors, separators, and responsive layout.
 * 
 * Requirements:
 * - 1.5: Apply consistent indentation and margins
 * - 2.1: Display visually prominent round header with decorative elements
 * - 2.2: Use distinct visual styling for metadata versus content
 * - 2.3: Use clear visual separators between statements
 * - 2.4: Use consistent color coding for positions
 * - 2.5: Display round progress in clear format
 * - 7.1: Display statements immediately after generation
 * - 7.2: Clearly indicate which model made the statement and which position it represents
 * - 7.3: Indicate the current debate round
 * - 9.1: Use colors from a consistent palette
 * 
 * @param statement - The statement to format
 * @param roundType - The type of round this statement belongs to
 * @param roundNumber - Optional current round number
 * @param totalRounds - Optional total number of rounds
 * @param scheme - Optional color scheme to use
 * @returns Formatted string with model name, position, round type, and rich content
 */
export function formatStatement(
  statement: Statement, 
  roundType: RoundType,
  roundNumber?: number,
  totalRounds?: number,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  const positionColor = getPositionColor(statement.position, scheme);
  const positionText = formatPosition(statement.position);
  
  // Requirement 2.1: Create enhanced round header with decorative elements
  const roundHeader = createRoundHeader(roundType, roundNumber, totalRounds, scheme);
  
  // Requirement 2.2: Format metadata with distinct styling (muted colors)
  const metadata = formatMetadata(statement, positionColor, positionText, scheme);
  
  // Requirement 2.3: Create visual separator after metadata
  const separator = createEnhancedSeparator(scheme);
  
  // Format content with rich text formatting
  // Requirement 1.5: Apply consistent indentation
  const formattedContent = formatStatementContent(statement.content, positionColor);
  
  // Requirement 2.3: Create visual separator at the end
  const footerSeparator = createEnhancedSeparator(scheme);
  
  // Assemble the complete formatted statement
  return [
    '',
    roundHeader,
    '',
    metadata,
    separator,
    '',
    formattedContent,
    '',
    footerSeparator,
    ''
  ].join('\n');
}

/**
 * Formats statement metadata with distinct styling
 * Requirement 2.2: Use distinct visual styling for metadata versus content
 * Requirement 9.4: Use muted colors for metadata and secondary information
 */
function formatMetadata(statement: Statement, positionColor: string, positionText: string, scheme: ColorScheme = DEFAULT_COLOR_SCHEME): string {
  const labelColor = getColorForElement(ElementType.METADATA_LABEL, scheme);
  const primaryColor = getColorForElement(ElementType.PRIMARY, scheme);
  const secondaryColor = getColorForElement(ElementType.SECONDARY, scheme);
  const boldColor = getColorForElement(ElementType.BOLD, scheme);
  
  const modelLine = `${labelColor}Model:${ANSI_RESET} ${primaryColor}${statement.model}${ANSI_RESET}`;
  const positionLine = `${labelColor}Position:${ANSI_RESET} ${positionColor}${boldColor}${positionText}${ANSI_RESET}`;
  const wordCountLine = `${labelColor}Words:${ANSI_RESET} ${secondaryColor}${statement.wordCount}${ANSI_RESET}`;
  
  // Add consistent indentation
  const indent = ' '.repeat(DEFAULT_FORMATTING_RULES.baseIndent);
  
  return [
    indent + modelLine,
    indent + positionLine,
    indent + wordCountLine
  ].join('\n');
}

/**
 * Formats statement content with rich text formatting and consistent indentation
 * Requirement 1.5: Apply consistent indentation and margins
 */
function formatStatementContent(content: string, positionColor: string): string {
  // Apply rich text formatting to the content
  const richFormatted = richTextFormatter.formatRichText(content, {
    indentLevel: 1, // One level of base indentation
    colorScheme: DEFAULT_COLOR_SCHEME,
    formattingRules: DEFAULT_FORMATTING_RULES
  });
  
  return richFormatted;
}

/**
 * Formats a statement for display without colors (for file output or non-terminal contexts)
 * 
 * @param statement - The statement to format
 * @param roundType - The type of round this statement belongs to
 * @param roundNumber - Optional current round number
 * @param totalRounds - Optional total number of rounds
 * @returns Formatted string without ANSI color codes
 */
export function formatStatementPlain(
  statement: Statement, 
  roundType: RoundType,
  roundNumber?: number,
  totalRounds?: number
): string {
  const positionText = formatPosition(statement.position);
  const roundTypeText = formatRoundType(roundType);
  const progressText = (roundNumber !== undefined && totalRounds !== undefined) 
    ? ` (Round ${roundNumber}/${totalRounds})` 
    : '';
  
  // Build the header with metadata
  const separator = '═'.repeat(80);
  const thinSeparator = '─'.repeat(80);
  
  const titleText = `${roundTypeText}${progressText}`;
  const titlePadding = Math.floor((80 - titleText.length) / 2);
  const centeredTitle = ' '.repeat(titlePadding) + titleText;
  
  const header = [
    '',
    separator,
    centeredTitle,
    separator,
    '',
    `  Model: ${statement.model}`,
    `  Position: ${positionText}`,
    `  Words: ${statement.wordCount}`,
    thinSeparator,
    ''
  ].join('\n');
  
  // Format the content with indentation
  const contentLines = statement.content.split('\n');
  const formattedContent = contentLines.map(line => `  ${line}`).join('\n');
  
  // Build the footer
  const footer = [
    '',
    thinSeparator,
    ''
  ].join('\n');
  
  return header + formattedContent + footer;
}

/**
 * Creates a visual separator between statements
 * Requirement 2.3: Use clear visual separators between statements
 * Requirement 9.1: Use colors from a consistent palette
 * 
 * @param scheme - Optional color scheme to use
 * @returns Formatted separator string
 */
export function createStatementSeparator(scheme: ColorScheme = DEFAULT_COLOR_SCHEME): string {
  const terminalSize = responsiveLayout.getTerminalSize();
  const width = Math.min(terminalSize.width - 4, 100);
  
  const mutedColor = getColorForElement(ElementType.MUTED, scheme);
  
  // Create a decorative separator with spacing
  return [
    '',
    '',
    mutedColor + '═'.repeat(width) + ANSI_RESET,
    '',
    ''
  ].join('\n');
}

/**
 * Creates a "thinking" indicator to show while a model is generating a response
 * 
 * Requirement 7.4: Show status indicator for which model is currently generating
 * Requirement 9.1: Use colors from a consistent palette
 * 
 * @param modelName - The name of the model that is generating
 * @param position - The position of the model
 * @param roundType - The current round type
 * @param scheme - Optional color scheme to use
 * @returns Formatted thinking indicator string
 */
export function formatThinkingIndicator(
  modelName: string,
  position: Position,
  roundType: RoundType,
  scheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  const positionColor = getPositionColor(position, scheme);
  const positionText = formatPosition(position);
  const roundTypeText = formatRoundType(roundType);
  
  const warningColor = getColorForElement(ElementType.WARNING, scheme);
  const mutedColor = getColorForElement(ElementType.MUTED, scheme);
  
  return [
    '',
    `${mutedColor}${warningColor}[${roundTypeText}]${ANSI_RESET}`,
    `${positionColor}${positionText}${ANSI_RESET} ${mutedColor}(${modelName}) is thinking...${ANSI_RESET}`,
    ''
  ].join('\n');
}
