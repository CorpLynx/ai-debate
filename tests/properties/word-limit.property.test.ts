import * as fc from 'fast-check';
import { ConfigurationManager } from '../../src/utils/ConfigurationManager';
import { DebateConfig } from '../../src/models/DebateConfig';

describe('Word Limit Enforcement Properties', () => {
  const configManager = new ConfigurationManager();

  // Feature: ai-debate-system, Property 20: Word limit enforcement
  // Validates: Requirements 10.2
  it('should truncate or reject statements exceeding the word limit', () => {
    fc.assert(
      fc.property(
        // Generate a statement with random words
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 100 }),
        // Generate a word limit
        fc.integer({ min: 1, max: 50 }),
        (words, wordLimit) => {
          const statement = words.join(' ');
          const actualWordCount = statement.split(/\s+/).filter(w => w.length > 0).length;
          
          const config: DebateConfig = {
            wordLimit,
            strictMode: false,
            showPreparation: true,
            numCrossExamQuestions: 3
          };

          // Check if statement exceeds limit
          const exceedsLimit = configManager.exceedsWordLimit(statement, config);
          
          // Property: exceedsLimit should be true if and only if actualWordCount > wordLimit
          const expectedExceedsLimit = actualWordCount > wordLimit;
          
          if (exceedsLimit !== expectedExceedsLimit) {
            return false;
          }

          // If it exceeds, enforcing the limit should reduce it to at most wordLimit words
          if (exceedsLimit) {
            const truncated = configManager.enforceWordLimit(statement, wordLimit);
            const truncatedWordCount = truncated.split(/\s+/).filter(w => w.length > 0).length;
            
            // The truncated statement should have at most wordLimit words
            // (allowing for the "..." suffix which doesn't count as a word in our implementation)
            return truncatedWordCount <= wordLimit;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Statements within limit should not be modified
  it('should not modify statements within the word limit', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 21, max: 100 }),
        (words, wordLimit) => {
          const statement = words.join(' ');
          const actualWordCount = statement.split(/\s+/).filter(w => w.length > 0).length;
          
          // Only test when statement is within limit
          if (actualWordCount > wordLimit) {
            return true; // Skip this case
          }

          const enforced = configManager.enforceWordLimit(statement, wordLimit);
          
          // Statement should be unchanged
          return enforced === statement;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Zero or negative word limits should not truncate
  it('should not truncate when word limit is zero or negative', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 50 }),
        fc.integer({ min: -10, max: 0 }),
        (words, wordLimit) => {
          const statement = words.join(' ');
          
          const config: DebateConfig = {
            wordLimit,
            strictMode: false,
            showPreparation: true,
            numCrossExamQuestions: 3
          };

          // Should not exceed limit when limit is non-positive
          const exceedsLimit = configManager.exceedsWordLimit(statement, config);
          return !exceedsLimit;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Enforcing word limit should always produce valid output
  it('should always produce a valid string when enforcing word limit', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 100 }),
        fc.integer({ min: 1, max: 50 }),
        (words, wordLimit) => {
          const statement = words.join(' ');
          const enforced = configManager.enforceWordLimit(statement, wordLimit);
          
          // Result should be a string
          return typeof enforced === 'string';
        }
      ),
      { numRuns: 100 }
    );
  });
});
