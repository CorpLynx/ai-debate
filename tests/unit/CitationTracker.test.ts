import { CitationTracker } from '../../src/utils/CitationTracker';
import { Citation, CitationType } from '../../src/models/Citation';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

describe('CitationTracker', () => {
  let tracker: CitationTracker;

  beforeEach(() => {
    tracker = new CitationTracker();
  });

  describe('addCitation', () => {
    it('should add a citation to the tracker', () => {
      const citation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      tracker.addCitation(citation);
      expect(tracker.getCount()).toBe(1);
      expect(tracker.getAllCitations()).toContainEqual(citation);
    });

    it('should not add duplicate citations', () => {
      const citation1: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      tracker.addCitation(citation2);
      
      expect(tracker.getCount()).toBe(1);
    });

    it('should detect duplicate URLs with different text', () => {
      const citation1: Citation = {
        id: '1',
        text: 'https://example.com/article',
        type: CitationType.URL,
        url: 'https://example.com/article',
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'See https://example.com/article/',
        type: CitationType.URL,
        url: 'https://example.com/article/',
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      tracker.addCitation(citation2);
      
      expect(tracker.getCount()).toBe(1);
    });
  });

  describe('addCitations', () => {
    it('should add multiple citations at once', () => {
      const citations: Citation[] = [
        {
          id: '1',
          text: 'Smith (2020)',
          type: CitationType.ACADEMIC,
          author: 'Smith',
          year: 2020,
          extractedFrom: {
            model: 'gpt-4',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        },
        {
          id: '2',
          text: 'Jones (2021)',
          type: CitationType.ACADEMIC,
          author: 'Jones',
          year: 2021,
          extractedFrom: {
            model: 'gpt-4',
            position: Position.AFFIRMATIVE,
            round: RoundType.OPENING
          }
        }
      ];

      tracker.addCitations(citations);
      expect(tracker.getCount()).toBe(2);
    });
  });

  describe('getCitationsByPosition', () => {
    it('should retrieve citations for affirmative position', () => {
      const affirmativeCitation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const negativeCitation: Citation = {
        id: '2',
        text: 'Jones (2021)',
        type: CitationType.ACADEMIC,
        author: 'Jones',
        year: 2021,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.OPENING
        }
      };

      tracker.addCitation(affirmativeCitation);
      tracker.addCitation(negativeCitation);

      const affirmativeCitations = tracker.getCitationsByPosition(Position.AFFIRMATIVE);
      expect(affirmativeCitations).toHaveLength(1);
      expect(affirmativeCitations[0]).toEqual(affirmativeCitation);
    });

    it('should retrieve citations for negative position', () => {
      const affirmativeCitation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const negativeCitation: Citation = {
        id: '2',
        text: 'Jones (2021)',
        type: CitationType.ACADEMIC,
        author: 'Jones',
        year: 2021,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.OPENING
        }
      };

      tracker.addCitation(affirmativeCitation);
      tracker.addCitation(negativeCitation);

      const negativeCitations = tracker.getCitationsByPosition(Position.NEGATIVE);
      expect(negativeCitations).toHaveLength(1);
      expect(negativeCitations[0]).toEqual(negativeCitation);
    });
  });

  describe('getCitationsByModel', () => {
    it('should retrieve citations for a specific model', () => {
      const gpt4Citation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const claudeCitation: Citation = {
        id: '2',
        text: 'Jones (2021)',
        type: CitationType.ACADEMIC,
        author: 'Jones',
        year: 2021,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.OPENING
        }
      };

      tracker.addCitation(gpt4Citation);
      tracker.addCitation(claudeCitation);

      const gpt4Citations = tracker.getCitationsByModel('gpt-4');
      expect(gpt4Citations).toHaveLength(1);
      expect(gpt4Citations[0]).toEqual(gpt4Citation);
    });
  });

  describe('deduplicateCitations', () => {
    it('should remove duplicate citations based on similarity', () => {
      const citation1: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      // Manually add to bypass automatic deduplication
      tracker['citations'].push(citation1);
      tracker['citations'].push(citation2);

      expect(tracker.getCount()).toBe(2);
      
      tracker.deduplicateCitations();
      
      expect(tracker.getCount()).toBe(1);
    });

    it('should keep citations with different content', () => {
      const citation1: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'Jones (2021)',
        type: CitationType.ACADEMIC,
        author: 'Jones',
        year: 2021,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      tracker.addCitation(citation2);

      tracker.deduplicateCitations();
      
      expect(tracker.getCount()).toBe(2);
    });
  });

  describe('hasCitation', () => {
    it('should return true for existing citation', () => {
      const citation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      tracker.addCitation(citation);
      expect(tracker.hasCitation(citation)).toBe(true);
    });

    it('should return true for similar citation with different ID', () => {
      const citation1: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      expect(tracker.hasCitation(citation2)).toBe(true);
    });

    it('should return false for non-existing citation', () => {
      const citation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      expect(tracker.hasCitation(citation)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all citations', () => {
      const citation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      tracker.addCitation(citation);
      expect(tracker.getCount()).toBe(1);

      tracker.clear();
      expect(tracker.getCount()).toBe(0);
    });
  });

  describe('getCountByPosition', () => {
    it('should return count for specific position', () => {
      const affirmativeCitation: Citation = {
        id: '1',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const negativeCitation: Citation = {
        id: '2',
        text: 'Jones (2021)',
        type: CitationType.ACADEMIC,
        author: 'Jones',
        year: 2021,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.OPENING
        }
      };

      tracker.addCitation(affirmativeCitation);
      tracker.addCitation(negativeCitation);

      expect(tracker.getCountByPosition(Position.AFFIRMATIVE)).toBe(1);
      expect(tracker.getCountByPosition(Position.NEGATIVE)).toBe(1);
    });
  });

  describe('URL normalization', () => {
    it('should treat URLs with and without trailing slashes as duplicates', () => {
      const citation1: Citation = {
        id: '1',
        text: 'https://example.com/article',
        type: CitationType.URL,
        url: 'https://example.com/article',
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'https://example.com/article/',
        type: CitationType.URL,
        url: 'https://example.com/article/',
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      expect(tracker.hasCitation(citation2)).toBe(true);
    });

    it('should ignore query parameters and fragments in URL comparison', () => {
      const citation1: Citation = {
        id: '1',
        text: 'https://example.com/article',
        type: CitationType.URL,
        url: 'https://example.com/article',
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'https://example.com/article?ref=twitter#section1',
        type: CitationType.URL,
        url: 'https://example.com/article?ref=twitter#section1',
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      expect(tracker.hasCitation(citation2)).toBe(true);
    });
  });

  describe('text normalization', () => {
    it('should treat citations with different punctuation as duplicates', () => {
      const citation1: Citation = {
        id: '1',
        text: 'Smith (2020).',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'Smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'Smith',
        year: 2020,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      expect(tracker.hasCitation(citation2)).toBe(true);
    });

    it('should treat citations with different casing as duplicates', () => {
      const citation1: Citation = {
        id: '1',
        text: 'SMITH (2020)',
        type: CitationType.ACADEMIC,
        author: 'SMITH',
        year: 2020,
        extractedFrom: {
          model: 'gpt-4',
          position: Position.AFFIRMATIVE,
          round: RoundType.OPENING
        }
      };

      const citation2: Citation = {
        id: '2',
        text: 'smith (2020)',
        type: CitationType.ACADEMIC,
        author: 'smith',
        year: 2020,
        extractedFrom: {
          model: 'claude',
          position: Position.NEGATIVE,
          round: RoundType.REBUTTAL
        }
      };

      tracker.addCitation(citation1);
      expect(tracker.hasCitation(citation2)).toBe(true);
    });
  });
});
