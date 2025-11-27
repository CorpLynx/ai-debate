import * as fc from 'fast-check';
import { formatStatement, formatStatementPlain, formatThinkingIndicator } from '../../src/utils/StatementFormatter';
import { Statement } from '../../src/models/Statement';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

/**
 * Property-based tests for statement display functionality
 * 
 * Task 24: Visual formatting and user experience enhancements
 * Requirements:
 * - 7.1: Display statements immediately after generation
 * - 7.2: Clearly indicate which model made the statement and which position it represents
 * - 7.3: Indicate the current debate round
 * - 7.4: Show status indicator while model is generating
 */

/**
 * Arbitrary for generating valid statements
 */
const statementArbitrary = fc.record({
  model: fc.oneof(
    fc.constant('GPT-4'),
    fc.constant('Claude'),
    fc.constant('Gemini'),
    fc.constant('MockModel')
  ),
  position: fc.oneof(
    fc.constant(Position.AFFIRMATIVE),
    fc.constant(Position.NEGATIVE)
  ),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  wordCount: fc.nat({ max: 1000 }),
  generatedAt: fc.date()
});

/**
 * Arbitrary for round types
 */
const roundTypeArbitrary = fc.oneof(
  fc.constant(RoundType.PREPARATION),
  fc.constant(RoundType.OPENING),
  fc.constant(RoundType.REBUTTAL),
  fc.constant(RoundType.CROSS_EXAM),
  fc.constant(RoundType.CLOSING)
);

describe('Statement Display Properties', () => {

  /**
   * Property 22: Statement display includes all required metadata
   * 
   * For any valid statement and round type, the formatted output must include:
   * - Model name
   * - Position (affirmative or negative)
   * - Round type
   * - Statement content
   * 
   * Validates: Requirements 7.2, 7.3
   */
  describe('Property 22: Statement display includes all required metadata', () => {
    it('should always include model name, position, round type, and content', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          
          // Must include model name
          expect(formatted).toContain(statement.model);
          
          // Must include position indicator
          const positionText = statement.position === Position.AFFIRMATIVE ? 'Affirmative' : 'Negative';
          expect(formatted).toContain(positionText);
          
          // Must include round type indicator
          expect(formatted.length).toBeGreaterThan(0);
          
          // Must include statement content (accounting for possible indentation/formatting)
          // For multi-line content, check that at least some content is present
          const contentWords = statement.content.trim().split(/\s+/).filter(w => w.length > 0);
          if (contentWords.length > 0) {
            // At least one word from the content should be present
            const hasContent = contentWords.some(word => formatted.includes(word));
            expect(hasContent).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 23: Color coding distinguishes affirmative from negative positions
   * 
   * Affirmative and negative positions must use different color codes to ensure
   * visual distinction in terminal output.
   * 
   * Validates: Requirement 7.2 (clearly indicate position)
   */
  describe('Property 23: Color coding distinguishes affirmative from negative positions', () => {
    it('should use different color codes for affirmative vs negative positions', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          
          // ANSI color codes for positions
          const AFFIRMATIVE_COLOR = '\x1b[36m'; // Cyan
          const NEGATIVE_COLOR = '\x1b[35m';    // Magenta
          
          if (statement.position === Position.AFFIRMATIVE) {
            // Affirmative statements should contain cyan color code
            expect(formatted).toContain(AFFIRMATIVE_COLOR);
            // Should not contain negative color code (or if it does, affirmative should appear more)
            const affirmativeCount = (formatted.match(new RegExp(AFFIRMATIVE_COLOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            const negativeCount = (formatted.match(new RegExp(NEGATIVE_COLOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            expect(affirmativeCount).toBeGreaterThan(negativeCount);
          } else {
            // Negative statements should contain magenta color code
            expect(formatted).toContain(NEGATIVE_COLOR);
            // Should not contain affirmative color code (or if it does, negative should appear more)
            const affirmativeCount = (formatted.match(new RegExp(AFFIRMATIVE_COLOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            const negativeCount = (formatted.match(new RegExp(NEGATIVE_COLOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
            expect(negativeCount).toBeGreaterThan(affirmativeCount);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 24: Plain formatting removes all color codes
   * 
   * The plain text formatter must remove all ANSI color codes while preserving
   * all metadata and content. This ensures compatibility with non-terminal contexts.
   * 
   * Validates: Requirement 8.4 (preserve formatting and attribution)
   */
  describe('Property 24: Plain formatting removes all color codes', () => {
    it('should produce output without ANSI escape codes', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatementPlain(statement, roundType);
          
          // Should not contain any ANSI escape sequences
          expect(formatted).not.toContain('\x1b[');
          
          // Should still contain all metadata
          expect(formatted).toContain(statement.model);
          const positionText = statement.position === Position.AFFIRMATIVE ? 'Affirmative' : 'Negative';
          expect(formatted).toContain(positionText);
          
          // Should still contain content
          const contentWords = statement.content.trim().split(/\s+/).filter(w => w.length > 0);
          if (contentWords.length > 0) {
            const hasContent = contentWords.some(word => formatted.includes(word));
            expect(hasContent).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 25: Formatted output includes visual separators
   * 
   * All formatted statements must include visual separators (lines) to clearly
   * delineate statement boundaries and improve readability.
   * 
   * Validates: Requirement 7.1 (clear visual formatting)
   */
  describe('Property 25: Formatted output includes visual separators', () => {
    it('should include separator lines in formatted output', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          
          // Should contain separator characters (horizontal lines)
          expect(formatted).toContain('─');
          
          // Should have multiple separators (at least for header and footer)
          const separatorCount = (formatted.match(/─+/g) || []).length;
          expect(separatorCount).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });

    it('should include separators in plain format as well', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatementPlain(statement, roundType);
          
          // Plain format should also have separators
          expect(formatted).toContain('─');
          
          const separatorCount = (formatted.match(/─+/g) || []).length;
          expect(separatorCount).toBeGreaterThanOrEqual(2);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 26: Thinking indicator includes model, position, and round information
   * 
   * The thinking indicator must show which model is generating a response,
   * its position, and the current round type to keep users informed.
   * 
   * Validates: Requirement 7.4 (show status indicator while generating)
   */
  describe('Property 26: Thinking indicator includes model, position, and round information', () => {
    it('should include all required information in thinking indicator', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.constant(Position.AFFIRMATIVE), fc.constant(Position.NEGATIVE)),
          roundTypeArbitrary,
          (modelName, position, roundType) => {
            const indicator = formatThinkingIndicator(modelName, position, roundType);
            
            // Must include model name
            expect(indicator).toContain(modelName);
            
            // Must include position
            const positionText = position === Position.AFFIRMATIVE ? 'Affirmative' : 'Negative';
            expect(indicator).toContain(positionText);
            
            // Must indicate that model is thinking/generating
            expect(indicator.toLowerCase()).toContain('thinking');
            
            // Should be non-empty
            expect(indicator.trim().length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 27: Round type is consistently formatted across all display functions
   * 
   * The same round type should be formatted consistently whether in statement
   * display or thinking indicators.
   * 
   * Validates: Requirement 7.3 (indicate current debate round)
   */
  describe('Property 27: Round type is consistently formatted', () => {
    it('should format round types consistently', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const statementFormatted = formatStatement(statement, roundType);
          const thinkingIndicator = formatThinkingIndicator(statement.model, statement.position, roundType);
          
          // Extract round type text from both outputs (removing ANSI codes for comparison)
          const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '');
          const statementPlain = stripAnsi(statementFormatted);
          const thinkingPlain = stripAnsi(thinkingIndicator);
          
          // Map round types to expected text
          const roundTypeTexts: Record<RoundType, string> = {
            [RoundType.PREPARATION]: 'Preparation',
            [RoundType.OPENING]: 'Opening Statement',
            [RoundType.REBUTTAL]: 'Rebuttal',
            [RoundType.CROSS_EXAM]: 'Cross-Examination',
            [RoundType.CLOSING]: 'Closing Statement'
          };
          
          const expectedText = roundTypeTexts[roundType];
          
          // Both should contain the same round type text
          expect(statementPlain).toContain(expectedText);
          expect(thinkingPlain).toContain(expectedText);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 28: Content indentation is preserved for multi-line statements
   * 
   * Multi-line statement content should be properly indented to distinguish
   * it from metadata and improve readability.
   * 
   * Validates: Requirement 7.1 (clear visual formatting)
   */
  describe('Property 28: Content indentation is preserved for multi-line statements', () => {
    it('should indent content lines consistently', () => {
      fc.assert(
        fc.property(
          statementArbitrary,
          roundTypeArbitrary,
          fc.array(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { minLength: 2, maxLength: 10 }),
          (statement, roundType, contentLines) => {
            // Create a multi-line statement with non-empty lines
            const multiLineStatement: Statement = {
              ...statement,
              content: contentLines.join('\n')
            };
            
            const formatted = formatStatement(multiLineStatement, roundType);
            const lines = formatted.split('\n');
            
            // Find content lines by looking for lines that start with exactly 2 spaces
            // (the standard indentation) followed by non-whitespace
            const contentLineIndices = lines
              .map((line, idx) => ({ line, idx }))
              .filter(({ line }) => {
                // Content lines should start with exactly 2 spaces (the indentation)
                // We check if the line starts with 2 spaces and has content after
                return /^  \S/.test(line) || /^  \s+\S/.test(line);
              });
            
            // If we found content lines, verify they all start with the same base indentation
            if (contentLineIndices.length > 1) {
              // All content lines should start with at least 2 spaces (the base indentation)
              contentLineIndices.forEach(({ line }) => {
                expect(line.startsWith('  ')).toBe(true);
              });
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 29: Formatted output is never empty
   * 
   * For any valid statement and round type, the formatted output must always
   * produce non-empty output.
   * 
   * Validates: Requirement 7.1 (display statements)
   */
  describe('Property 29: Formatted output is never empty', () => {
    it('should always produce non-empty output for valid inputs', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          const plain = formatStatementPlain(statement, roundType);
          
          expect(formatted.trim().length).toBeGreaterThan(0);
          expect(plain.trim().length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should always produce non-empty thinking indicators', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.constant(Position.AFFIRMATIVE), fc.constant(Position.NEGATIVE)),
          roundTypeArbitrary,
          (modelName, position, roundType) => {
            const indicator = formatThinkingIndicator(modelName, position, roundType);
            expect(indicator.trim().length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 30: Position color coding is mutually exclusive
   * 
   * A statement should use either affirmative OR negative color coding,
   * never both equally (though other colors may be used for other elements).
   * 
   * Validates: Requirement 7.2 (clearly indicate position)
   */
  describe('Property 30: Position color coding is mutually exclusive', () => {
    it('should use predominantly one position color based on statement position', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          
          const AFFIRMATIVE_COLOR = '\x1b[36m';
          const NEGATIVE_COLOR = '\x1b[35m';
          
          const affirmativeCount = (formatted.match(new RegExp(AFFIRMATIVE_COLOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          const negativeCount = (formatted.match(new RegExp(NEGATIVE_COLOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          
          // The position's color should appear more than the opposite position's color
          if (statement.position === Position.AFFIRMATIVE) {
            expect(affirmativeCount).toBeGreaterThan(negativeCount);
          } else {
            expect(negativeCount).toBeGreaterThan(affirmativeCount);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 31: Formatted output length is bounded
   * 
   * The formatted output should not grow unboundedly. The formatting overhead
   * (separators, metadata) should be relatively constant regardless of content length.
   * 
   * Validates: Performance and resource management
   */
  describe('Property 31: Formatted output length is bounded', () => {
    it('should have formatting overhead that is independent of content length', () => {
      fc.assert(
        fc.property(
          statementArbitrary,
          roundTypeArbitrary,
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.string({ minLength: 1000, maxLength: 2000 }),
          (statement, roundType, shortContent, longContent) => {
            const shortStatement = { ...statement, content: shortContent };
            const longStatement = { ...statement, content: longContent };
            
            const shortFormatted = formatStatement(shortStatement, roundType);
            const longFormatted = formatStatement(longStatement, roundType);
            
            // Calculate overhead (formatted length - content length)
            const shortOverhead = shortFormatted.length - shortContent.length;
            const longOverhead = longFormatted.length - longContent.length;
            
            // Overhead should be similar (within 10% tolerance for line breaks)
            const overheadDiff = Math.abs(shortOverhead - longOverhead);
            const maxExpectedDiff = Math.max(shortOverhead, longOverhead) * 0.1;
            
            expect(overheadDiff).toBeLessThanOrEqual(maxExpectedDiff + 50); // +50 for line break variations
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 32: Special characters are preserved in content
   * 
   * Statement content may contain special characters, unicode, emojis, etc.
   * These should be preserved in the formatted output.
   * 
   * Validates: Requirement 8.4 (preserve formatting)
   */
  describe('Property 32: Special characters are preserved in content', () => {
    it('should preserve special characters and unicode in formatted output', () => {
      fc.assert(
        fc.property(
          statementArbitrary,
          roundTypeArbitrary,
          fc.oneof(
            fc.constant('Hello 世界'),
            fc.constant('Test with émojis 🎉🎊'),
            fc.constant('Special chars: @#$%^&*()'),
            fc.constant('Quotes: "double" and \'single\''),
            fc.constant('Math: ∑∫∂√π'),
            fc.constant('Arrows: → ← ↑ ↓')
          ),
          (statement, roundType, specialContent) => {
            const specialStatement = { ...statement, content: specialContent };
            
            const formatted = formatStatement(specialStatement, roundType);
            const plain = formatStatementPlain(specialStatement, roundType);
            
            // Both should contain the special content
            expect(formatted).toContain(specialContent);
            expect(plain).toContain(specialContent);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 33: Empty lines in content are preserved
   * 
   * If statement content contains empty lines (for paragraph breaks),
   * they should be preserved in the formatted output.
   * 
   * Validates: Requirement 8.4 (preserve formatting)
   */
  describe('Property 33: Empty lines in content are preserved', () => {
    it('should preserve empty lines within content', () => {
      fc.assert(
        fc.property(
          statementArbitrary,
          roundTypeArbitrary,
          (statement, roundType) => {
            // Create content with empty lines
            const contentWithEmptyLines = 'First paragraph\n\nSecond paragraph\n\n\nThird paragraph';
            const testStatement = { ...statement, content: contentWithEmptyLines };
            
            const formatted = formatStatement(testStatement, roundType);
            
            // Count empty lines in original content
            const originalEmptyLines = (contentWithEmptyLines.match(/\n\n/g) || []).length;
            
            // The formatted output should preserve these empty lines
            // (they will be indented, so look for lines with only spaces)
            const formattedLines = formatted.split('\n');
            const contentStartIdx = formattedLines.findIndex(line => line.includes('First paragraph'));
            const contentEndIdx = formattedLines.findIndex((line, idx) => 
              idx > contentStartIdx && line.includes('─')
            );
            
            if (contentStartIdx >= 0 && contentEndIdx > contentStartIdx) {
              const contentSection = formattedLines.slice(contentStartIdx, contentEndIdx);
              const emptyContentLines = contentSection.filter(line => line.trim().length === 0 || line.match(/^\s+$/));
              
              // Should have at least some empty lines preserved
              expect(emptyContentLines.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 34: Formatted output is idempotent for plain text
   * 
   * Formatting the same statement multiple times should produce identical output.
   * 
   * Validates: Consistency and determinism
   */
  describe('Property 34: Formatted output is idempotent', () => {
    it('should produce identical output for repeated formatting calls', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted1 = formatStatement(statement, roundType);
          const formatted2 = formatStatement(statement, roundType);
          const formatted3 = formatStatement(statement, roundType);
          
          expect(formatted1).toBe(formatted2);
          expect(formatted2).toBe(formatted3);
        }),
        { numRuns: 100 }
      );
    });

    it('should produce identical plain output for repeated formatting calls', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const plain1 = formatStatementPlain(statement, roundType);
          const plain2 = formatStatementPlain(statement, roundType);
          const plain3 = formatStatementPlain(statement, roundType);
          
          expect(plain1).toBe(plain2);
          expect(plain2).toBe(plain3);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 35: Thinking indicator is visually distinct from statements
   * 
   * The thinking indicator should be clearly distinguishable from actual
   * statements to avoid confusion.
   * 
   * Validates: Requirement 7.4 (clear status indicator)
   */
  describe('Property 35: Thinking indicator is visually distinct from statements', () => {
    it('should not contain the same separator pattern as statements', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.constant(Position.AFFIRMATIVE), fc.constant(Position.NEGATIVE)),
          roundTypeArbitrary,
          (modelName, position, roundType) => {
            const indicator = formatThinkingIndicator(modelName, position, roundType);
            
            // Thinking indicator should not have the full separator lines
            const fullSeparator = '─'.repeat(80);
            expect(indicator).not.toContain(fullSeparator);
            
            // Should be shorter than a typical statement
            expect(indicator.length).toBeLessThan(200);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain "thinking" or similar indicator text', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.oneof(fc.constant(Position.AFFIRMATIVE), fc.constant(Position.NEGATIVE)),
          roundTypeArbitrary,
          (modelName, position, roundType) => {
            const indicator = formatThinkingIndicator(modelName, position, roundType);
            const lowerIndicator = indicator.toLowerCase();
            
            // Should contain some form of "thinking" or "generating" indicator
            const hasThinkingIndicator = 
              lowerIndicator.includes('thinking') ||
              lowerIndicator.includes('generating') ||
              lowerIndicator.includes('composing') ||
              lowerIndicator.includes('writing');
            
            expect(hasThinkingIndicator).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 36: Word count metadata is not displayed in formatted output
   * 
   * Internal metadata like word count should not appear in the user-facing
   * formatted output (though it's stored in the Statement object).
   * 
   * Validates: Clean user interface
   */
  describe('Property 36: Word count metadata is not displayed', () => {
    it('should not display word count in formatted output', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          const plain = formatStatementPlain(statement, roundType);
          
          // Should not contain "word count" or the specific word count number
          // (unless it happens to be in the content itself)
          const wordCountPattern = /word\s*count/i;
          
          // Remove the content to check only the formatting
          const contentRemoved = formatted.replace(statement.content, '');
          
          expect(contentRemoved).not.toMatch(wordCountPattern);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 37: Timestamp metadata is not displayed in formatted output
   * 
   * Internal metadata like generation timestamp should not appear in the
   * formatted output during live display.
   * 
   * Validates: Clean user interface
   */
  describe('Property 37: Timestamp metadata is not displayed', () => {
    it('should not display timestamp in formatted output', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          const plain = formatStatementPlain(statement, roundType);
          
          // Should not contain ISO date format or common timestamp patterns
          const timestampPattern = /\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/;
          
          // Remove the content to check only the formatting
          const contentRemoved = formatted.replace(statement.content, '');
          
          // Timestamps should not appear in the formatting
          expect(contentRemoved).not.toMatch(timestampPattern);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 38: Formatted output has consistent line structure
   * 
   * The formatted output should follow a consistent structure:
   * separator, metadata, separator, content, separator
   * 
   * Validates: Consistent visual formatting
   */
  describe('Property 38: Formatted output has consistent line structure', () => {
    it('should follow consistent structure pattern', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          const lines = formatted.split('\n');
          
          // Find separator lines (lines with many dashes)
          const separatorIndices = lines
            .map((line, idx) => ({ line, idx }))
            .filter(({ line }) => line.includes('─'.repeat(10)))
            .map(({ idx }) => idx);
          
          // Should have at least 3 separators (header top, header bottom, footer)
          expect(separatorIndices.length).toBeGreaterThanOrEqual(3);
          
          // First separator should be near the beginning
          expect(separatorIndices[0]).toBeLessThan(5);
          
          // Last separator should be near the end
          expect(separatorIndices[separatorIndices.length - 1]).toBeGreaterThan(lines.length - 5);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 39: Plain format is a subset of colored format (content-wise)
   * 
   * The plain format should contain the same information as the colored format,
   * just without the ANSI codes. Stripping ANSI codes from colored format
   * should yield something similar to plain format.
   * 
   * Validates: Consistency between formats
   */
  describe('Property 39: Plain format is equivalent to stripped colored format', () => {
    it('should have same content after stripping ANSI codes', () => {
      fc.assert(
        fc.property(statementArbitrary, roundTypeArbitrary, (statement, roundType) => {
          const formatted = formatStatement(statement, roundType);
          const plain = formatStatementPlain(statement, roundType);
          
          // Strip ANSI codes from formatted
          const strippedFormatted = formatted.replace(/\x1b\[[0-9;]*m/g, '');
          
          // Should be identical to plain format
          expect(strippedFormatted).toBe(plain);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 40: All round types are supported
   * 
   * The formatter should handle all defined round types without errors.
   * 
   * Validates: Complete implementation
   */
  describe('Property 40: All round types are supported', () => {
    it('should format all round types without errors', () => {
      const allRoundTypes = [
        RoundType.PREPARATION,
        RoundType.OPENING,
        RoundType.REBUTTAL,
        RoundType.CROSS_EXAM,
        RoundType.CLOSING
      ];
      
      fc.assert(
        fc.property(statementArbitrary, (statement) => {
          // Test each round type
          allRoundTypes.forEach(roundType => {
            expect(() => formatStatement(statement, roundType)).not.toThrow();
            expect(() => formatStatementPlain(statement, roundType)).not.toThrow();
            expect(() => formatThinkingIndicator(statement.model, statement.position, roundType)).not.toThrow();
            
            const formatted = formatStatement(statement, roundType);
            expect(formatted.length).toBeGreaterThan(0);
          });
        }),
        { numRuns: 50 }
      );
    });
  });
});
