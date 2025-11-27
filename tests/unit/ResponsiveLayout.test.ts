import { ResponsiveLayout, wrapText, createBox } from '../../src/utils/ResponsiveLayout';
import { DEFAULT_COLOR_SCHEME } from '../../src/models/ColorScheme';
import { BoxStyle } from '../../src/models/FormattingRules';

describe('ResponsiveLayout', () => {
  let layout: ResponsiveLayout;

  beforeEach(() => {
    layout = new ResponsiveLayout(DEFAULT_COLOR_SCHEME);
  });

  describe('wrapText', () => {
    it('should wrap text to specified width', () => {
      const text = 'This is a long line of text that should be wrapped to fit within the specified width';
      const wrapped = layout.wrapText(text, 40, 0);
      
      const lines = wrapped.split('\n');
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(40);
      }
    });

    it('should preserve newlines in text', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const wrapped = layout.wrapText(text, 80, 0);
      
      expect(wrapped).toContain('Line 1');
      expect(wrapped).toContain('Line 2');
      expect(wrapped).toContain('Line 3');
    });

    it('should apply indentation to all lines', () => {
      const text = 'This is a long line of text that should be wrapped';
      const indent = 4;
      const wrapped = layout.wrapText(text, 40, indent);
      
      const lines = wrapped.split('\n');
      for (const line of lines) {
        if (line.trim().length > 0) {
          expect(line.startsWith('    ')).toBe(true);
        }
      }
    });

    it('should handle empty text', () => {
      const wrapped = layout.wrapText('', 80, 0);
      expect(wrapped).toBe('');
    });

    it('should handle text shorter than width', () => {
      const text = 'Short text';
      const wrapped = layout.wrapText(text, 80, 0);
      expect(wrapped).toBe(text);
    });
  });

  describe('createResponsiveBox', () => {
    it('should create a box with content', () => {
      const content = 'Test content';
      const box = layout.createResponsiveBox(content, { style: BoxStyle.ROUNDED });
      
      expect(box).toContain('Test content');
      expect(box).toContain('╭'); // Top left corner (rounded)
      expect(box).toContain('╮'); // Top right corner (rounded)
      expect(box).toContain('╰'); // Bottom left corner (rounded)
      expect(box).toContain('╯'); // Bottom right corner (rounded)
    });

    it('should create a box with title', () => {
      const content = 'Test content';
      const title = 'Test Title';
      const box = layout.createResponsiveBox(content, { title });
      
      expect(box).toContain(title);
      expect(box).toContain('Test content');
    });

    it('should respect box style', () => {
      const content = 'Test content';
      const box = layout.createResponsiveBox(content, { style: BoxStyle.DOUBLE });
      
      expect(box).toContain('╔'); // Double line top left
      expect(box).toContain('╗'); // Double line top right
    });

    it('should wrap content to fit box width', () => {
      const content = 'This is a very long line of text that should be wrapped to fit within the box';
      const box = layout.createResponsiveBox(content, { width: 40 });
      
      const lines = box.split('\n');
      for (const line of lines) {
        // Remove ANSI codes for length check
        const stripped = line.replace(/\x1b\[[0-9;]*m/g, '');
        expect(stripped.length).toBeLessThanOrEqual(40);
      }
    });
  });

  describe('adaptFormatting', () => {
    it('should adapt content based on terminal size', () => {
      const content = 'This is some content that needs to be adapted to the terminal size';
      const adapted = layout.adaptFormatting(content);
      
      expect(adapted).toBeTruthy();
      expect(adapted.length).toBeGreaterThan(0);
    });

    it('should handle empty content', () => {
      const adapted = layout.adaptFormatting('');
      expect(adapted).toBe('');
    });
  });

  describe('getTerminalSize', () => {
    it('should return terminal size information', () => {
      const size = layout.getTerminalSize();
      
      expect(size).toHaveProperty('width');
      expect(size).toHaveProperty('height');
      expect(size).toHaveProperty('isNarrow');
      expect(size).toHaveProperty('isWide');
      expect(typeof size.width).toBe('number');
      expect(typeof size.height).toBe('number');
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
    });
  });

  describe('convenience functions', () => {
    it('wrapText should work as standalone function', () => {
      const text = 'This is a test';
      const wrapped = wrapText(text, 80, 0);
      expect(wrapped).toBe(text);
    });

    it('createBox should work as standalone function', () => {
      const content = 'Test';
      const box = createBox(content, { style: BoxStyle.ROUNDED });
      expect(box).toContain('Test');
      expect(box).toContain('╭'); // Rounded corner
    });
  });
});
