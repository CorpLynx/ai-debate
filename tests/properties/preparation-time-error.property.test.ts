import * as fc from 'fast-check';
import { validatePreparationTime, formatValidationError } from '../../src/utils/InputValidation';

describe('Preparation Time Error Properties', () => {
  // Feature: interactive-mode, Property 12: Invalid preparation time triggers error
  // Validates: Requirements 5.3
  it('should trigger error message for invalid preparation time', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ max: 0, noNaN: true, noDefaultInfinity: true }), // Zero or negative
          fc.string().filter(s => isNaN(parseFloat(s))), // Non-numeric strings
          fc.constant(NaN) // NaN values
        ),
        (invalidInput) => {
          const result = validatePreparationTime(invalidInput);
          
          // Invalid inputs should always have isValid = false
          if (result.isValid) {
            return false;
          }
          
          // Invalid inputs should always have an error message
          if (!result.error) {
            return false;
          }
          
          // Error message should contain suggested range
          const errorContainsSuggestion = result.error.includes('30-300');
          
          return errorContainsSuggestion;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Error messages should be properly formatted
  it('should format error messages with visual indicators', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.length > 0),
        (errorMessage) => {
          const formatted = formatValidationError(errorMessage);
          
          // Formatted error should contain the original message
          const containsOriginal = formatted.includes(errorMessage);
          
          // Formatted error should have visual indicator
          const hasIndicator = formatted.includes('❌');
          
          return containsOriginal && hasIndicator;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: All invalid inputs should produce non-empty error messages
  it('should produce non-empty error messages for all invalid inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ max: 0, noNaN: true, noDefaultInfinity: true }),
          fc.string().filter(s => isNaN(parseFloat(s)))
        ),
        (invalidInput) => {
          const result = validatePreparationTime(invalidInput);
          
          if (result.isValid) {
            return true; // Skip valid inputs
          }
          
          return result.error !== undefined && result.error.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Error messages should be descriptive
  it('should provide descriptive error messages', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double({ max: 0, noNaN: true, noDefaultInfinity: true }),
          fc.string().filter(s => isNaN(parseFloat(s)))
        ),
        (invalidInput) => {
          const result = validatePreparationTime(invalidInput);
          
          if (result.isValid) {
            return true; // Skip valid inputs
          }
          
          // Error message should mention "preparation time"
          const mentionsPreparationTime = result.error!.toLowerCase().includes('preparation time');
          
          // Error message should be reasonably long (descriptive)
          const isDescriptive = result.error!.length > 20;
          
          return mentionsPreparationTime && isDescriptive;
        }
      ),
      { numRuns: 100 }
    );
  });
});
