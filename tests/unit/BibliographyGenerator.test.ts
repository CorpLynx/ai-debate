import { BibliographyGenerator, CitationStyle, OrganizedCitations } from '../../src/utils/BibliographyGenerator';
import { Citation, CitationType } from '../../src/models/Citation';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';
import { DEFAULT_COLOR_SCHEME, PLAIN_COLOR_SCHEME } from '../../src/models/ColorScheme';

describe('BibliographyGenerator', () => {
  let generator: BibliographyGenerator;

  beforeEach(() => {
    generator = new BibliographyGenerator(PLAIN_COLOR_SCHEME, CitationStyle.SIMPLE, false);
  });

  describe('organizeCitations', () => {
    it('should organize citations by position', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Test citation 1',
          type: CitationType.URL,
          url: 'https://example.com/1',
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '2',
          text: 'Test citation 2',
          type: CitationType.URL,
          url: 'https://example.com/2',
          extractedFrom: {
            model: 'model2',
            position: Position.NEGATIVE,
            round: RoundType.OPENING
          }
        }
      ];

      const organized = generator.organizeCitations(citations);

      expect(organized.affirmative).toHaveLength(1);
      expect(organized.negative).toHaveLength(1);
      expect(organized.shared).toHaveLength(0);
    });

    it('should identify shared citations cited by both positions', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Shared citation',
          type: CitationType.URL,
          url: 'https://example.com/shared',
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '2',
          text: 'Shared citation',
          type: CitationType.URL,
          url: 'https://example.com/shared',
          extractedFrom: {
            model: 'model2',
            position: Position.NEGATIVE,
            round: RoundType.OPENING
          }
        }
      ];

      const organized = generator.organizeCitations(citations);

      expect(organized.shared).toHaveLength(1);
      expect(organized.affirmative).toHaveLength(0);
      expect(organized.negative).toHaveLength(0);
    });

    it('should deduplicate citations within the same position', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Duplicate citation',
          type: CitationType.URL,
          url: 'https://example.com/dup',
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '2',
          text: 'Duplicate citation',
          type: CitationType.URL,
          url: 'https://example.com/dup',
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.REBUTTAL
          }
        }
      ];

      const organized = generator.organizeCitations(citations);

      expect(organized.affirmative).toHaveLength(1);
    });
  });

  describe('formatCitation', () => {
    it('should format a simple URL citation', () => {
      const citation: Citation = {
        id: '1',
        text: 'https://example.com',
        type: CitationType.URL,
        url: 'https://example.com',
        title: 'Example',
        extractedFrom: {
          model: 'model1',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('[1]');
      expect(formatted).toContain('Example');
      expect(formatted).toContain('https://example.com');
    });

    it('should format an academic citation with author and year', () => {
      const citation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        title: 'Test Article',
        extractedFrom: {
          model: 'model1',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('[1]');
      expect(formatted).toContain('Smith');
      expect(formatted).toContain('2020');
      expect(formatted).toContain('Test Article');
    });

    it('should format a book citation', () => {
      const citation: Citation = {
        id: '1',
        text: '"Test Book" by Author (2021)',
        type: CitationType.BOOK,
        title: 'Test Book',
        author: 'Author',
        year: 2021,
        extractedFrom: {
          model: 'model1',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('[1]');
      expect(formatted).toContain('Author');
      expect(formatted).toContain('2021');
      expect(formatted).toContain('Test Book');
    });
  });

  describe('formatHyperlink', () => {
    it('should format URL as plain text when hyperlinks are disabled', () => {
      const url = 'https://example.com';
      const formatted = generator.formatHyperlink(url, url);

      expect(formatted).toContain('https://example.com');
      expect(formatted).not.toContain('\x1b]8;;');
    });

    it('should format URL with OSC 8 escape codes when hyperlinks are enabled', () => {
      const generatorWithLinks = new BibliographyGenerator(PLAIN_COLOR_SCHEME, CitationStyle.SIMPLE, true);
      const url = 'https://example.com';
      const formatted = generatorWithLinks.formatHyperlink(url, 'Example');

      expect(formatted).toContain('\x1b]8;;https://example.com\x1b\\');
      expect(formatted).toContain('Example');
    });
  });

  describe('generateBibliography', () => {
    it('should return empty string for empty citations array', () => {
      const bibliography = generator.generateBibliography([]);

      expect(bibliography).toBe('');
    });

    it('should generate a complete bibliography with all sections', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Affirmative citation',
          type: CitationType.URL,
          url: 'https://example.com/aff',
          title: 'Affirmative Source',
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '2',
          text: 'Negative citation',
          type: CitationType.URL,
          url: 'https://example.com/neg',
          title: 'Negative Source',
          extractedFrom: {
            model: 'model2',
            position: Position.NEGATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '3',
          text: 'Shared citation',
          type: CitationType.URL,
          url: 'https://example.com/shared',
          title: 'Shared Source',
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '4',
          text: 'Shared citation',
          type: CitationType.URL,
          url: 'https://example.com/shared',
          title: 'Shared Source',
          extractedFrom: {
            model: 'model2',
            position: Position.NEGATIVE,
            round: RoundType.REBUTTAL
          }
        }
      ];

      const bibliography = generator.generateBibliography(citations);

      expect(bibliography).toContain('BIBLIOGRAPHY');
      expect(bibliography).toContain('Cited by Both Sides');
      expect(bibliography).toContain('Affirmative Position Sources');
      expect(bibliography).toContain('Negative Position Sources');
      expect(bibliography).toContain('Shared Source');
      expect(bibliography).toContain('Affirmative Source');
      expect(bibliography).toContain('Negative Source');
    });

    it('should only show sections with citations', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Affirmative only',
          type: CitationType.URL,
          url: 'https://example.com/aff',
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        }
      ];

      const bibliography = generator.generateBibliography(citations);

      expect(bibliography).toContain('BIBLIOGRAPHY');
      expect(bibliography).toContain('Affirmative Position Sources');
      expect(bibliography).not.toContain('Negative Position Sources');
      expect(bibliography).not.toContain('Cited by Both Sides');
    });
  });

  describe('citation styles', () => {
    const citation: Citation = {
      id: '1',
      text: 'Smith (2020). "Test Article"',
      type: CitationType.ACADEMIC,
      author: 'Smith',
      year: 2020,
      title: 'Test Article',
      source: 'Journal of Testing',
      url: 'https://example.com/article',
      extractedFrom: {
        model: 'model1',
        position: Position.AFFIRMATIVE,
        round: RoundType.OPENING
      }
    };

    it('should format in APA style', () => {
      generator.setCitationStyle(CitationStyle.APA);
      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('Smith');
      expect(formatted).toContain('(2020)');
      expect(formatted).toContain('Test Article');
      expect(formatted).toContain('Journal of Testing');
    });

    it('should format in MLA style', () => {
      generator.setCitationStyle(CitationStyle.MLA);
      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('Smith');
      expect(formatted).toContain('Test Article');
      expect(formatted).toContain('Journal of Testing');
      expect(formatted).toContain('2020');
    });

    it('should format in Chicago style', () => {
      generator.setCitationStyle(CitationStyle.CHICAGO);
      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('Smith');
      expect(formatted).toContain('"Test Article"');
      expect(formatted).toContain('Journal of Testing');
      expect(formatted).toContain('2020');
    });

    it('should format in simple style', () => {
      generator.setCitationStyle(CitationStyle.SIMPLE);
      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('Smith');
      expect(formatted).toContain('(2020)');
      expect(formatted).toContain('"Test Article"');
    });
  });

  describe('color scheme', () => {
    it('should use provided color scheme for formatting', () => {
      const coloredGenerator = new BibliographyGenerator(DEFAULT_COLOR_SCHEME, CitationStyle.SIMPLE, false);
      const citation: Citation = {
        id: '1',
        text: 'Test',
        type: CitationType.URL,
        url: 'https://example.com',
        extractedFrom: {
          model: 'model1',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const formatted = coloredGenerator.formatCitation(citation, 1);

      // Should contain ANSI color codes
      expect(formatted).toContain('\x1b[');
    });

    it('should allow changing color scheme', () => {
      generator.setColorScheme(DEFAULT_COLOR_SCHEME);
      const citation: Citation = {
        id: '1',
        text: 'Test',
        type: CitationType.URL,
        url: 'https://example.com',
        extractedFrom: {
          model: 'model1',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const formatted = generator.formatCitation(citation, 1);

      expect(formatted).toContain('\x1b[');
    });
  });

  describe('sorting', () => {
    it('should sort citations by author name', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Zebra (2020)',
          type: CitationType.ACADEMIC,
          author: 'Zebra',
          year: 2020,
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '2',
          text: 'Apple (2020)',
          type: CitationType.ACADEMIC,
          author: 'Apple',
          year: 2020,
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        }
      ];

      const organized = generator.organizeCitations(citations);

      expect(organized.affirmative[0].author).toBe('Apple');
      expect(organized.affirmative[1].author).toBe('Zebra');
    });

    it('should sort citations by year (descending) when authors are the same', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Smith (2019)',
          type: CitationType.ACADEMIC,
          author: 'Smith',
          year: 2019,
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '2',
          text: 'Smith (2021)',
          type: CitationType.ACADEMIC,
          author: 'Smith',
          year: 2021,
          extractedFrom: {
            model: 'model1',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        }
      ];

      const organized = generator.organizeCitations(citations);

      expect(organized.affirmative[0].year).toBe(2021);
      expect(organized.affirmative[1].year).toBe(2019);
    });
  });
});
