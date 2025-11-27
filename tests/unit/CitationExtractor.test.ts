import { CitationExtractor } from '../../src/utils/CitationExtractor';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';
import { CitationType } from '../../src/models/Citation';

describe('CitationExtractor', () => {
  let extractor: CitationExtractor;

  beforeEach(() => {
    extractor = new CitationExtractor();
  });

  describe('URL extraction', () => {
    it('should extract HTTP URLs', () => {
      const text = 'According to http://example.com/article, this is true.';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe(CitationType.URL);
      expect(citations[0].url).toBe('http://example.com/article');
    });

    it('should extract HTTPS URLs', () => {
      const text = 'See https://www.example.com/research for details.';
      const citations = extractor.extractCitations(
        text,
        'claude-3',
        Position.NEGATIVE,
        RoundType.REBUTTAL
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe(CitationType.URL);
      expect(citations[0].url).toBe('https://www.example.com/research');
    });

    it('should extract multiple URLs from text', () => {
      const text = 'Sources: https://example.com/one and http://test.org/two';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(2);
      expect(citations[0].url).toBe('https://example.com/one');
      expect(citations[1].url).toBe('http://test.org/two');
    });
  });

  describe('Academic citation extraction', () => {
    it('should extract author-year citations', () => {
      const text = 'As shown by Smith (2020), this is significant.';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe(CitationType.ACADEMIC);
      expect(citations[0].author).toBe('Smith');
      expect(citations[0].year).toBe(2020);
    });

    it('should extract citations with et al.', () => {
      const text = 'Research by Johnson et al. (2019) demonstrates this.';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].author).toBe('Johnson et al.');
      expect(citations[0].year).toBe(2019);
    });

    it('should extract citations with title and source', () => {
      const text = 'Smith (2020). "The Impact of AI". Journal of Technology.';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].author).toBe('Smith');
      expect(citations[0].year).toBe(2020);
      expect(citations[0].title).toBe('The Impact of AI');
      expect(citations[0].source).toBe('Journal of Technology');
    });
  });

  describe('Book citation extraction', () => {
    it('should extract book citations with title and author', () => {
      const text = 'As discussed in "Artificial Intelligence" by Russell (2010).';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe(CitationType.BOOK);
      expect(citations[0].title).toBe('Artificial Intelligence');
      expect(citations[0].author).toBe('Russell');
      expect(citations[0].year).toBe(2010);
    });
  });

  describe('Article citation extraction', () => {
    it('should extract article citations', () => {
      const text = 'See "Machine Learning Advances", Nature, 2021 for more.';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe(CitationType.ARTICLE);
      expect(citations[0].title).toBe('Machine Learning Advances');
      expect(citations[0].source).toBe('Nature');
      expect(citations[0].year).toBe(2021);
    });
  });

  describe('DOI extraction', () => {
    it('should extract DOI citations', () => {
      const text = 'Published as doi: 10.1234/example.2020.001';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
      expect(citations[0].type).toBe(CitationType.ACADEMIC);
      expect(citations[0].url).toBe('https://doi.org/10.1234/example.2020.001');
    });
  });

  describe('Citation normalization', () => {
    it('should normalize author names', () => {
      const citation = extractor.normalizeCitation({
        id: '123',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: '  Smith  ',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      });

      expect(citation.author).toBe('Smith');
    });

    it('should remove quotes from titles', () => {
      const citation = extractor.normalizeCitation({
        id: '123',
        text: '"Test Title"',
        type: CitationType.BOOK,
        title: '"Test Title"',
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      });

      expect(citation.title).toBe('Test Title');
    });

    it('should remove trailing punctuation from URLs', () => {
      const citation = extractor.normalizeCitation({
        id: '123',
        text: 'http://example.com.',
        type: CitationType.URL,
        url: 'http://example.com.',
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      });

      expect(citation.url).toBe('http://example.com');
    });
  });

  describe('Citation detection', () => {
    it('should detect if text has citations', () => {
      const textWithCitation = 'According to Smith (2020), this is true.';
      const textWithoutCitation = 'This is just plain text.';

      expect(extractor.hasCitations(textWithCitation)).toBe(true);
      expect(extractor.hasCitations(textWithoutCitation)).toBe(false);
    });

    it('should detect citation patterns', () => {
      const text = 'Smith (2020) and https://example.com';
      const patterns = extractor.detectCitationPatterns(text);

      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('Deduplication', () => {
    it('should not extract duplicate citations from same text', () => {
      const text = 'Smith (2020) said this. Later, Smith (2020) confirmed it.';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations).toHaveLength(1);
    });
  });

  describe('Metadata tracking', () => {
    it('should track extraction metadata', () => {
      const text = 'According to https://example.com';
      const citations = extractor.extractCitations(
        text,
        'claude-3',
        Position.NEGATIVE,
        RoundType.CLOSING
      );

      expect(citations[0].extractedFrom.model).toBe('claude-3');
      expect(citations[0].extractedFrom.position).toBe(Position.NEGATIVE);
      expect(citations[0].extractedFrom.round).toBe(RoundType.CLOSING);
    });

    it('should generate unique IDs for citations', () => {
      const text = 'https://example.com and https://test.org';
      const citations = extractor.extractCitations(
        text,
        'gpt-4',
        Position.AFFIRMATIVE,
        RoundType.OPENING
      );

      expect(citations[0].id).toBeDefined();
      expect(citations[1].id).toBeDefined();
      expect(citations[0].id).not.toBe(citations[1].id);
    });
  });
});
