import { BibliographyGenerator, CitationStyle } from '../src/utils/BibliographyGenerator';
import { Citation, CitationType } from '../src/models/Citation';
import { Position } from '../src/models/Position';
import { RoundType } from '../src/models/RoundType';
import { DEFAULT_COLOR_SCHEME } from '../src/models/ColorScheme';

/**
 * Demonstration of the BibliographyGenerator component
 */

// Create sample citations
const citations: Citation[] = [
  // Shared citation (cited by both sides)
  {
    id: '1',
    text: 'Smith (2020). "Climate Change Effects"',
    type: CitationType.ACADEMIC,
    author: 'Smith',
    year: 2020,
    title: 'Climate Change Effects',
    source: 'Nature',
    url: 'https://nature.com/articles/climate-2020',
    extractedFrom: {
      model: 'gpt-4',
      position: Position.AFFIRMATIVE,
      round: RoundType.OPENING
    }
  },
  {
    id: '2',
    text: 'Smith (2020). "Climate Change Effects"',
    type: CitationType.ACADEMIC,
    author: 'Smith',
    year: 2020,
    title: 'Climate Change Effects',
    source: 'Nature',
    url: 'https://nature.com/articles/climate-2020',
    extractedFrom: {
      model: 'claude-3',
      position: Position.NEGATIVE,
      round: RoundType.REBUTTAL
    }
  },
  // Affirmative-only citation
  {
    id: '3',
    text: 'https://ipcc.ch/report/ar6',
    type: CitationType.URL,
    url: 'https://ipcc.ch/report/ar6',
    title: 'IPCC Sixth Assessment Report',
    extractedFrom: {
      model: 'gpt-4',
      position: Position.AFFIRMATIVE,
      round: RoundType.OPENING
    }
  },
  {
    id: '4',
    text: 'Johnson & Lee (2021). "Renewable Energy Solutions"',
    type: CitationType.ACADEMIC,
    author: 'Johnson & Lee',
    year: 2021,
    title: 'Renewable Energy Solutions',
    source: 'Energy Policy Journal',
    extractedFrom: {
      model: 'gpt-4',
      position: Position.AFFIRMATIVE,
      round: RoundType.REBUTTAL
    }
  },
  // Negative-only citation
  {
    id: '5',
    text: 'Brown (2019). "Economic Considerations"',
    type: CitationType.ACADEMIC,
    author: 'Brown',
    year: 2019,
    title: 'Economic Considerations',
    source: 'Economics Review',
    extractedFrom: {
      model: 'claude-3',
      position: Position.NEGATIVE,
      round: RoundType.OPENING
    }
  },
  {
    id: '6',
    text: '"The Cost of Change" by Davis (2022)',
    type: CitationType.BOOK,
    title: 'The Cost of Change',
    author: 'Davis',
    year: 2022,
    extractedFrom: {
      model: 'claude-3',
      position: Position.NEGATIVE,
      round: RoundType.CLOSING
    }
  }
];

console.log('='.repeat(80));
console.log('BIBLIOGRAPHY GENERATOR DEMONSTRATION');
console.log('='.repeat(80));
console.log();

// Demo 1: Simple style with colors
console.log('Demo 1: Simple Style with Colors');
console.log('-'.repeat(80));
const generator1 = new BibliographyGenerator(DEFAULT_COLOR_SCHEME, CitationStyle.SIMPLE, true);
const bibliography1 = generator1.generateBibliography(citations);
console.log(bibliography1);
console.log();

// Demo 2: APA style
console.log('Demo 2: APA Style');
console.log('-'.repeat(80));
const generator2 = new BibliographyGenerator(DEFAULT_COLOR_SCHEME, CitationStyle.APA, false);
const bibliography2 = generator2.generateBibliography(citations);
console.log(bibliography2);
console.log();

// Demo 3: MLA style
console.log('Demo 3: MLA Style');
console.log('-'.repeat(80));
const generator3 = new BibliographyGenerator(DEFAULT_COLOR_SCHEME, CitationStyle.MLA, false);
const bibliography3 = generator3.generateBibliography(citations);
console.log(bibliography3);
console.log();

// Demo 4: Chicago style
console.log('Demo 4: Chicago Style');
console.log('-'.repeat(80));
const generator4 = new BibliographyGenerator(DEFAULT_COLOR_SCHEME, CitationStyle.CHICAGO, false);
const bibliography4 = generator4.generateBibliography(citations);
console.log(bibliography4);
console.log();

// Demo 5: Organization breakdown
console.log('Demo 5: Citation Organization Breakdown');
console.log('-'.repeat(80));
const organized = generator1.organizeCitations(citations);
console.log(`Shared citations: ${organized.shared.length}`);
console.log(`Affirmative-only citations: ${organized.affirmative.length}`);
console.log(`Negative-only citations: ${organized.negative.length}`);
console.log(`Total unique citations: ${organized.shared.length + organized.affirmative.length + organized.negative.length}`);
