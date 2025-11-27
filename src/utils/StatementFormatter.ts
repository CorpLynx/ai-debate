import { Statement } from '../models/Statement';
import { Position } from '../models/Position';
import { RoundType } from '../models/RoundType';

/**
 * ANSI color codes for terminal formatting
 */
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  
  // Position colors
  AFFIRMATIVE: '\x1b[36m', // Cyan
  NEGATIVE: '\x1b[35m',    // Magenta
  
  // Accent colors
  ROUND_TYPE: '\x1b[33m',  // Yellow
  MODEL_NAME: '\x1b[32m',  // Green
  SEPARATOR: '\x1b[90m',   // Gray
};

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
 * Gets the color for a position
 */
function getPositionColor(position: Position): string {
  return position === Position.AFFIRMATIVE ? COLORS.AFFIRMATIVE : COLORS.NEGATIVE;
}

/**
 * Creates a separator line
 */
function createSeparator(length: number = 80): string {
  return COLORS.SEPARATOR + '─'.repeat(length) + COLORS.RESET;
}

/**
 * Formats a statement for display with visual formatting including colors and separators.
 * 
 * Requirements:
 * - 7.1: Display statements immediately after generation
 * - 7.2: Clearly indicate which model made the statement and which position it represents
 * - 7.3: Indicate the current debate round
 * 
 * @param statement - The statement to format
 * @param roundType - The type of round this statement belongs to
 * @returns Formatted string with model name, position, round type, and content
 */
export function formatStatement(statement: Statement, roundType: RoundType): string {
  const positionColor = getPositionColor(statement.position);
  const positionText = formatPosition(statement.position);
  const roundTypeText = formatRoundType(roundType);
  
  // Build the header with metadata
  const header = [
    '',
    createSeparator(),
    `${COLORS.ROUND_TYPE}${COLORS.BRIGHT}${roundTypeText}${COLORS.RESET}`,
    `${COLORS.MODEL_NAME}Model:${COLORS.RESET} ${statement.model}`,
    `${positionColor}${COLORS.BRIGHT}Position:${COLORS.RESET} ${positionColor}${positionText}${COLORS.RESET}`,
    createSeparator(),
    ''
  ].join('\n');
  
  // Format the content with indentation
  const contentLines = statement.content.split('\n');
  const formattedContent = contentLines.map(line => `  ${line}`).join('\n');
  
  // Build the footer
  const footer = [
    '',
    createSeparator(),
    ''
  ].join('\n');
  
  return header + formattedContent + footer;
}

/**
 * Formats a statement for display without colors (for file output or non-terminal contexts)
 * 
 * @param statement - The statement to format
 * @param roundType - The type of round this statement belongs to
 * @returns Formatted string without ANSI color codes
 */
export function formatStatementPlain(statement: Statement, roundType: RoundType): string {
  const positionText = formatPosition(statement.position);
  const roundTypeText = formatRoundType(roundType);
  
  // Build the header with metadata
  const separator = '─'.repeat(80);
  const header = [
    '',
    separator,
    `${roundTypeText}`,
    `Model: ${statement.model}`,
    `Position: ${positionText}`,
    separator,
    ''
  ].join('\n');
  
  // Format the content with indentation
  const contentLines = statement.content.split('\n');
  const formattedContent = contentLines.map(line => `  ${line}`).join('\n');
  
  // Build the footer
  const footer = [
    '',
    separator,
    ''
  ].join('\n');
  
  return header + formattedContent + footer;
}

/**
 * Creates a "thinking" indicator to show while a model is generating a response
 * 
 * Requirement 7.4: Show status indicator for which model is currently generating
 * 
 * @param modelName - The name of the model that is generating
 * @param position - The position of the model
 * @param roundType - The current round type
 * @returns Formatted thinking indicator string
 */
export function formatThinkingIndicator(
  modelName: string,
  position: Position,
  roundType: RoundType
): string {
  const positionColor = getPositionColor(position);
  const positionText = formatPosition(position);
  const roundTypeText = formatRoundType(roundType);
  
  return [
    '',
    `${COLORS.DIM}${COLORS.ROUND_TYPE}[${roundTypeText}]${COLORS.RESET}`,
    `${positionColor}${positionText}${COLORS.RESET} ${COLORS.DIM}(${modelName}) is thinking...${COLORS.RESET}`,
    ''
  ].join('\n');
}
