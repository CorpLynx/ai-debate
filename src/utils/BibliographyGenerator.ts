import { Citation, CitationType } from '../models/Citation';
import { Position } from '../models/Position';
import { ColorScheme, DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../models/ColorScheme';

/**
 * Interface for organized citations by position
 */
export interface OrganizedCitations {
  affirmative: Citation[];
  negative: Citation[];
  shared: Citation[];  // Cited by both sides
}

/**
 * Citation style options
 */
export enum CitationStyle {
  APA = 'apa',
  MLA = 'mla',
  CHICAGO = 'chicago',
  SIMPLE = 'simple'
}

/**
 * BibliographyGenerator creates formatted bibliography displays from tracked citations
 */
export class BibliographyGenerator {
  private colorScheme: ColorScheme;
  private citationStyle: CitationStyle;
  private enableHyperlinks: boolean;

  constructor(
    colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME,
    citationStyle: CitationStyle = CitationStyle.SIMPLE,
    enableHyperlinks: boolean = true
  ) {
    this.colorScheme = colorScheme;
    this.citationStyle = citationStyle;
    this.enableHyperlinks = enableHyperlinks;
  }

  /**
   * Generates a formatted bibliography from tracked citations
   */
  generateBibliography(citations: Citation[]): string {
    if (citations.length === 0) {
      return '';
    }

    const organized = this.organizeCitations(citations);
    const sections: string[] = [];

    // Header
    sections.push(this.formatHeader());
    sections.push('');

    // Shared citations (cited by both sides)
    if (organized.shared.length > 0) {
      sections.push(this.formatSectionHeader('Cited by Both Sides'));
      sections.push('');
      organized.shared.forEach((citation, index) => {
        sections.push(this.formatCitation(citation, index + 1));
      });
      sections.push('');
    }

    // Affirmative citations
    if (organized.affirmative.length > 0) {
      sections.push(this.formatSectionHeader('Affirmative Position Sources'));
      sections.push('');
      organized.affirmative.forEach((citation, index) => {
        sections.push(this.formatCitation(citation, index + 1));
      });
      sections.push('');
    }

    // Negative citations
    if (organized.negative.length > 0) {
      sections.push(this.formatSectionHeader('Negative Position Sources'));
      sections.push('');
      organized.negative.forEach((citation, index) => {
        sections.push(this.formatCitation(citation, index + 1));
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Organizes citations by position and model
   */
  organizeCitations(citations: Citation[]): OrganizedCitations {
    const affirmativeSet = new Set<string>();
    const negativeSet = new Set<string>();
    const citationMap = new Map<string, Citation>();

    // First pass: categorize citations and track which positions cite them
    for (const citation of citations) {
      const key = this.generateCitationKey(citation);
      
      if (!citationMap.has(key)) {
        citationMap.set(key, citation);
      }

      if (citation.extractedFrom.position === Position.AFFIRMATIVE) {
        affirmativeSet.add(key);
      } else if (citation.extractedFrom.position === Position.NEGATIVE) {
        negativeSet.add(key);
      }
    }

    // Second pass: organize into shared, affirmative-only, and negative-only
    const shared: Citation[] = [];
    const affirmativeOnly: Citation[] = [];
    const negativeOnly: Citation[] = [];

    for (const [key, citation] of citationMap.entries()) {
      const inAffirmative = affirmativeSet.has(key);
      const inNegative = negativeSet.has(key);

      if (inAffirmative && inNegative) {
        shared.push(citation);
      } else if (inAffirmative) {
        affirmativeOnly.push(citation);
      } else if (inNegative) {
        negativeOnly.push(citation);
      }
    }

    // Sort citations within each category
    const sortFn = (a: Citation, b: Citation) => this.compareCitations(a, b);
    shared.sort(sortFn);
    affirmativeOnly.sort(sortFn);
    negativeOnly.sort(sortFn);

    return {
      affirmative: affirmativeOnly,
      negative: negativeOnly,
      shared
    };
  }

  /**
   * Formats a single citation entry
   */
  formatCitation(citation: Citation, index: number): string {
    const prefix = `${this.colorScheme.muted}[${index}]${ANSI_RESET} `;
    
    let formatted = '';
    
    switch (this.citationStyle) {
      case CitationStyle.APA:
        formatted = this.formatAPA(citation);
        break;
      case CitationStyle.MLA:
        formatted = this.formatMLA(citation);
        break;
      case CitationStyle.CHICAGO:
        formatted = this.formatChicago(citation);
        break;
      case CitationStyle.SIMPLE:
      default:
        formatted = this.formatSimple(citation);
        break;
    }

    return `${prefix}${formatted}`;
  }

  /**
   * Formats citation in APA style
   */
  private formatAPA(citation: Citation): string {
    const parts: string[] = [];

    if (citation.author) {
      parts.push(`${this.colorScheme.primary}${citation.author}${ANSI_RESET}`);
    }

    if (citation.year) {
      parts.push(`(${citation.year})`);
    }

    if (citation.title) {
      parts.push(`${this.colorScheme.italic}${citation.title}${ANSI_RESET}`);
    }

    if (citation.source) {
      parts.push(citation.source);
    }

    if (citation.url) {
      const urlFormatted = this.formatHyperlink(citation.url, citation.url);
      parts.push(urlFormatted);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Formats citation in MLA style
   */
  private formatMLA(citation: Citation): string {
    const parts: string[] = [];

    if (citation.author) {
      parts.push(`${this.colorScheme.primary}${citation.author}${ANSI_RESET}`);
    }

    if (citation.title) {
      parts.push(`"${this.colorScheme.italic}${citation.title}${ANSI_RESET}"`);
    }

    if (citation.source) {
      parts.push(`${this.colorScheme.italic}${citation.source}${ANSI_RESET}`);
    }

    if (citation.year) {
      parts.push(`${citation.year}`);
    }

    if (citation.url) {
      const urlFormatted = this.formatHyperlink(citation.url, citation.url);
      parts.push(urlFormatted);
    }

    return parts.join(', ') + '.';
  }

  /**
   * Formats citation in Chicago style
   */
  private formatChicago(citation: Citation): string {
    const parts: string[] = [];

    if (citation.author) {
      parts.push(`${this.colorScheme.primary}${citation.author}${ANSI_RESET}`);
    }

    if (citation.title) {
      if (citation.type === CitationType.BOOK) {
        parts.push(`${this.colorScheme.italic}${citation.title}${ANSI_RESET}`);
      } else {
        parts.push(`"${citation.title}"`);
      }
    }

    if (citation.source) {
      parts.push(`${this.colorScheme.italic}${citation.source}${ANSI_RESET}`);
    }

    if (citation.year) {
      parts.push(`${citation.year}`);
    }

    if (citation.url) {
      const urlFormatted = this.formatHyperlink(citation.url, citation.url);
      parts.push(urlFormatted);
    }

    return parts.join('. ') + '.';
  }

  /**
   * Formats citation in simple style
   */
  private formatSimple(citation: Citation): string {
    const parts: string[] = [];

    // For URLs, show a clean format
    if (citation.type === CitationType.URL && citation.url) {
      if (citation.title && citation.title !== citation.url) {
        parts.push(`${this.colorScheme.primary}${citation.title}${ANSI_RESET}`);
      }
      const urlFormatted = this.formatHyperlink(citation.url, citation.url);
      parts.push(urlFormatted);
    } else {
      // For other citation types, show author, title, source, year
      if (citation.author) {
        parts.push(`${this.colorScheme.primary}${citation.author}${ANSI_RESET}`);
      }

      if (citation.year) {
        parts.push(`(${citation.year})`);
      }

      if (citation.title) {
        parts.push(`"${citation.title}"`);
      }

      if (citation.source) {
        parts.push(`${this.colorScheme.italic}${citation.source}${ANSI_RESET}`);
      }

      if (citation.url) {
        const urlFormatted = this.formatHyperlink(citation.url, citation.url);
        parts.push(urlFormatted);
      }
    }

    // If we have no structured data, fall back to the raw text
    if (parts.length === 0) {
      return citation.text;
    }

    return parts.join(' ');
  }

  /**
   * Creates clickable hyperlinks for URLs in supported terminals
   * Uses OSC 8 hyperlink escape sequence
   */
  formatHyperlink(url: string, text: string): string {
    if (!this.enableHyperlinks) {
      return `${this.colorScheme.info}${url}${ANSI_RESET}`;
    }

    // OSC 8 hyperlink format: \x1b]8;;URL\x1b\\TEXT\x1b]8;;\x1b\\
    const hyperlink = `\x1b]8;;${url}\x1b\\${this.colorScheme.info}${text}${ANSI_RESET}\x1b]8;;\x1b\\`;
    return hyperlink;
  }

  /**
   * Formats the bibliography header
   */
  private formatHeader(): string {
    const border = '═'.repeat(60);
    return `${this.colorScheme.boxBorder}${border}${ANSI_RESET}\n` +
           `${this.colorScheme.bold}                      BIBLIOGRAPHY${ANSI_RESET}\n` +
           `${this.colorScheme.boxBorder}${border}${ANSI_RESET}`;
  }

  /**
   * Formats a section header
   */
  private formatSectionHeader(title: string): string {
    return `${this.colorScheme.accent}${title}${ANSI_RESET}`;
  }

  /**
   * Generates a unique key for a citation for deduplication
   */
  private generateCitationKey(citation: Citation): string {
    const parts: string[] = [];

    if (citation.url) {
      parts.push(`url:${this.normalizeUrl(citation.url)}`);
    }

    if (citation.author && citation.year) {
      parts.push(`author:${this.normalizeText(citation.author)}:year:${citation.year}`);
    }

    if (citation.title) {
      parts.push(`title:${this.normalizeText(citation.title)}`);
    }

    if (parts.length > 0) {
      return parts.join('|');
    }

    return `text:${this.normalizeText(citation.text)}`;
  }

  /**
   * Normalizes a URL for comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const normalized = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      return normalized.replace(/\/$/, '').toLowerCase();
    } catch {
      return url.toLowerCase().trim().replace(/\/$/, '');
    }
  }

  /**
   * Normalizes text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?'"]/g, '');
  }

  /**
   * Compares two citations for sorting
   * Sorts by: author (if present), then year (if present), then title, then text
   */
  private compareCitations(a: Citation, b: Citation): number {
    // Sort by author first
    if (a.author && b.author) {
      const authorCompare = a.author.localeCompare(b.author);
      if (authorCompare !== 0) return authorCompare;
    } else if (a.author) {
      return -1;
    } else if (b.author) {
      return 1;
    }

    // Then by year (descending - newer first)
    if (a.year && b.year) {
      if (a.year !== b.year) return b.year - a.year;
    } else if (a.year) {
      return -1;
    } else if (b.year) {
      return 1;
    }

    // Then by title
    if (a.title && b.title) {
      const titleCompare = a.title.localeCompare(b.title);
      if (titleCompare !== 0) return titleCompare;
    } else if (a.title) {
      return -1;
    } else if (b.title) {
      return 1;
    }

    // Finally by text
    return a.text.localeCompare(b.text);
  }

  /**
   * Sets the color scheme for formatting
   */
  setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
  }

  /**
   * Sets the citation style
   */
  setCitationStyle(style: CitationStyle): void {
    this.citationStyle = style;
  }

  /**
   * Enables or disables hyperlink formatting
   */
  setEnableHyperlinks(enable: boolean): void {
    this.enableHyperlinks = enable;
  }
}
