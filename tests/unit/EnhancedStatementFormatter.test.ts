import { formatStatement, formatStatementPlain, createStatementSeparator } from '../../src/utils/StatementFormatter';
import { Statement } from '../../src/models/Statement';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

describe('Enhanced StatementFormatter', () => {
  const mockStatement: Statement = {
    model: 'GPT-4',
    position: Position.AFFIRMATIVE,
    content: 'This is a **bold** statement with *emphasis*.\n\n> This is a quote\n\n- Item 1\n- Item 2',
    wordCount: 15,
    generatedAt: new Date('2024-01-01T12:00:00Z')
  };

  describe('formatStatement with round progress', () => {
    it('should include round progress when provided', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING, 2, 5);
      
      // Should contain round progress
      expect(formatted).toContain('Round 2/5');
      expect(formatted).toContain('Opening Statement');
    });

    it('should work without round progress', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING);
      
      // Should not contain round progress
      expect(formatted).not.toContain('Round');
      expect(formatted).toContain('Opening Statement');
    });

    it('should include word count in metadata', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING);
      
      // Should contain word count
      expect(formatted).toContain('Words:');
      expect(formatted).toContain('15');
    });

    it('should use decorative header with box characters', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING);
      
      // Should contain box drawing characters for header
      expect(formatted).toMatch(/[╔╗╚╝═║]/);
    });

    it('should format rich text content', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING);
      
      // Should contain the content (may have ANSI codes for formatting)
      expect(formatted).toContain('bold');
      expect(formatted).toContain('emphasis');
      expect(formatted).toContain('quote');
      expect(formatted).toContain('Item 1');
    });
  });

  describe('formatStatementPlain with round progress', () => {
    it('should include round progress in plain format', () => {
      const formatted = formatStatementPlain(mockStatement, RoundType.REBUTTAL, 3, 5);
      
      // Should contain round progress
      expect(formatted).toContain('Round 3/5');
      expect(formatted).toContain('Rebuttal');
    });

    it('should not contain ANSI codes', () => {
      const formatted = formatStatementPlain(mockStatement, RoundType.OPENING, 1, 5);
      
      // Should not contain ANSI escape codes
      expect(formatted).not.toContain('\x1b[');
    });

    it('should include word count in plain format', () => {
      const formatted = formatStatementPlain(mockStatement, RoundType.OPENING);
      
      // Should contain word count
      expect(formatted).toContain('Words:');
      expect(formatted).toContain('15');
    });
  });

  describe('createStatementSeparator', () => {
    it('should create a visual separator', () => {
      const separator = createStatementSeparator();
      
      // Should contain separator characters
      expect(separator).toContain('═');
      
      // Should have blank lines for spacing
      expect(separator.split('\n').length).toBeGreaterThan(1);
    });

    it('should be non-empty', () => {
      const separator = createStatementSeparator();
      
      expect(separator.length).toBeGreaterThan(0);
    });
  });

  describe('Position color consistency', () => {
    it('should use consistent colors for affirmative position', () => {
      const statement1 = { ...mockStatement, position: Position.AFFIRMATIVE };
      const statement2 = { ...mockStatement, position: Position.AFFIRMATIVE };
      
      const formatted1 = formatStatement(statement1, RoundType.OPENING);
      const formatted2 = formatStatement(statement2, RoundType.REBUTTAL);
      
      // Both should contain cyan color code (affirmative)
      const cyanCode = '\x1b[36m';
      expect(formatted1).toContain(cyanCode);
      expect(formatted2).toContain(cyanCode);
    });

    it('should use consistent colors for negative position', () => {
      const statement1 = { ...mockStatement, position: Position.NEGATIVE };
      const statement2 = { ...mockStatement, position: Position.NEGATIVE };
      
      const formatted1 = formatStatement(statement1, RoundType.OPENING);
      const formatted2 = formatStatement(statement2, RoundType.CLOSING);
      
      // Both should contain magenta color code (negative)
      const magentaCode = '\x1b[35m';
      expect(formatted1).toContain(magentaCode);
      expect(formatted2).toContain(magentaCode);
    });
  });

  describe('Metadata styling', () => {
    it('should style metadata distinctly from content', () => {
      const formatted = formatStatement(mockStatement, RoundType.OPENING);
      
      // Should contain metadata labels
      expect(formatted).toContain('Model:');
      expect(formatted).toContain('Position:');
      expect(formatted).toContain('Words:');
      
      // Should contain the model name
      expect(formatted).toContain('GPT-4');
    });
  });

  describe('Consistent indentation', () => {
    it('should apply consistent indentation to content', () => {
      const multiLineStatement: Statement = {
        ...mockStatement,
        content: 'Line 1\nLine 2\nLine 3'
      };
      
      const formatted = formatStatement(multiLineStatement, RoundType.OPENING);
      
      // Content should be present
      expect(formatted).toContain('Line 1');
      expect(formatted).toContain('Line 2');
      expect(formatted).toContain('Line 3');
    });
  });
});
