/**
 * Display Utilities for Interactive CLI
 * 
 * Provides functions for displaying menus, confirmations, errors, and other
 * visual elements in the interactive command-line interface.
 * 
 * Requirements:
 * - 8.1: Clear labels and descriptions for configuration options
 * - 8.2: Display confirmation of selected values
 * - 8.3: Number options and indicate how to make selections
 * - 8.4: Display error messages in visually distinct format
 * - 8.5: Display formatted summary of all settings
 */

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
 * 
 * @param title - The menu title
 * @param options - Array of menu options
 * @param includeExit - Whether to include an exit option (default: true)
 * @returns The formatted menu string
 */
export function displayMenu(
  title: string,
  options: MenuOption[],
  includeExit: boolean = true
): string {
  const lines: string[] = [];
  
  // Add title
  lines.push(`\n${title}`);
  lines.push('─'.repeat(60));
  lines.push('');
  
  // Add numbered options
  options.forEach((option, index) => {
    const number = index + 1;
    if (option.description) {
      lines.push(`  ${number}. ${option.label} - ${option.description}`);
    } else {
      lines.push(`  ${number}. ${option.label}`);
    }
  });
  
  // Add exit option if requested
  if (includeExit) {
    lines.push(`  ${options.length + 1}. Exit`);
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Display a confirmation message for a selected value.
 * 
 * Requirement 8.2: Display confirmation of selected value
 * 
 * @param label - The label for the confirmed value
 * @param value - The confirmed value
 * @returns The formatted confirmation string
 */
export function displayConfirmation(label: string, value: string): string {
  return `\n✓ ${label}: ${value}\n`;
}

/**
 * Display an error message in a visually distinct format.
 * 
 * Requirement 8.4: Display error messages in visually distinct format
 * 
 * @param message - The error message to display
 * @returns The formatted error string
 */
export function displayError(message: string): string {
  return `\n❌ ${message}\n`;
}

/**
 * Display a success message.
 * 
 * @param message - The success message to display
 * @returns The formatted success string
 */
export function displaySuccess(message: string): string {
  return `\n✓ ${message}\n`;
}

/**
 * Display a warning message.
 * 
 * @param message - The warning message to display
 * @returns The formatted warning string
 */
export function displayWarning(message: string): string {
  return `\n⚠️  ${message}\n`;
}

/**
 * Display an info message.
 * 
 * @param message - The info message to display
 * @returns The formatted info string
 */
export function displayInfo(message: string): string {
  return `\nℹ️  ${message}\n`;
}

/**
 * Create a box around text content.
 * 
 * Requirement 8.5: Display formatted summary
 * 
 * @param content - The content to box
 * @param width - The width of the box (default: 60)
 * @returns The boxed content string
 */
export function displayBox(content: string, width: number = 60): string {
  const lines: string[] = [];
  
  // Top border
  lines.push('╔' + '═'.repeat(width - 2) + '╗');
  
  // Content lines
  const contentLines = content.split('\n');
  contentLines.forEach(line => {
    const padding = width - 4 - line.length;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    lines.push('║ ' + ' '.repeat(leftPad) + line + ' '.repeat(rightPad) + ' ║');
  });
  
  // Bottom border
  lines.push('╚' + '═'.repeat(width - 2) + '╝');
  
  return lines.join('\n');
}

/**
 * Display a horizontal separator.
 * 
 * @param width - The width of the separator (default: 60)
 * @param char - The character to use (default: '─')
 * @returns The separator string
 */
export function displaySeparator(width: number = 60, char: string = '─'): string {
  return char.repeat(width);
}

/**
 * Display a section header.
 * 
 * Requirement 8.1: Clear labels and descriptions
 * 
 * @param title - The section title
 * @param width - The width of the header (default: 60)
 * @returns The formatted header string
 */
export function displayHeader(title: string, width: number = 60): string {
  const lines: string[] = [];
  lines.push('');
  lines.push(title);
  lines.push('─'.repeat(width));
  lines.push('');
  return lines.join('\n');
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
  const indentStr = ' '.repeat(indent);
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
 * Requirement 8.5: Display formatted summary of all settings
 * 
 * @param title - The section title
 * @param items - Key-value pairs to display
 * @returns The formatted section string
 */
export function displayConfigSection(title: string, items: Record<string, string | number | boolean>): string {
  const lines: string[] = [];
  lines.push(`\n${title}`);
  
  Object.entries(items).forEach(([key, value]) => {
    lines.push(displayKeyValue(key, value));
  });
  
  lines.push('');
  return lines.join('\n');
}
