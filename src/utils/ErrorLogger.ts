import { Debate } from '../models/Debate';
import { DebateError } from '../models/DebateError';
import { DebateState } from '../models/DebateState';
import { RoundType } from '../models/RoundType';

/**
 * Utility class for logging errors during debates
 */
export class ErrorLogger {
  /**
   * Logs an error and adds it to the debate's error list
   * 
   * @param debate - The current debate
   * @param error - The error that occurred
   * @param model - Optional model name that caused the error
   * @param round - Optional round type where the error occurred
   * @returns Updated debate with the error logged
   */
  static logError(
    debate: Debate,
    error: Error,
    model?: string,
    round?: RoundType
  ): Debate {
    const debateError: DebateError = {
      timestamp: new Date(),
      message: error.message,
      state: debate.state,
      round,
      model,
      originalError: error
    };

    // Log to console for immediate visibility
    console.error('[Debate Error]', {
      debateId: debate.id,
      state: debate.state,
      round,
      model,
      message: error.message
    });

    // Add error to debate's error list
    const errors = debate.errors || [];
    return {
      ...debate,
      errors: [...errors, debateError]
    };
  }

  /**
   * Creates a user-friendly error notification message
   * 
   * @param error - The debate error
   * @returns A clear description of what went wrong
   */
  static formatErrorNotification(error: DebateError): string {
    let message = `Error during debate: ${error.message}\n`;
    message += `State: ${error.state}\n`;
    
    if (error.round) {
      message += `Round: ${error.round}\n`;
    }
    
    if (error.model) {
      message += `Model: ${error.model}\n`;
    }
    
    message += `Time: ${error.timestamp.toISOString()}`;
    
    return message;
  }
}
