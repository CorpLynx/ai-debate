import { Citation, CitationType, CitationPattern } from '../models/Citation';
import { Position } from '../models/Position';
import { RoundType } from '../models/RoundType';
import { randomUUID } from 'crypto';

export class CitationExtractor {
  private patterns: CitationPattern[];

  constructor() {
    this.patterns = this.initializePatterns();
  }

  /**
   * Initializes citation detection patterns
   * Patterns are ordered from most specific to least specific to avoid overlapping matches
   */
  private initializePatterns(): CitationPattern[] {
    return [
      // URL pattern - matches http(s) URLs
      {
        pattern: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi,
        type: CitationType.URL,
        extractor: (match: RegExpMatchArray) => ({
          url: match[0],
          text: match[0],
          title: this.extractTitleFromUrl(match[0])
        })
      },
      // DOI pattern
      {
        pattern: /(?:doi:|DOI:)\s*(10\.\d{4,}\/[^\s]+)/gi,
        type: CitationType.ACADEMIC,
        extractor: (match: RegExpMatchArray) => ({
          url: `https://doi.org/${match[1]}`,
          text: match[0]
        })
      },
      // Academic citation with title - Author (Year). "Title" (most specific, check first)
      {
        pattern: /([A-Z][a-z]+(?:\s+(?:et\s+al\.|&|and)\s+[A-Z][a-z]+)?)\s*\((\d{4})\)\.\s*[""]([^""]+)[""](?:\.\s*([^.]+))?/g,
        type: CitationType.ACADEMIC,
        extractor: (match: RegExpMatchArray) => ({
          author: match[1],
          year: parseInt(match[2], 10),
          title: match[3],
          source: match[4]?.trim(),
          text: match[0]
        })
      },
      // Book citation - "Title" by Author (Year)
      {
        pattern: /[""]([^""]+)[""](?:\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*))?\s*\((\d{4})\)/g,
        type: CitationType.BOOK,
        extractor: (match: RegExpMatchArray) => ({
          title: match[1],
          author: match[2],
          year: parseInt(match[3], 10),
          text: match[0]
        })
      },
      // Article citation - "Title", Source, Year
      {
        pattern: /[""]([^""]+)[""],\s*([^,]+),\s*(\d{4})/g,
        type: CitationType.ARTICLE,
        extractor: (match: RegExpMatchArray) => ({
          title: match[1],
          source: match[2].trim(),
          year: parseInt(match[3], 10),
          text: match[0]
        })
      },
      // Academic citation pattern - Author (Year) - check last to avoid conflicts
      // Updated to handle "et al." properly
      {
        pattern: /([A-Z][a-z]+(?:\s+et\s+al\.|\s+(?:&|and)\s+[A-Z][a-z]+)?)\s*\((\d{4})\)(?!\.\s*[""])/g,
        type: CitationType.ACADEMIC,
        extractor: (match: RegExpMatchArray) => ({
          author: match[1],
          year: parseInt(match[2], 10),
          text: match[0]
        })
      }
    ];
  }

  /**
   * Extracts a readable title from a URL
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      const path = urlObj.pathname.split('/').filter(p => p.length > 0);
      
      if (path.length > 0) {
        const lastSegment = path[path.length - 1];
        // Remove file extensions and convert hyphens/underscores to spaces
        const title = lastSegment
          .replace(/\.[^.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        return title || domain;
      }
      
      return domain;
    } catch {
      return url;
    }
  }

  /**
   * Extracts citations from a statement
   */
  extractCitations(
    text: string,
    model: string,
    position: Position,
    round: RoundType
  ): Citation[] {
    const citations: Citation[] = [];
    const seenTexts = new Set<string>();
    const matchedRanges: Array<{ start: number; end: number }> = [];

    for (const pattern of this.patterns) {
      // Reset lastIndex for global regex
      pattern.pattern.lastIndex = 0;
      
      let match: RegExpMatchArray | null;
      while ((match = pattern.pattern.exec(text)) !== null) {
        const normalizedText = match[0].trim();
        
        // Skip if match.index is undefined
        if (match.index === undefined) {
          continue;
        }
        
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        
        // Skip if we've already extracted this exact citation
        if (seenTexts.has(normalizedText)) {
          continue;
        }
        
        // Skip if this match overlaps with a previously matched range
        const overlaps = matchedRanges.some(range => 
          (matchStart >= range.start && matchStart < range.end) ||
          (matchEnd > range.start && matchEnd <= range.end) ||
          (matchStart <= range.start && matchEnd >= range.end)
        );
        
        if (overlaps) {
          continue;
        }
        
        seenTexts.add(normalizedText);
        matchedRanges.push({ start: matchStart, end: matchEnd });
        
        const partialCitation = pattern.extractor(match);
        const citation: Citation = {
          id: randomUUID(),
          text: normalizedText,
          type: pattern.type,
          ...partialCitation,
          extractedFrom: {
            model,
            position,
            round
          }
        };
        
        citations.push(this.normalizeCitation(citation));
      }
    }

    return citations;
  }

  /**
   * Identifies common citation patterns in text
   */
  detectCitationPatterns(text: string): CitationPattern[] {
    const detectedPatterns: CitationPattern[] = [];
    
    for (const pattern of this.patterns) {
      pattern.pattern.lastIndex = 0;
      if (pattern.pattern.test(text)) {
        detectedPatterns.push(pattern);
      }
      pattern.pattern.lastIndex = 0;
    }
    
    return detectedPatterns;
  }

  /**
   * Normalizes citation format for consistency
   */
  normalizeCitation(citation: Citation): Citation {
    const normalized = { ...citation };
    
    // Normalize author names
    if (normalized.author) {
      normalized.author = normalized.author.trim();
    }
    
    // Normalize title
    if (normalized.title) {
      normalized.title = normalized.title.trim();
      // Remove surrounding quotes if present
      normalized.title = normalized.title.replace(/^[""]|[""]$/g, '');
    }
    
    // Normalize source
    if (normalized.source) {
      normalized.source = normalized.source.trim();
    }
    
    // Normalize URL
    if (normalized.url) {
      normalized.url = normalized.url.trim();
      // Ensure URL doesn't end with punctuation that's not part of the URL
      normalized.url = normalized.url.replace(/[.,;:!?]+$/, '');
    }
    
    // Ensure text is trimmed
    normalized.text = normalized.text.trim();
    
    return normalized;
  }

  /**
   * Validates if a string contains potential citations
   */
  hasCitations(text: string): boolean {
    return this.patterns.some(pattern => {
      pattern.pattern.lastIndex = 0;
      const result = pattern.pattern.test(text);
      pattern.pattern.lastIndex = 0;
      return result;
    });
  }
}
