import { ValidationResult } from '../models/ValidationResult';
import { DebateConfig } from '../models/DebateConfig';

export class DebateValidator {
  /**
   * Validates that a debate topic is non-empty and contains at least one non-whitespace character.
   * 
   * @param topic - The debate topic to validate
   * @returns ValidationResult indicating whether the topic is valid
   */
  validateTopic(topic: string): ValidationResult {
    const errors: string[] = [];

    // Check if topic contains at least one non-whitespace character
    if (!topic || topic.trim().length === 0) {
      errors.push('Topic must contain at least one non-whitespace character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates debate configuration parameters.
   * 
   * @param config - The debate configuration to validate
   * @returns ValidationResult with list of invalid parameter names
   */
  validateConfig(config: Partial<DebateConfig>): ValidationResult {
    const errors: string[] = [];
    const invalidParams: string[] = [];

    // Validate timeLimit
    if (config.timeLimit !== undefined) {
      if (typeof config.timeLimit !== 'number' || config.timeLimit <= 0 || !isFinite(config.timeLimit)) {
        errors.push('timeLimit must be a positive finite number');
        invalidParams.push('timeLimit');
      }
    }

    // Validate wordLimit
    if (config.wordLimit !== undefined) {
      if (typeof config.wordLimit !== 'number' || config.wordLimit <= 0 || !isFinite(config.wordLimit) || !Number.isInteger(config.wordLimit)) {
        errors.push('wordLimit must be a positive integer');
        invalidParams.push('wordLimit');
      }
    }

    // Validate strictMode
    if (config.strictMode !== undefined) {
      if (typeof config.strictMode !== 'boolean') {
        errors.push('strictMode must be a boolean');
        invalidParams.push('strictMode');
      }
    }

    // Validate showPreparation
    if (config.showPreparation !== undefined) {
      if (typeof config.showPreparation !== 'boolean') {
        errors.push('showPreparation must be a boolean');
        invalidParams.push('showPreparation');
      }
    }

    // Validate numCrossExamQuestions
    if (config.numCrossExamQuestions !== undefined) {
      if (typeof config.numCrossExamQuestions !== 'number' || config.numCrossExamQuestions < 0 || !isFinite(config.numCrossExamQuestions) || !Number.isInteger(config.numCrossExamQuestions)) {
        errors.push('numCrossExamQuestions must be a non-negative integer');
        invalidParams.push('numCrossExamQuestions');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      invalidParams
    };
  }

  /**
   * Validates a response against configuration constraints.
   * 
   * @param response - The response text to validate
   * @param config - The debate configuration with constraints
   * @returns ValidationResult indicating whether the response is valid
   */
  validateResponse(response: string, config: DebateConfig): ValidationResult {
    const errors: string[] = [];

    // Validate word limit if configured
    if (config.wordLimit !== undefined && config.wordLimit > 0) {
      const wordCount = response.split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount > config.wordLimit) {
        errors.push(`Response exceeds word limit of ${config.wordLimit} (actual: ${wordCount})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
