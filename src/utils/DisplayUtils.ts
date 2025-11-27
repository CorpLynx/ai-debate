/**
 * Display Utilities for Interactive CLI
 * 
 * Provides functions for displaying menus, confirmations, errors, and other
 * visual elements in the interactive command-line interface.
 * 
 * Requirements:
 * - 6.2: Configuration display formatting
 * - 6.4: Setup progress indicators
 * - 6.5: Confirmation displays with checkmarks
 * - 7.1: Error format distinction
 * - 7.2: Warning vs error styling
 * - 7.3: Stack trace readability
 * - 7.4: Error grouping
 * - 7.5: Recovery suggestion highlighting
 * - 8.1: Clear labels and descriptions for configuration options
 * - 8.2: Display confirmation of selected values
 * - 8.3: Number options and indicate how to make selections
 * - 8.4: Display error messages in visually distinct format
 * - 8.5: Display formatted summary of all settings
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { DEFAULT_COLOR_SCHEME, ANSI_RESET, ColorScheme } from '../models/ColorScheme';
import { DEFAULT_FORMATTING_RULES, FormattingRules, BoxStyle, BOX_CHARS } from '../models/FormattingRules';
import { 
  ElementType, 
  getColorForElement, 
  applyColor, 
  formatMetadata as formatMetadataWithScheme,
  formatInteractiveElement 
} from './ColorSchemeValidator';

/**
 * Menu option for display
 */
export interface MenuOption {
  label: string;
  description?: string;
  value: string | number;
}

/**
 * Display a numbered menu with options.
 * 
 * Requirement 8.3: Number options and indicate how to make selections
 * Requirement 9.5: Use highlighting for interactive elements
 * 
 * @param title - The menu title
 * @param options - Array of menu options
 * @param includeExit - Whether to include an exit option (default: true)
 * @param colorScheme - Optional color scheme to use
 * @returns The formatted menu string
 */
export function displayMenu(
  title: string,
  options: MenuOption[],
  includeExit: boolean = true,
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
): string {
  const lines: string[] = [];
  
  // Add title with color
  lines.push('');
  lines.push(applyColor(title, ElementType.INFO, colorScheme));
  lines.push(applyColor('─'.repeat(Math.max(0, 60)), ElementType.MUTED, colorScheme));
  lines.push('');
  
  // Add numbered options with interactive element highlighting
  options.forEach((option, index) => {
    const number = formatInteractiveElement(`${index + 1}.`, false, colorScheme);
    const label = applyColor(option.label, ElementType.PRIMARY, colorScheme);
    
    if (option.description) {
      const separator = applyColor('-', ElementType.MUTED, colorScheme);
      const description = applyColor(option.description, ElementType.SECONDARY, colorScheme);
      lines.push(`  ${number} ${label} ${separator} ${description}`);
    } else {
      lines.push(`  ${number} ${label}`);
    }
  });
  
  // Add exit option if requested
  if (includeExit) {
    const exitNumber = formatInteractiveElement(`${options.length + 1}.`, false, colorScheme);
    const exitLabel = applyColor('Exit', ElementType.ERROR, colorScheme);
    lines.push(`  ${exitNumber} ${exitLabel}`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Display a confirmation message for a selected value.
 * 
 * Requirement 6.5: Confirmation displays with checkmarks
 * Requirement 8.2: Display confirmation of selected value
 * 
 * @param label - The label for the confirmed value
 * @param value - The confirmed value
 * @param options - Optional configuration
 * @returns The formatted confirmation string
 */
export function displayConfirmation(
  label: string, 
  value: string,
  options?: {
    colorScheme?: ColorScheme;
    showCheckmark?: boolean;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const showCheckmark = options?.showCheckmark !== false; // Default to true
  
  const checkmark = showCheckmark ? `${scheme.success}✓${ANSI_RESET} ` : '';
  return `\n${checkmark}${scheme.primary}${label}:${ANSI_RESET} ${scheme.affirmative}${value}${ANSI_RESET}\n`;
}

/**
 * Display multiple confirmations in a formatted list.
 * 
 * Requirement 6.5: Confirmation displays with checkmarks
 * 
 * @param confirmations - Array of label-value pairs
 * @param options - Optional configuration
 * @returns The formatted confirmations string
 */
export function displayConfirmations(
  confirmations: Array<{ label: string; value: string }>,
  options?: {
    title?: string;
    colorScheme?: ColorScheme;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  if (options?.title) {
    lines.push('');
    lines.push(`${scheme.success}✓ ${scheme.bold}${options.title}${ANSI_RESET}`);
    lines.push(`${scheme.muted}${'─'.repeat(60)}${ANSI_RESET}`);
  }
  
  lines.push('');
  confirmations.forEach(({ label, value }) => {
    lines.push(`  ${scheme.success}✓${ANSI_RESET} ${scheme.primary}${label}:${ANSI_RESET} ${scheme.affirmative}${value}${ANSI_RESET}`);
  });
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Display an error message in a visually distinct format.
 * 
 * Requirement 7.1: Error format distinction
 * Requirement 8.4: Display error messages in visually distinct format
 * 
 * @param message - The error message to display
 * @param options - Optional configuration for error display
 * @returns The formatted error string
 */
export function displayError(
  message: string, 
  options?: {
    stackTrace?: string;
    context?: Record<string, any>;
    recoverySuggestions?: string[];
    colorScheme?: ColorScheme;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  // Error header with icon
  lines.push('');
  lines.push(`${scheme.error}❌ ERROR${ANSI_RESET}`);
  lines.push(`${scheme.error}${'─'.repeat(60)}${ANSI_RESET}`);
  lines.push('');
  
  // Main error message
  lines.push(`${scheme.error}${message}${ANSI_RESET}`);
  
  // Stack trace if provided (Requirement 7.3)
  if (options?.stackTrace) {
    lines.push('');
    lines.push(`${scheme.muted}Stack Trace:${ANSI_RESET}`);
    const stackLines = options.stackTrace.split('\n').slice(0, 5); // Limit to 5 lines for readability
    stackLines.forEach(line => {
      lines.push(`${scheme.muted}  ${line.trim()}${ANSI_RESET}`);
    });
    if (options.stackTrace.split('\n').length > 5) {
      lines.push(`${scheme.muted}  ... (${options.stackTrace.split('\n').length - 5} more lines)${ANSI_RESET}`);
    }
  }
  
  // Context information if provided
  if (options?.context && Object.keys(options.context).length > 0) {
    lines.push('');
    lines.push(`${scheme.muted}Context:${ANSI_RESET}`);
    Object.entries(options.context).forEach(([key, value]) => {
      lines.push(`${scheme.muted}  ${key}: ${scheme.secondary}${JSON.stringify(value)}${ANSI_RESET}`);
    });
  }
  
  // Recovery suggestions if provided (Requirement 7.5)
  if (options?.recoverySuggestions && options.recoverySuggestions.length > 0) {
    lines.push('');
    lines.push(`${scheme.info}💡 Suggestions:${ANSI_RESET}`);
    options.recoverySuggestions.forEach((suggestion, index) => {
      lines.push(`${scheme.accent}  ${index + 1}. ${scheme.primary}${suggestion}${ANSI_RESET}`);
    });
  }
  
  lines.push('');
  return lines.join('\n');
}

/**
 * Display a success message.
 * 
 * @param message - The success message to display
 * @returns The formatted success string
 */
export function displaySuccess(message: string): string {
  return `\n${chalk.green('✓')} ${chalk.green(message)}\n`;
}

/**
 * Display a warning message.
 * 
 * Requirement 7.2: Warning vs error styling
 * 
 * @param message - The warning message to display
 * @param options - Optional configuration for warning display
 * @returns The formatted warning string
 */
export function displayWarning(
  message: string,
  options?: {
    context?: Record<string, any>;
    colorScheme?: ColorScheme;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  // Warning header with icon (different from error)
  lines.push('');
  lines.push(`${scheme.warning}⚠️  WARNING${ANSI_RESET}`);
  lines.push(`${scheme.warning}${'─'.repeat(60)}${ANSI_RESET}`);
  lines.push('');
  
  // Main warning message
  lines.push(`${scheme.warning}${message}${ANSI_RESET}`);
  
  // Context information if provided
  if (options?.context && Object.keys(options.context).length > 0) {
    lines.push('');
    lines.push(`${scheme.muted}Context:${ANSI_RESET}`);
    Object.entries(options.context).forEach(([key, value]) => {
      lines.push(`${scheme.muted}  ${key}: ${scheme.secondary}${JSON.stringify(value)}${ANSI_RESET}`);
    });
  }
  
  lines.push('');
  return lines.join('\n');
}

/**
 * Display an info message.
 * 
 * @param message - The info message to display
 * @returns The formatted info string
 */
export function displayInfo(message: string): string {
  return `\n${chalk.blue('ℹ️  Info:')} ${chalk.white(message)}\n`;
}

/**
 * Display multiple errors or warnings grouped together.
 * 
 * Requirement 7.4: Error grouping
 * 
 * @param items - Array of error or warning items
 * @param type - Type of items ('error' or 'warning')
 * @param options - Optional configuration
 * @returns The formatted grouped display string
 */
export function displayGroupedMessages(
  items: Array<{
    message: string;
    context?: Record<string, any>;
    stackTrace?: string;
  }>,
  type: 'error' | 'warning',
  options?: {
    colorScheme?: ColorScheme;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  const isError = type === 'error';
  const color = isError ? scheme.error : scheme.warning;
  const icon = isError ? '❌' : '⚠️';
  const label = isError ? 'ERRORS' : 'WARNINGS';
  
  // Header
  lines.push('');
  lines.push(`${color}${icon} ${items.length} ${label} FOUND${ANSI_RESET}`);
  lines.push(`${color}${'═'.repeat(60)}${ANSI_RESET}`);
  lines.push('');
  
  // Display each item
  items.forEach((item, index) => {
    lines.push(`${scheme.accent}${index + 1}.${ANSI_RESET} ${color}${item.message}${ANSI_RESET}`);
    
    // Context if provided
    if (item.context && Object.keys(item.context).length > 0) {
      Object.entries(item.context).forEach(([key, value]) => {
        lines.push(`   ${scheme.muted}${key}: ${scheme.secondary}${JSON.stringify(value)}${ANSI_RESET}`);
      });
    }
    
    // Stack trace if provided (only for errors, and only first 3 lines)
    if (isError && item.stackTrace) {
      const stackLines = item.stackTrace.split('\n').slice(0, 3);
      stackLines.forEach(line => {
        lines.push(`   ${scheme.muted}${line.trim()}${ANSI_RESET}`);
      });
    }
    
    // Add spacing between items
    if (index < items.length - 1) {
      lines.push('');
    }
  });
  
  lines.push('');
  return lines.join('\n');
}

/**
 * Create a box around text content.
 * 
 * Requirement 8.5: Display formatted summary
 * 
 * @param content - The content to box
 * @param width - The width of the box (default: 60)
 * @param color - The color for the box (default: 'cyan')
 * @returns The boxed content string
 */
export function displayBox(content: string, width: number = 60, color: 'cyan' | 'green' | 'yellow' | 'blue' | 'magenta' = 'cyan'): string {
  const lines: string[] = [];
  
  // Select color function
  const colorFn = chalk[color];
  
  // Top border
  lines.push(colorFn('╔' + '═'.repeat(Math.max(0, width - 2)) + '╗'));
  
  // Content lines
  const contentLines = content.split('\n');
  contentLines.forEach(line => {
    // Strip ANSI codes to calculate actual length
    const strippedLine = line.replace(/\u001b\[.*?m/g, '');
    const padding = width - 4 - strippedLine.length;
    const leftPad = Math.max(0, Math.floor(padding / 2));
    const rightPad = Math.max(0, padding - leftPad);
    lines.push(colorFn('║') + ' ' + ' '.repeat(leftPad) + line + ' '.repeat(rightPad) + ' ' + colorFn('║'));
  });
  
  // Bottom border
  lines.push(colorFn('╚' + '═'.repeat(Math.max(0, width - 2)) + '╝'));
  
  return lines.join('\n');
}

/**
 * Display a horizontal separator.
 * 
 * @param width - The width of the separator (default: 60)
 * @param char - The character to use (default: '─')
 * @param color - The color for the separator (default: 'gray')
 * @returns The separator string
 */
export function displaySeparator(width: number = 60, char: string = '─', color: 'gray' | 'cyan' | 'yellow' = 'gray'): string {
  return chalk[color](char.repeat(Math.max(0, width)));
}

/**
 * Display a section header with progress indicator.
 * 
 * Requirement 6.4: Setup progress indicators
 * Requirement 8.1: Clear labels and descriptions
 * 
 * @param title - The section title
 * @param width - The width of the header (default: 60)
 * @param step - Current step number (optional)
 * @param totalSteps - Total number of steps (optional)
 * @param options - Optional configuration
 * @returns The formatted header string
 */
export function displayHeader(
  title: string, 
  width: number = 60, 
  step?: number, 
  totalSteps?: number,
  options?: {
    colorScheme?: ColorScheme;
    showProgressBar?: boolean;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  lines.push('');
  
  // Add progress indicator if provided
  if (step !== undefined && totalSteps !== undefined) {
    const progressText = `[Step ${step}/${totalSteps}]`;
    lines.push(`${scheme.muted}${progressText}${ANSI_RESET} ${scheme.bold}${title}${ANSI_RESET}`);
    
    // Add visual progress bar if requested
    if (options?.showProgressBar) {
      const percentage = Math.floor((step / totalSteps) * 100);
      const barWidth = 40;
      const filled = Math.floor((step / totalSteps) * barWidth);
      const empty = barWidth - filled;
      
      const bar = `${scheme.success}${'█'.repeat(filled)}${ANSI_RESET}${scheme.muted}${'░'.repeat(empty)}${ANSI_RESET}`;
      lines.push(`${bar} ${scheme.accent}${percentage}%${ANSI_RESET}`);
    }
  } else {
    lines.push(`${scheme.bold}${title}${ANSI_RESET}`);
  }
  
  lines.push(`${scheme.muted}${'─'.repeat(Math.max(0, width))}${ANSI_RESET}`);
  lines.push('');
  return lines.join('\n');
}

/**
 * Display a setup step with progress indicator and status.
 * 
 * Requirement 6.4: Setup progress indicators
 * 
 * @param step - Current step number
 * @param totalSteps - Total number of steps
 * @param title - Step title
 * @param status - Step status ('pending', 'active', 'complete')
 * @param options - Optional configuration
 * @returns The formatted step string
 */
export function displaySetupStep(
  step: number,
  totalSteps: number,
  title: string,
  status: 'pending' | 'active' | 'complete',
  options?: {
    colorScheme?: ColorScheme;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  
  let icon: string;
  let color: string;
  
  switch (status) {
    case 'complete':
      icon = '✓';
      color = scheme.success;
      break;
    case 'active':
      icon = '▶';
      color = scheme.info;
      break;
    case 'pending':
    default:
      icon = '○';
      color = scheme.muted;
      break;
  }
  
  const stepText = `${color}${icon}${ANSI_RESET} ${scheme.muted}[${step}/${totalSteps}]${ANSI_RESET} ${color}${title}${ANSI_RESET}`;
  return `\n${stepText}\n`;
}

/**
 * Display a list of items with bullet points.
 * 
 * @param items - Array of items to display
 * @param bullet - The bullet character (default: '•')
 * @returns The formatted list string
 */
export function displayList(items: string[], bullet: string = '•'): string {
  const lines: string[] = [];
  items.forEach(item => {
    lines.push(`  ${bullet} ${item}`);
  });
  return lines.join('\n');
}

/**
 * Display a key-value pair.
 * 
 * @param key - The key label
 * @param value - The value
 * @param indent - Number of spaces to indent (default: 3)
 * @returns The formatted key-value string
 */
export function displayKeyValue(key: string, value: string | number | boolean, indent: number = 3): string {
  const indentStr = ' '.repeat(Math.max(0, indent));
  return `${indentStr}${key}: ${value}`;
}

/**
 * Display a prompt for user input.
 * 
 * @param question - The question to ask
 * @returns The formatted prompt string
 */
export function displayPrompt(question: string): string {
  return question;
}

/**
 * Format a configuration summary section.
 * 
 * Requirement 6.2: Configuration display formatting
 * Requirement 8.5: Display formatted summary of all settings
 * 
 * @param title - The section title
 * @param items - Key-value pairs to display
 * @param options - Optional configuration
 * @returns The formatted section string
 */
export function displayConfigSection(
  title: string, 
  items: Record<string, string | number | boolean>,
  options?: {
    colorScheme?: ColorScheme;
    showBorder?: boolean;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  lines.push('');
  
  if (options?.showBorder) {
    lines.push(`${scheme.boxBorder}┌${'─'.repeat(58)}┐${ANSI_RESET}`);
    lines.push(`${scheme.boxBorder}│${ANSI_RESET} ${scheme.bold}${title}${ANSI_RESET}${' '.repeat(Math.max(0, 57 - title.length))}${scheme.boxBorder}│${ANSI_RESET}`);
    lines.push(`${scheme.boxBorder}├${'─'.repeat(58)}┤${ANSI_RESET}`);
    
    Object.entries(items).forEach(([key, value]) => {
      const line = `  ${scheme.secondary}${key}:${ANSI_RESET} ${scheme.affirmative}${value}${ANSI_RESET}`;
      const strippedLine = line.replace(/\x1b\[.*?m/g, '');
      const padding = Math.max(0, 58 - strippedLine.length);
      lines.push(`${scheme.boxBorder}│${ANSI_RESET}${line}${' '.repeat(padding)}${scheme.boxBorder}│${ANSI_RESET}`);
    });
    
    lines.push(`${scheme.boxBorder}└${'─'.repeat(58)}┘${ANSI_RESET}`);
  } else {
    lines.push(`${scheme.bold}${title}${ANSI_RESET}`);
    lines.push(`${scheme.muted}${'─'.repeat(60)}${ANSI_RESET}`);
    
    Object.entries(items).forEach(([key, value]) => {
      lines.push(`  ${scheme.secondary}${key}:${ANSI_RESET} ${scheme.affirmative}${value}${ANSI_RESET}`);
    });
  }
  
  lines.push('');
  return lines.join('\n');
}

/**
 * Create a loading spinner for async operations.
 * 
 * @param text - The loading text to display
 * @returns Ora spinner instance
 */
export function createSpinner(text: string): Ora {
  return ora({
    text: chalk.cyan(text),
    color: 'cyan',
    spinner: 'dots'
  });
}

/**
 * Display a welcome banner with ASCII art.
 * 
 * Requirement 6.3: Display visually appealing ASCII art or box drawing
 * Requirement 9.1: Use colors from consistent palette
 * 
 * @param options - Optional configuration
 * @returns The formatted welcome banner string
 */
export function displayWelcomeBanner(options?: {
  colorScheme?: ColorScheme;
  animated?: boolean;
}): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  // Clear screen for better presentation
  lines.push('\n'.repeat(2));
  
  // Enhanced ASCII art logo with debate theme - larger and more prominent
  const asciiArt = [
    `${scheme.affirmative}     ___    ____       ${scheme.negative}____  ________  ___  ____________${ANSI_RESET}`,
    `${scheme.affirmative}    /   |  /  _/      ${scheme.negative}/ __ \\/ ____/ / / / |/_/_  __/ __/${ANSI_RESET}`,
    `${scheme.affirmative}   / /| |  / /       ${scheme.negative}/ / / / __/ / /_/ /  >  < / / / _/  ${ANSI_RESET}`,
    `${scheme.affirmative}  / ___ |_/ /       ${scheme.negative}/ /_/ / /___/ __  / /|  |/ / / /___  ${ANSI_RESET}`,
    `${scheme.affirmative} /_/  |_/___/      ${scheme.negative}/_____/_____/_/ /_/_/ |_/_/ /_____/  ${ANSI_RESET}`
  ];
  
  // Decorative top border with double-line style for prominence
  lines.push(`${scheme.boxBorder}╔${'═'.repeat(78)}╗${ANSI_RESET}`);
  lines.push(`${scheme.boxBorder}║${' '.repeat(78)}║${ANSI_RESET}`);
  
  // Add ASCII art centered in the box
  asciiArt.forEach(artLine => {
    // Strip ANSI codes to calculate actual length
    const strippedLine = artLine.replace(/\x1b\[.*?m/g, '');
    const padding = Math.max(0, 78 - strippedLine.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    lines.push(`${scheme.boxBorder}║${ANSI_RESET}${' '.repeat(leftPad)}${artLine}${' '.repeat(rightPad)}${scheme.boxBorder}║${ANSI_RESET}`);
  });
  
  lines.push(`${scheme.boxBorder}║${' '.repeat(78)}║${ANSI_RESET}`);
  
  // Centered subtitle with enhanced styling
  const subtitle = `${scheme.bold}${scheme.accent}⚡ Orchestrating Intelligent Discourse ⚡${ANSI_RESET}`;
  const subtitleStripped = 'Orchestrating Intelligent Discourse';
  const subtitlePadding = Math.max(0, 78 - subtitleStripped.length - 4); // -4 for the lightning bolts
  const subtitleLeftPad = Math.floor(subtitlePadding / 2);
  const subtitleRightPad = subtitlePadding - subtitleLeftPad;
  lines.push(`${scheme.boxBorder}║${ANSI_RESET}${' '.repeat(subtitleLeftPad)}${subtitle}${' '.repeat(subtitleRightPad)}${scheme.boxBorder}║${ANSI_RESET}`);
  
  lines.push(`${scheme.boxBorder}║${' '.repeat(78)}║${ANSI_RESET}`);
  
  // Decorative separator with debate symbols
  const separator = `${scheme.muted}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${ANSI_RESET}`;
  lines.push(`${scheme.boxBorder}║${ANSI_RESET}${separator}${scheme.boxBorder}║${ANSI_RESET}`);
  
  lines.push(`${scheme.boxBorder}║${' '.repeat(78)}║${ANSI_RESET}`);
  
  // Feature highlights with enhanced icons and spacing
  const featureTitle = `${scheme.bold}${scheme.info}✨ Key Features${ANSI_RESET}`;
  const featureTitleStripped = 'Key Features';
  const featureTitlePadding = Math.max(0, 78 - featureTitleStripped.length - 2); // -2 for sparkles
  const featureTitleLeftPad = Math.floor(featureTitlePadding / 2);
  const featureTitleRightPad = featureTitlePadding - featureTitleLeftPad;
  lines.push(`${scheme.boxBorder}║${ANSI_RESET}${' '.repeat(featureTitleLeftPad)}${featureTitle}${' '.repeat(featureTitleRightPad)}${scheme.boxBorder}║${ANSI_RESET}`);
  
  lines.push(`${scheme.boxBorder}║${' '.repeat(78)}║${ANSI_RESET}`);
  
  const features = [
    { icon: '🔌', color: scheme.affirmative, text: 'Multiple AI Provider Support (OpenAI, Anthropic, Local)' },
    { icon: '⚖️', color: scheme.negative, text: 'Structured Debate Format with Formal Rounds' },
    { icon: '📡', color: scheme.accent, text: 'Real-time Streaming Display with Progress Indicators' },
    { icon: '📚', color: scheme.success, text: 'Automatic Citation Tracking & Bibliography Generation' }
  ];
  
  features.forEach(feature => {
    const featureLine = `${feature.icon}  ${feature.color}${feature.text}${ANSI_RESET}`;
    const featureStripped = `${feature.icon}  ${feature.text}`;
    const featurePadding = Math.max(0, 78 - featureStripped.length - 4); // -4 for left margin
    lines.push(`${scheme.boxBorder}║${ANSI_RESET}    ${featureLine}${' '.repeat(featurePadding)}${scheme.boxBorder}║${ANSI_RESET}`);
  });
  
  lines.push(`${scheme.boxBorder}║${' '.repeat(78)}║${ANSI_RESET}`);
  lines.push(`${scheme.boxBorder}╚${'═'.repeat(78)}╝${ANSI_RESET}`);
  
  // Setup steps with enhanced formatting and visual hierarchy
  lines.push('');
  lines.push(`${scheme.boxBorder}┌${'─'.repeat(78)}┐${ANSI_RESET}`);
  
  const stepsTitle = `${scheme.bold}${scheme.info}📋 Interactive Setup Process${ANSI_RESET}`;
  const stepsTitleStripped = 'Interactive Setup Process';
  const stepsTitlePadding = Math.max(0, 78 - stepsTitleStripped.length - 2); // -2 for clipboard
  const stepsTitleLeftPad = Math.floor(stepsTitlePadding / 2);
  const stepsTitleRightPad = stepsTitlePadding - stepsTitleLeftPad;
  lines.push(`${scheme.boxBorder}│${ANSI_RESET}${' '.repeat(stepsTitleLeftPad)}${stepsTitle}${' '.repeat(stepsTitleRightPad)}${scheme.boxBorder}│${ANSI_RESET}`);
  
  lines.push(`${scheme.boxBorder}├${'─'.repeat(78)}┤${ANSI_RESET}`);
  
  const steps = [
    { num: '1', icon: '🔌', text: 'Select AI providers for both debate positions', color: scheme.affirmative },
    { num: '2', icon: '🤖', text: 'Choose specific models or random selection', color: scheme.negative },
    { num: '3', icon: '💭', text: 'Enter your debate topic or proposition', color: scheme.accent },
    { num: '4', icon: '✅', text: 'Review configuration and start the debate', color: scheme.success }
  ];
  
  steps.forEach((step, index) => {
    const stepLine = `  ${step.color}${step.num}.${ANSI_RESET} ${step.icon}  ${scheme.primary}${step.text}${ANSI_RESET}`;
    const stepStripped = `  ${step.num}. ${step.icon}  ${step.text}`;
    const stepPadding = Math.max(0, 78 - stepStripped.length);
    lines.push(`${scheme.boxBorder}│${ANSI_RESET}${stepLine}${' '.repeat(stepPadding)}${scheme.boxBorder}│${ANSI_RESET}`);
    
    // Add subtle separator between steps (except after last step)
    if (index < steps.length - 1) {
      lines.push(`${scheme.boxBorder}│${ANSI_RESET}${' '.repeat(78)}${scheme.boxBorder}│${ANSI_RESET}`);
    }
  });
  
  lines.push(`${scheme.boxBorder}└${'─'.repeat(78)}┘${ANSI_RESET}`);
  
  // Footer with helpful information
  lines.push('');
  lines.push(`${scheme.boxBorder}╔${'═'.repeat(78)}╗${ANSI_RESET}`);
  
  const helpText = `${scheme.secondary}💡 Type ${scheme.accent}'exit'${ANSI_RESET}${scheme.secondary} at any prompt to cancel setup${ANSI_RESET}`;
  const helpStripped = 'Type \'exit\' at any prompt to cancel setup';
  const helpPadding = Math.max(0, 78 - helpStripped.length - 2); // -2 for lightbulb
  const helpLeftPad = Math.floor(helpPadding / 2);
  const helpRightPad = helpPadding - helpLeftPad;
  lines.push(`${scheme.boxBorder}║${ANSI_RESET}${' '.repeat(helpLeftPad)}${helpText}${' '.repeat(helpRightPad)}${scheme.boxBorder}║${ANSI_RESET}`);
  
  lines.push(`${scheme.boxBorder}╚${'═'.repeat(78)}╝${ANSI_RESET}`);
  
  lines.push('');
  
  // Add animation effect if requested
  if (options?.animated) {
    // Note: Animation would require async/await and delays
    // For now, we just add a pulsing effect indicator
    lines.push(`${scheme.muted}${' '.repeat(35)}⟳ Ready${' '.repeat(35)}${ANSI_RESET}`);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Display a progress bar.
 * 
 * @param current - Current step
 * @param total - Total steps
 * @param width - Width of the progress bar (default: 40)
 * @param options - Optional configuration
 * @returns The formatted progress bar string
 */
export function displayProgressBar(
  current: number, 
  total: number, 
  width: number = 40,
  options?: {
    colorScheme?: ColorScheme;
    label?: string;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.max(0, Math.floor((current / total) * width));
  const empty = Math.max(0, width - filled);
  
  const bar = `${scheme.success}${'█'.repeat(filled)}${ANSI_RESET}${scheme.muted}${'░'.repeat(empty)}${ANSI_RESET}`;
  const progress = `${scheme.accent}${percentage}%${ANSI_RESET}`;
  const label = options?.label ? `${scheme.primary}${options.label} ${ANSI_RESET}` : '';
  
  return `\n${label}${bar} ${progress} ${scheme.muted}(${current}/${total})${ANSI_RESET}\n`;
}

/**
 * Format a stack trace for readable display.
 * 
 * Requirement 7.3: Stack trace readability
 * 
 * @param stackTrace - The stack trace string
 * @param options - Optional configuration
 * @returns The formatted stack trace string
 */
export function formatStackTrace(
  stackTrace: string,
  options?: {
    maxLines?: number;
    colorScheme?: ColorScheme;
    highlightFiles?: string[];
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const maxLines = options?.maxLines || 10;
  const lines: string[] = [];
  
  lines.push(`${scheme.muted}Stack Trace:${ANSI_RESET}`);
  lines.push(`${scheme.muted}${'─'.repeat(60)}${ANSI_RESET}`);
  
  const stackLines = stackTrace.split('\n').filter(line => line.trim());
  const displayLines = stackLines.slice(0, maxLines);
  
  displayLines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Highlight specific files if requested
    let formatted = trimmed;
    if (options?.highlightFiles) {
      options.highlightFiles.forEach(file => {
        if (trimmed.includes(file)) {
          formatted = trimmed.replace(file, `${scheme.accent}${file}${ANSI_RESET}${scheme.muted}`);
        }
      });
    }
    
    // Add line number
    const lineNum = `${scheme.muted}${String(index + 1).padStart(2, ' ')}.${ANSI_RESET}`;
    lines.push(`${lineNum} ${scheme.muted}${formatted}${ANSI_RESET}`);
  });
  
  if (stackLines.length > maxLines) {
    lines.push(`${scheme.muted}   ... (${stackLines.length - maxLines} more lines)${ANSI_RESET}`);
  }
  
  return lines.join('\n');
}

/**
 * Display recovery suggestions prominently.
 * 
 * Requirement 7.5: Recovery suggestion highlighting
 * 
 * @param suggestions - Array of recovery suggestions
 * @param options - Optional configuration
 * @returns The formatted suggestions string
 */
export function displayRecoverySuggestions(
  suggestions: string[],
  options?: {
    title?: string;
    colorScheme?: ColorScheme;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  
  const title = options?.title || 'Recovery Suggestions';
  
  lines.push('');
  lines.push(`${scheme.info}💡 ${scheme.bold}${title}${ANSI_RESET}`);
  lines.push(`${scheme.info}${'─'.repeat(60)}${ANSI_RESET}`);
  lines.push('');
  
  suggestions.forEach((suggestion, index) => {
    lines.push(`${scheme.accent}  ${index + 1}.${ANSI_RESET} ${scheme.primary}${suggestion}${ANSI_RESET}`);
  });
  
  lines.push('');
  return lines.join('\n');
}

/**
 * Display a summary box with enhanced formatting.
 * 
 * Requirement 6.2: Configuration display formatting
 * Requirement 8.5: Format summary in a visually appealing box
 * 
 * @param title - The summary title
 * @param sections - Array of section objects with title and items
 * @param options - Optional configuration
 * @returns The formatted summary string
 */
export function displaySummaryBox(
  title: string,
  sections: Array<{ title: string; items: Record<string, string | number | boolean> }>,
  options?: {
    colorScheme?: ColorScheme;
    width?: number;
  }
): string {
  const scheme = options?.colorScheme || DEFAULT_COLOR_SCHEME;
  const lines: string[] = [];
  const width = options?.width || 60;
  
  // Top border
  lines.push(`${scheme.boxBorder}╔${'═'.repeat(Math.max(0, width - 2))}╗${ANSI_RESET}`);
  
  // Title
  const titlePadding = width - 4 - title.length;
  const titleLeftPad = Math.max(0, Math.floor(titlePadding / 2));
  const titleRightPad = Math.max(0, titlePadding - titleLeftPad);
  lines.push(
    `${scheme.boxBorder}║${ANSI_RESET}` + 
    ' '.repeat(titleLeftPad + 1) + 
    `${scheme.bold}${title}${ANSI_RESET}` + 
    ' '.repeat(titleRightPad + 1) + 
    `${scheme.boxBorder}║${ANSI_RESET}`
  );
  
  // Separator
  lines.push(`${scheme.boxBorder}╠${'═'.repeat(Math.max(0, width - 2))}╣${ANSI_RESET}`);
  
  // Sections
  sections.forEach((section, index) => {
    // Section title
    const sectionTitlePadding = Math.max(0, width - 3 - section.title.length);
    lines.push(`${scheme.boxBorder}║${ANSI_RESET} ${scheme.accent}${section.title}${ANSI_RESET}${' '.repeat(sectionTitlePadding)}${scheme.boxBorder}║${ANSI_RESET}`);
    
    // Section items
    Object.entries(section.items).forEach(([key, value]) => {
      const valueStr = String(value);
      const line = `   ${scheme.secondary}${key}:${ANSI_RESET} ${scheme.affirmative}${valueStr}${ANSI_RESET}`;
      const strippedLine = line.replace(/\x1b\[.*?m/g, '');
      const padding = Math.max(0, width - 2 - strippedLine.length);
      lines.push(`${scheme.boxBorder}║${ANSI_RESET}${line}${' '.repeat(padding)}${scheme.boxBorder}║${ANSI_RESET}`);
    });
    
    // Add separator between sections (but not after last section)
    if (index < sections.length - 1) {
      lines.push(`${scheme.boxBorder}║${ANSI_RESET}${' '.repeat(Math.max(0, width - 2))}${scheme.boxBorder}║${ANSI_RESET}`);
    }
  });
  
  // Bottom border
  lines.push(`${scheme.boxBorder}╚${'═'.repeat(Math.max(0, width - 2))}╝${ANSI_RESET}`);
  
  return '\n' + lines.join('\n') + '\n';
}
