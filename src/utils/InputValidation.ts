/**
 * Input Validation Utilities
 * 
 * Provides validation functions for interactive mode inputs.
 * 
 * Requirements:
 * - 4.2: Validate topic is non-empty and meaningful
 * - 5.2: Validate preparation time is positive number
 * - 5.3: Display error messages with suggested ranges
 */

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate preparation time input.
 * 
 * Requirement 5.2: Validate that preparation time is a positive number
 * 
 * @param input - The preparation time input (can be string or number)
 * @returns ValidationResult indicating if input is valid
 */
export function validatePreparationTime(input: string | number): ValidationResult {
  // Convert to number if string
  const value = typeof input === 'string' ? parseFloat(input) : input;

  // Check if it's a valid number
  if (isNaN(value)) {
    return {
      isValid: false,
      error: 'Preparation time must be a number. Suggested range: 30-300 seconds.'
    };
  }

  // Check if it's positive
  if (value <= 0) {
    return {
      isValid: false,
      error: 'Preparation time must be a positive number. Suggested range: 30-300 seconds.'
    };
  }

  // Warn if value is outside suggested range (but still valid)
  if (value < 30) {
    return {
      isValid: true,
      error: 'Warning: Preparation time is very short (< 30 seconds). Consider using 30-300 seconds.'
    };
  }

  if (value > 600) {
    return {
      isValid: true,
      error: 'Warning: Preparation time is very long (> 600 seconds). Consider using 30-300 seconds.'
    };
  }

  return { isValid: true };
}

/**
 * Validate topic input.
 * 
 * Requirement 4.2: Validate that topic is non-empty and contains meaningful content
 * 
 * @param topic - The debate topic string
 * @returns ValidationResult indicating if topic is valid
 */
export function validateTopic(topic: string): ValidationResult {
  // Trim whitespace
  const trimmed = topic.trim();

  // Check if empty
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Topic cannot be empty. Please provide a meaningful debate topic.'
    };
  }

  // Check minimum length (meaningful content)
  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: 'Topic is too short. Please provide a meaningful topic (at least 10 characters).'
    };
  }

  // Check maximum length
  if (trimmed.length > 500) {
    return {
      isValid: false,
      error: 'Topic is too long. Please keep it under 500 characters.'
    };
  }

  // Check if it's only whitespace or special characters
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Topic must contain alphanumeric characters. Please provide a meaningful debate topic.'
    };
  }

  return { isValid: true };
}

/**
 * Format validation error message for display.
 * 
 * Requirement 5.3: Add error message formatting for validation failures
 * 
 * @param error - The error message
 * @returns Formatted error message with visual indicators
 */
export function formatValidationError(error: string): string {
  return `❌ ${error}`;
}

/**
 * Format validation warning message for display.
 * 
 * @param warning - The warning message
 * @returns Formatted warning message with visual indicators
 */
export function formatValidationWarning(warning: string): string {
  return `⚠️  ${warning}`;
}
