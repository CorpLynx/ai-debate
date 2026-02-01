/**
 * Custom error class for personality profile validation and generation errors.
 * Provides clear, actionable error messages for personality-related issues.
 */
export class PersonalityError extends Error {
  public readonly invalidParams: string[];
  public readonly validationErrors: string[];

  constructor(message: string, invalidParams: string[] = [], validationErrors: string[] = []) {
    super(message);
    this.name = 'PersonalityError';
    this.invalidParams = invalidParams;
    this.validationErrors = validationErrors;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PersonalityError);
    }
  }

  /**
   * Creates a PersonalityError from validation results.
   * 
   * @param errors - Array of validation error messages
   * @param invalidParams - Array of invalid parameter names
   * @returns A new PersonalityError with formatted message
   */
  static fromValidation(errors: string[], invalidParams: string[]): PersonalityError {
    const message = `Invalid personality profile: ${errors.join('; ')}`;
    return new PersonalityError(message, invalidParams, errors);
  }

  /**
   * Creates a user-friendly error message with suggestions for fixing the issue.
   * 
   * @returns A formatted error message with actionable guidance
   */
  toUserFriendlyMessage(): string {
    let message = `Personality Profile Error: ${this.message}\n\n`;
    
    if (this.validationErrors.length > 0) {
      message += 'Issues found:\n';
      this.validationErrors.forEach((error, index) => {
        message += `  ${index + 1}. ${error}\n`;
      });
      message += '\n';
    }
    
    if (this.invalidParams.length > 0) {
      message += `Invalid parameters: ${this.invalidParams.join(', ')}\n\n`;
    }
    
    message += 'How to fix:\n';
    message += '  • Ensure all trait values (civility, manner, researchDepth, rhetoricUsage) are numbers between 0 and 10\n';
    message += '  • Ensure tactics is an array of valid DebateTactic values\n';
    message += '  • All required dimensions must be present\n';
    
    return message;
  }
}
