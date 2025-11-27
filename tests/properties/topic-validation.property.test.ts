import * as fc from 'fast-check';
import { DebateValidator } from '../../src/validators/DebateValidator';

describe('Topic Validation Properties', () => {
  const validator = new DebateValidator();

  // Feature: ai-debate-system, Property 1: Topic validation correctly identifies non-empty topics
  // Validates: Requirements 1.1, 1.4
  it('should return true if and only if the string contains at least one non-whitespace character', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = validator.validateTopic(input);
        const hasNonWhitespace = input.trim().length > 0;
        
        // The validation should return true if and only if there's at least one non-whitespace character
        return result.isValid === hasNonWhitespace;
      }),
      { numRuns: 100 }
    );
  });

  // Additional property: Valid topics should have no errors
  it('should return no errors for valid topics', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length > 0),
        (validTopic) => {
          const result = validator.validateTopic(validTopic);
          return result.isValid && result.errors.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Invalid topics should have at least one error
  it('should return at least one error for invalid topics', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.string().filter(s => s.length > 0 && s.trim().length === 0)
        ),
        (invalidTopic) => {
          const result = validator.validateTopic(invalidTopic);
          return !result.isValid && result.errors.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
