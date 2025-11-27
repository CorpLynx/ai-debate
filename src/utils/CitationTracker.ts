import { Citation } from '../models/Citation';
import { Position } from '../models/Position';

/**
 * CitationTracker manages the collection and deduplication of citations throughout a debate
 */
export class CitationTracker {
  private citations: Citation[] = [];

  /**
   * Adds a citation to the tracker
   * Automatically deduplicates if the citation already exists
   */
  addCitation(citation: Citation): void {
    if (!this.hasCitation(citation)) {
      this.citations.push(citation);
    }
  }

  /**
   * Adds multiple citations at once
   */
  addCitations(citations: Citation[]): void {
    for (const citation of citations) {
      this.addCitation(citation);
    }
  }

  /**
   * Retrieves all citations for a specific position
   */
  getCitationsByPosition(position: Position): Citation[] {
    return this.citations.filter(
      citation => citation.extractedFrom.position === position
    );
  }

  /**
   * Retrieves all citations for a specific model
   */
  getCitationsByModel(model: string): Citation[] {
    return this.citations.filter(
      citation => citation.extractedFrom.model === model
    );
  }

  /**
   * Retrieves all unique citations
   */
  getAllCitations(): Citation[] {
    return [...this.citations];
  }

  /**
   * Deduplicates citations based on content similarity
   * This method removes duplicate citations that are already tracked
   */
  deduplicateCitations(): void {
    const uniqueCitations: Citation[] = [];
    const seenKeys = new Set<string>();

    for (const citation of this.citations) {
      const key = this.generateSimilarityKey(citation);
      
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueCitations.push(citation);
      }
    }

    this.citations = uniqueCitations;
  }

  /**
   * Checks if a citation already exists in the tracker
   * Uses similarity detection to identify duplicates
   */
  hasCitation(citation: Citation): boolean {
    const key = this.generateSimilarityKey(citation);
    
    return this.citations.some(existing => {
      const existingKey = this.generateSimilarityKey(existing);
      return existingKey === key;
    });
  }

  /**
   * Generates a similarity key for deduplication
   * Citations with the same key are considered duplicates
   */
  private generateSimilarityKey(citation: Citation): string {
    const parts: string[] = [];

    // For URLs, use the normalized URL as the primary key
    if (citation.url) {
      const normalizedUrl = this.normalizeUrl(citation.url);
      parts.push(`url:${normalizedUrl}`);
    }

    // For academic citations, use author + year
    if (citation.author && citation.year) {
      const normalizedAuthor = this.normalizeText(citation.author);
      parts.push(`author:${normalizedAuthor}:year:${citation.year}`);
    }

    // For citations with titles, include the title
    if (citation.title) {
      const normalizedTitle = this.normalizeText(citation.title);
      parts.push(`title:${normalizedTitle}`);
    }

    // If we have specific identifying information, use that
    if (parts.length > 0) {
      return parts.join('|');
    }

    // Fallback to normalized text for general citations
    return `text:${this.normalizeText(citation.text)}`;
  }

  /**
   * Normalizes a URL for comparison
   * Removes trailing slashes, query parameters, and fragments
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Use protocol + hostname + pathname (no query or hash)
      const normalized = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      // Remove trailing slash
      return normalized.replace(/\/$/, '').toLowerCase();
    } catch {
      // If URL parsing fails, just normalize the string
      return url.toLowerCase().trim().replace(/\/$/, '');
    }
  }

  /**
   * Normalizes text for comparison
   * Converts to lowercase, removes extra whitespace, and removes punctuation
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?'"]/g, '');
  }

  /**
   * Clears all citations from the tracker
   */
  clear(): void {
    this.citations = [];
  }

  /**
   * Returns the total number of citations tracked
   */
  getCount(): number {
    return this.citations.length;
  }

  /**
   * Returns the number of citations for a specific position
   */
  getCountByPosition(position: Position): number {
    return this.getCitationsByPosition(position).length;
  }
}
