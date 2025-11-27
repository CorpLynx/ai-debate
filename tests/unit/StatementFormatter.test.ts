import { formatStatement, formatStatementPlain, formatThinkingIndicator } from '../../src/utils/StatementFormatter';
import { Statement } from '../../src/models/Statement';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

describe('StatementFormatter', () => {
  const mockStatement: Statement = {
    model: 'GPT-4',
    position: Position.AFFIRMATIVE,
    content: 'This is a test statement.\nIt has multiple lines.',
    wordCount: 8,
    generatedAt: new Date('2024-01-01T12:00:00Z')
  };

  describe('formatStatement', () => {
    it('should format a statement with all required metadata', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING);
      
      // Check that all required metadata is present
      expect(formatted).toContain('GPT-4');
      expect(formatted).toContain('Affirmative');
      expect(formatted).toContain('Opening Statement');
      expect(formatted).toContain('This is a test statement.');
    });

    it('should format statements for different round types', () => {
      const roundTypes = [
        RoundType.PREPARATION,
        RoundType.OPENING,
        RoundType.REBUTTAL,
        RoundType.CROSS_EXAM,
        RoundType.CLOSING
      ];

      roundTypes.forEach(roundType => {
        const formatted = formatStatement(mockStatement, roundType);
        expect(formatted).toBeTruthy();
        expect(formatted).toContain(mockStatement.model);
        // Check that content lines are present (they may be indented)
        expect(formatted).toContain('This is a test statement.');
        expect(formatted).toContain('It has multiple lines.');
      });
    });

    it('should format negative position statements', () => {
      const negativeStatement: Statement = {
        ...mockStatement,
        position: Position.NEGATIVE
      };

      const formatted = formatStatement(negativeStatement, RoundType.REBUTTAL);
      expect(formatted).toContain('Negative');
      expect(formatted).toContain('Rebuttal');
    });

    it('should include separators for visual formatting', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING);
      // Check for separator characters
      expect(formatted).toContain('─');
    });
  });

  describe('formatStatementPlain', () => {
    it('should format a statement without ANSI color codes', () => {
      const formatted = formatStatementPlain(mockStatement, RoundType.OPENING);
      
      // Should not contain ANSI escape codes
      expect(formatted).not.toContain('\x1b[');
      
      // Should still contain all metadata
      expect(formatted).toContain('GPT-4');
      expect(formatted).toContain('Affirmative');
      expect(formatted).toContain('Opening Statement');
      expect(formatted).toContain('This is a test statement.');
    });
  });

  describe('formatThinkingIndicator', () => {
    it('should create a thinking indicator with model and position', () => {
      const indicator = formatThinkingIndicator('Claude', Position.NEGATIVE, RoundType.REBUTTAL);
      
      expect(indicator).toContain('Claude');
      expect(indicator).toContain('Negative');
      expect(indicator).toContain('thinking');
    });

    it('should include round type in thinking indicator', () => {
      const indicator = formatThinkingIndicator('GPT-4', Position.AFFIRMATIVE, RoundType.CLOSING);
      
      expect(indicator).toContain('Closing Statement');
    });
  });
});
