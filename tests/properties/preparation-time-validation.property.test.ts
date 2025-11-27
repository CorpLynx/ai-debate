import * as fc from 'fast-check';
import { validatePreparationTime } from '../../src/utils/InputValidation';

describe('Preparation Time Validation Properties', () => {
  // Feature: interactive-mode, Property 11: Preparation time validation accepts only positive numbers
  // Validates: Requirements 5.2
  it('should accept only positive numbers', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.double(), // Generate any double
          fc.integer(), // Generate any integer
          fc.string()   // Generate any string
        ),
        (input) => {
          const result = validatePreparationTime(input);
          
          // Convert to number
          const numValue = typeof input === 'string' ? parseFloat(input) : input;
          
          // Should be valid if and only if it's a positive number
          const shouldBeValid = !isNaN(numValue) && numValue > 0;
          
          return result.isValid === shouldBeValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Positive numbers should always be valid
  it('should always accept positive numbers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, noNaN: true, noDefaultInfinity: true }),
        (positiveNumber) => {
          const result = validatePreparationTime(positiveNumber);
          return result.isValid === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Zero and negative numbers should be rejected
  it('should reject zero and negative numbers', () => {
    fc.assert(
      fc.property(
        fc.double({ max: 0, noNaN: true, noDefaultInfinity: true }),
        (nonPositiveNumber) => {
          const result = validatePreparationTime(nonPositiveNumber);
          return result.isValid === false && result.error !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Non-numeric strings should be rejected
  it('should reject non-numeric strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => isNaN(parseFloat(s))),
        (nonNumericString) => {
          const result = validatePreparationTime(nonNumericString);
          return result.isValid === false && result.error !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Numeric strings representing positive numbers should be accepted
  it('should accept numeric strings representing positive numbers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.001, noNaN: true, noDefaultInfinity: true }),
        (positiveNumber) => {
          const numericString = positiveNumber.toString();
          const result = validatePreparationTime(numericString);
          return result.isValid === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
