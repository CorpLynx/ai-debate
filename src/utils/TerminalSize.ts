/**
 * Terminal size information
 */
export interface TerminalSize {
  width: number;
  height: number;
  isNarrow: boolean;  // < 80 columns
  isWide: boolean;    // > 120 columns
}

/**
 * Default terminal size when detection fails
 */
const DEFAULT_TERMINAL_SIZE: TerminalSize = {
  width: 80,
  height: 24,
  isNarrow: false,
  isWide: false
};

/**
 * Thresholds for terminal width classification
 */
const NARROW_THRESHOLD = 80;
const WIDE_THRESHOLD = 120;

/**
 * Detects the current terminal dimensions
 * @returns Terminal size information
 */
export function getTerminalSize(): TerminalSize {
  try {
    // Try to get terminal size from process.stdout
    const width = process.stdout.columns || DEFAULT_TERMINAL_SIZE.width;
    const height = process.stdout.rows || DEFAULT_TERMINAL_SIZE.height;
    
    return {
      width,
      height,
      isNarrow: width < NARROW_THRESHOLD,
      isWide: width > WIDE_THRESHOLD
    };
  } catch (error) {
    // If detection fails, return default size
    return DEFAULT_TERMINAL_SIZE;
  }
}

/**
 * Checks if the terminal supports ANSI color codes
 * @returns true if colors are supported
 */
export function supportsColor(): boolean {
  try {
    // Check if stdout is a TTY
    if (!process.stdout.isTTY) {
      return false;
    }
    
    // Check environment variables
    if (process.env.NO_COLOR !== undefined) {
      return false;
    }
    
    if (process.env.FORCE_COLOR !== undefined) {
      return true;
    }
    
    // Check TERM environment variable
    const term = process.env.TERM || '';
    if (term === 'dumb') {
      return false;
    }
    
    // Most modern terminals support colors
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if the terminal supports hyperlinks (OSC 8)
 * @returns true if hyperlinks are supported
 */
export function supportsHyperlinks(): boolean {
  try {
    // Check if stdout is a TTY
    if (!process.stdout.isTTY) {
      return false;
    }
    
    // Check for known terminals that support hyperlinks
    const termProgram = process.env.TERM_PROGRAM || '';
    const term = process.env.TERM || '';
    
    // iTerm2, VS Code terminal, and some others support hyperlinks
    const supportedTerminals = [
      'iTerm.app',
      'vscode',
      'Hyper',
      'WezTerm'
    ];
    
    if (supportedTerminals.includes(termProgram)) {
      return true;
    }
    
    // Check for VTE-based terminals (GNOME Terminal, etc.)
    if (process.env.VTE_VERSION !== undefined) {
      const vteVersion = parseInt(process.env.VTE_VERSION, 10);
      return vteVersion >= 5000; // VTE 0.50.0+
    }
    
    // Windows Terminal supports hyperlinks
    if (process.env.WT_SESSION !== undefined) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the effective terminal width for content formatting
 * Accounts for margins and padding
 * @param margin Optional margin to subtract from width
 * @returns Effective width for content
 */
export function getEffectiveWidth(margin: number = 4): number {
  const size = getTerminalSize();
  return Math.max(40, size.width - margin); // Minimum 40 chars
}

/**
 * Checks if the terminal is in a CI/CD environment
 * @returns true if running in CI
 */
export function isCI(): boolean {
  return process.env.CI !== undefined || 
         process.env.CONTINUOUS_INTEGRATION !== undefined;
}
