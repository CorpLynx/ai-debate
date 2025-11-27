import { RichTextFormatter, formatRichText } from '../../src/utils/RichTextFormatter';
import { DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../../src/models/ColorScheme';
import { DEFAULT_FORMATTING_RULES } from '../../src/models/FormattingRules';

describe('RichTextFormatter', () => {
  let formatter: RichTextFormatter;

  beforeEach(() => {
    formatter = new RichTextFormatter();
  });

  describe('Header Formatting', () => {
    it('should format level 1 headers with bold', () => {
      const input = '# Main Header';
      const result = formatter.formatHeader(input);
      expect(result).toContain('Main Header');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.bold);
      expect(result).toContain(ANSI_RESET);
    });

    it('should format level 2 headers with accent color', () => {
      const input = '## Sub Header';
      const result = formatter.formatHeader(input);
      expect(result).toContain('Sub Header');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.accent);
      expect(result).toContain(ANSI_RESET);
    });

    it('should format level 3 headers with primary color', () => {
      const input = '### Section Header';
      const result = formatter.formatHeader(input);
      expect(result).toContain('Section Header');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.primary);
      expect(result).toContain(ANSI_RESET);
    });

    it('should handle headers with multiple levels', () => {
      const input = '#### Fourth Level';
      const result = formatter.formatHeader(input);
      expect(result).toContain('Fourth Level');
    });
  });

  describe('List Formatting', () => {
    it('should format bulleted lists with bullet character', () => {
      const input = '- First item';
      const result = formatter.formatLists(input);
      expect(result).toContain('First item');
      expect(result).toContain(DEFAULT_FORMATTING_RULES.bulletChar);
    });

    it('should format numbered lists', () => {
      const input = '1. First item';
      const result = formatter.formatLists(input);
      expect(result).toContain('First item');
      expect(result).toContain('1.');
    });

    it('should format multiple list items', () => {
      const input = '- Item 1\n- Item 2\n- Item 3';
      const result = formatter.formatLists(input);
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
      expect(result).toContain('Item 3');
    });

    it('should format asterisk-based lists', () => {
      const input = '* Item with asterisk';
      const result = formatter.formatLists(input);
      expect(result).toContain('Item with asterisk');
    });
  });

  describe('Quote Formatting', () => {
    it('should format quotes with indentation and styling', () => {
      const input = '> This is a quote';
      const result = formatter.formatQuotes(input);
      expect(result).toContain('This is a quote');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.quote);
      expect(result).toContain(ANSI_RESET);
    });

    it('should format multiple quote lines', () => {
      const input = '> First line\n> Second line';
      const result = formatter.formatQuotes(input);
      expect(result).toContain('First line');
      expect(result).toContain('Second line');
    });
  });

  describe('Emphasis Rendering', () => {
    it('should render bold text with ** markers', () => {
      const input = 'This is **bold** text';
      const result = formatter.renderEmphasis(input);
      expect(result).toContain('bold');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.bold);
    });

    it('should render bold text with __ markers', () => {
      const input = 'This is __bold__ text';
      const result = formatter.renderEmphasis(input);
      expect(result).toContain('bold');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.bold);
    });

    it('should render italic text with * markers', () => {
      const input = 'This is *italic* text';
      const result = formatter.renderEmphasis(input);
      expect(result).toContain('italic');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.italic);
    });

    it('should render italic text with _ markers', () => {
      const input = 'This is _italic_ text';
      const result = formatter.renderEmphasis(input);
      expect(result).toContain('italic');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.italic);
    });

    it('should handle multiple emphasis types in one line', () => {
      const input = 'This has **bold** and *italic* text';
      const result = formatter.renderEmphasis(input);
      expect(result).toContain('bold');
      expect(result).toContain('italic');
    });
  });

  describe('Code Snippet Formatting', () => {
    it('should format inline code with backticks', () => {
      const input = 'Use `console.log()` to print';
      const result = formatter.formatCodeSnippets(input);
      expect(result).toContain('console.log()');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.code);
    });

    it('should format code blocks', () => {
      const input = '```\nconst x = 1;\nconsole.log(x);\n```';
      const result = formatter.formatCodeSnippets(input);
      expect(result).toContain('const x = 1;');
      expect(result).toContain('console.log(x);');
      expect(result).toContain(DEFAULT_COLOR_SCHEME.code);
    });

    it('should handle multiple inline code snippets', () => {
      const input = 'Use `foo()` and `bar()` functions';
      const result = formatter.formatCodeSnippets(input);
      expect(result).toContain('foo()');
      expect(result).toContain('bar()');
    });
  });

  describe('Rich Text Formatting', () => {
    it('should format text with multiple elements', () => {
      const input = '# Header\n\nThis is a paragraph.\n\n- List item 1\n- List item 2';
      const result = formatter.formatRichText(input);
      expect(result).toContain('Header');
      expect(result).toContain('This is a paragraph');
      expect(result).toContain('List item 1');
      expect(result).toContain('List item 2');
    });

    it('should handle empty lines as paragraph breaks', () => {
      const input = 'First paragraph\n\nSecond paragraph';
      const result = formatter.formatRichText(input);
      expect(result).toContain('First paragraph');
      expect(result).toContain('Second paragraph');
    });

    it('should format quotes within rich text', () => {
      const input = 'Regular text\n\n> A quote\n\nMore text';
      const result = formatter.formatRichText(input);
      expect(result).toContain('Regular text');
      expect(result).toContain('A quote');
      expect(result).toContain('More text');
    });

    it('should apply inline formatting within rich text', () => {
      const input = 'This has **bold** and `code` elements';
      const result = formatter.formatRichText(input);
      expect(result).toContain('bold');
      expect(result).toContain('code');
    });
  });

  describe('Convenience Functions', () => {
    it('should provide formatRichText convenience function', () => {
      const input = '# Test\n\nParagraph text';
      const result = formatRichText(input);
      expect(result).toContain('Test');
      expect(result).toContain('Paragraph text');
    });
  });

  describe('Configuration', () => {
    it('should allow updating color scheme', () => {
      const customScheme = { ...DEFAULT_COLOR_SCHEME, bold: '\x1b[91m' };
      formatter.setColorScheme(customScheme);
      
      const input = '**bold text**';
      const result = formatter.renderEmphasis(input);
      expect(result).toContain('\x1b[91m');
    });

    it('should allow updating formatting rules', () => {
      const customRules = { ...DEFAULT_FORMATTING_RULES, bulletChar: '→' };
      formatter.setFormattingRules(customRules);
      
      const input = '- Item';
      const result = formatter.formatLists(input);
      expect(result).toContain('→');
    });
  });
});
