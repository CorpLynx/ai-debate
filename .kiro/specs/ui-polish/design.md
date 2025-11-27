# Design Document: UI Polish and Formatting Improvements

## Overview

This design enhances the visual presentation and user experience of the AI Debate System's command-line interface. The improvements focus on typography, visual hierarchy, animated feedback, and overall polish to create a more professional and engaging debate experience. The design introduces new formatting utilities, enhanced display components, progress indicators, and a citation extraction system.

## Architecture

The UI polish improvements will be implemented through several new and enhanced components:

1. **Enhanced Formatting Layer**: Upgraded text formatting utilities with support for rich typography, markdown-like rendering, and responsive layout
2. **Progress Display System**: New animated progress bars and status indicators for the preparation phase
3. **Citation Extraction System**: Parser and tracker for identifying and collecting source citations from AI responses
4. **Bibliography Generator**: Component for organizing and displaying collected citations
5. **Responsive Layout Engine**: Terminal-aware formatting that adapts to different terminal sizes
6. **Enhanced Display Utilities**: Upgraded visual components with improved styling and animations

### Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                     CLI Entry Point                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Debate Orchestrator                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Enhanced Streaming Handler                    │  │
│  │  • Progress bars for preparation                      │  │
│  │  • Status phrase cycling                              │  │
│  │  • Citation extraction hooks                          │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           Enhanced Formatting Layer                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Rich Text     │  │  Responsive    │  │  Typography  │  │
│  │  Formatter     │  │  Layout        │  │  Engine      │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Citation & Bibliography System                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Citation      │  │  Citation      │  │  Bibliography│  │
│  │  Extractor     │  │  Tracker       │  │  Generator   │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. RichTextFormatter

Handles advanced text formatting including markdown-like syntax, emphasis, lists, and quotes.

```typescript
interface RichTextFormatter {
  /**
   * Formats text with rich typography including paragraphs, lists, quotes, and emphasis
   */
  formatRichText(text: string, options: FormatOptions): string;
  
  /**
   * Detects and enhances list formatting (numbered and bulleted)
   */
  formatLists(text: string): string;
  
  /**
   * Applies visual distinction to quoted text
   */
  formatQuotes(text: string): string;
  
  /**
   * Renders emphasis markers (bold, italic) as ANSI codes
   */
  renderEmphasis(text: string): string;
  
  /**
   * Formats section headers with visual prominence
   */
  formatHeaders(text: string): string;
  
  /**
   * Applies monospace formatting to code snippets
   */
  formatCodeSnippets(text: string): string;
}

interface FormatOptions {
  terminalWidth: number;
  indentLevel: number;
  preserveFormatting: boolean;
  colorScheme: ColorScheme;
}
```

### 2. ResponsiveLayout

Manages terminal-aware formatting and responsive layout.

```typescript
interface ResponsiveLayout {
  /**
   * Detects current terminal dimensions
   */
  getTerminalSize(): TerminalSize;
  
  /**
   * Wraps text to fit terminal width
   */
  wrapText(text: string, width: number, indent: number): string;
  
  /**
   * Sizes boxes and borders appropriately for terminal
   */
  createResponsiveBox(content: string, title?: string): string;
  
  /**
   * Adjusts formatting based on terminal width
   */
  adaptFormatting(content: string, size: TerminalSize): string;
}

interface TerminalSize {
  width: number;
  height: number;
  isNarrow: boolean;  // < 80 columns
  isWide: boolean;    // > 120 columns
}
```

### 3. ProgressDisplay

Manages animated progress bars and status indicators for the preparation phase.

```typescript
interface ProgressDisplay {
  /**
   * Creates and displays an animated progress bar
   */
  createProgressBar(label: string, position: Position): ProgressBar;
  
  /**
   * Updates progress bar percentage
   */
  updateProgress(bar: ProgressBar, percentage: number): void;
  
  /**
   * Cycles through status phrases
   */
  updateStatusPhrase(bar: ProgressBar, phrase: string): void;
  
  /**
   * Completes and finalizes progress bar
   */
  completeProgress(bar: ProgressBar): void;
  
  /**
   * Manages concurrent progress bars for multiple models
   */
  displayConcurrentProgress(bars: ProgressBar[]): void;
}

interface ProgressBar {
  id: string;
  label: string;
  percentage: number;
  statusPhrase: string;
  position: Position;
  startTime: Date;
}

const STATUS_PHRASES = [
  "Preparing arguments",
  "Researching sources",
  "Analyzing evidence",
  "Formalizing statements",
  "Structuring logic",
  "Reviewing counterarguments"
];
```

### 4. CitationExtractor

Extracts and tracks citations from AI-generated content.

```typescript
interface CitationExtractor {
  /**
   * Extracts citations from a statement
   */
  extractCitations(text: string): Citation[];
  
  /**
   * Identifies common citation patterns (URLs, academic citations, etc.)
   */
  detectCitationPatterns(text: string): CitationPattern[];
  
  /**
   * Normalizes citation format for consistency
   */
  normalizeCitation(citation: Citation): Citation;
}

interface Citation {
  id: string;
  text: string;
  type: CitationType;
  url?: string;
  author?: string;
  title?: string;
  source?: string;
  year?: number;
  extractedFrom: {
    model: string;
    position: Position;
    round: RoundType;
  };
}

enum CitationType {
  URL = 'url',
  ACADEMIC = 'academic',
  BOOK = 'book',
  ARTICLE = 'article',
  GENERAL = 'general'
}

interface CitationPattern {
  pattern: RegExp;
  type: CitationType;
  extractor: (match: RegExpMatchArray) => Partial<Citation>;
}
```

### 5. CitationTracker

Manages the collection and deduplication of citations throughout the debate.

```typescript
interface CitationTracker {
  /**
   * Adds a citation to the tracker
   */
  addCitation(citation: Citation): void;
  
  /**
   * Retrieves all citations for a specific model/position
   */
  getCitationsByPosition(position: Position): Citation[];
  
  /**
   * Retrieves all unique citations
   */
  getAllCitations(): Citation[];
  
  /**
   * Deduplicates citations based on content similarity
   */
  deduplicateCitations(): void;
  
  /**
   * Checks if a citation already exists
   */
  hasCitation(citation: Citation): boolean;
}
```

### 6. BibliographyGenerator

Generates formatted bibliography displays.

```typescript
interface BibliographyGenerator {
  /**
   * Generates a formatted bibliography from tracked citations
   */
  generateBibliography(citations: Citation[]): string;
  
  /**
   * Organizes citations by position and model
   */
  organizeCitations(citations: Citation[]): OrganizedCitations;
  
  /**
   * Formats a single citation entry
   */
  formatCitation(citation: Citation, index: number): string;
  
  /**
   * Creates clickable hyperlinks for URLs in supported terminals
   */
  formatHyperlink(url: string, text: string): string;
}

interface OrganizedCitations {
  affirmative: Citation[];
  negative: Citation[];
  shared: Citation[];  // Cited by both sides
}
```

### 7. EnhancedStatementFormatter

Upgraded version of the existing StatementFormatter with rich text support.

```typescript
interface EnhancedStatementFormatter {
  /**
   * Formats a statement with rich typography and visual hierarchy
   */
  formatStatement(statement: Statement, roundType: RoundType, options: FormatOptions): string;
  
  /**
   * Creates visually prominent round headers
   */
  formatRoundHeader(roundType: RoundType, roundNumber: number, totalRounds: number): string;
  
  /**
   * Formats metadata distinctly from content
   */
  formatMetadata(statement: Statement, roundType: RoundType): string;
  
  /**
   * Applies position-specific color coding
   */
  applyPositionColors(text: string, position: Position): string;
  
  /**
   * Creates visual separators between statements
   */
  createStatementSeparator(): string;
}
```

## Data Models

### ColorScheme

Defines the consistent color palette for the interface.

```typescript
interface ColorScheme {
  // Position colors
  affirmative: string;      // Cyan (#00BCD4)
  negative: string;         // Magenta (#E91E63)
  
  // Semantic colors
  success: string;          // Green (#4CAF50)
  warning: string;          // Yellow (#FFC107)
  error: string;            // Red (#F44336)
  info: string;             // Blue (#2196F3)
  
  // UI colors
  primary: string;          // Bright white
  secondary: string;        // Light gray
  muted: string;            // Dark gray
  accent: string;           // Gold (#FFD700)
  
  // Emphasis colors
  bold: string;             // Bright white + bold
  italic: string;           // Light gray + italic
  code: string;             // Green monospace
  quote: string;            // Cyan + dim
  
  // Background colors (for boxes)
  boxBorder: string;        // Cyan
  boxBackground: string;    // Default terminal background
}
```

### FormattingRules

Defines consistent formatting rules across the interface.

```typescript
interface FormattingRules {
  // Spacing
  paragraphSpacing: number;      // Lines between paragraphs
  sectionSpacing: number;        // Lines between sections
  statementSpacing: number;      // Lines between statements
  
  // Indentation
  baseIndent: number;            // Base indentation level
  quoteIndent: number;           // Additional indent for quotes
  listIndent: number;            // Indent for list items
  
  // Line wrapping
  maxLineLength: number;         // Maximum line length
  wrapIndent: number;            // Indent for wrapped lines
  
  // Visual elements
  separatorChar: string;         // Character for separators
  bulletChar: string;            // Character for bullet lists
  progressBarChar: string;       // Character for progress bars
  
  // Box drawing
  boxStyle: BoxStyle;            // Style for boxes (single, double, rounded)
}

enum BoxStyle {
  SINGLE = 'single',
  DOUBLE = 'double',
  ROUNDED = 'rounded',
  HEAVY = 'heavy'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Paragraph formatting consistency
*For any* AI-generated statement, formatting the text should add consistent paragraph breaks and visual spacing according to the defined formatting rules.
**Validates: Requirements 1.1**

### Property 2: Section distinction
*For any* statement containing multiple arguments or sections, the formatted output should visually distinguish between sections using spacing or styling.
**Validates: Requirements 1.2**

### Property 3: Line wrapping within bounds
*For any* statement and terminal width, the formatted output should not contain lines exceeding the terminal width minus margins.
**Validates: Requirements 1.3**

### Property 4: List formatting preservation
*For any* statement containing lists (numbered or bulleted), the formatted output should preserve the list structure and enhance its visual presentation.
**Validates: Requirements 1.4**

### Property 5: Consistent indentation
*For any* statement, the formatted output should apply consistent indentation levels as defined in the formatting rules.
**Validates: Requirements 1.5**

### Property 6: Round header presence
*For any* debate round, the display should include a visually prominent header with decorative elements before the round content.
**Validates: Requirements 2.1**

### Property 7: Metadata styling distinction
*For any* formatted statement, the metadata (model name, position, round type) should use different ANSI styling than the content text.
**Validates: Requirements 2.2**

### Property 8: Statement separator insertion
*For any* sequence of two or more statements, the formatted output should include visual separators between each pair of consecutive statements.
**Validates: Requirements 2.3**

### Property 9: Position color consistency
*For any* set of displays showing the same position, all should use the same color code from the color scheme.
**Validates: Requirements 2.4**

### Property 10: Round progress format
*For any* round progress display, the output should include both the current round number and total rounds in a clear format.
**Validates: Requirements 2.5**

### Property 11: Streaming indicator presence
*For any* streaming content display, an indicator showing which model is speaking should be present in the output.
**Validates: Requirements 3.2**

### Property 12: Completion indicator with timing
*For any* completed generation, the display should include a completion indicator with timing information.
**Validates: Requirements 3.3**

### Property 13: Concurrent activity distinction
*For any* scenario with multiple models preparing simultaneously, each model's activity should be visually distinguished from the others.
**Validates: Requirements 3.4**

### Property 14: Progress indicator on delay
*For any* generation exceeding a threshold duration, progress indicators should be displayed.
**Validates: Requirements 3.5**

### Property 15: Transcript section headers
*For any* final transcript display, the output should include clear section headers for each round.
**Validates: Requirements 4.1**

### Property 16: Export decorative elements
*For any* text format export, the output should include decorative borders and spacing.
**Validates: Requirements 4.2**

### Property 17: Summary table format
*For any* debate summary statistics display, the output should use a table or box format.
**Validates: Requirements 4.3**

### Property 18: Timestamp format consistency
*For any* set of timestamp displays, all should use the same human-readable format.
**Validates: Requirements 4.4**

### Property 19: Metric visual emphasis
*For any* metric display (word count, duration, etc.), the output should include visual emphasis.
**Validates: Requirements 4.5**

### Property 20: Quote visual distinction
*For any* response containing quoted text, the formatted output should visually distinguish quotes through indentation or styling.
**Validates: Requirements 5.1**

### Property 21: Emphasis rendering
*For any* response containing emphasis markers (bold, italic), the formatted output should render them using appropriate ANSI codes.
**Validates: Requirements 5.2**

### Property 22: List alignment enhancement
*For any* response containing numbered or bulleted lists, the formatted output should enhance alignment and spacing.
**Validates: Requirements 5.3**

### Property 23: Header visual prominence
*For any* response containing section headers, the formatted output should render them with visual prominence (color, weight, or spacing).
**Validates: Requirements 5.4**

### Property 24: Code monospace formatting
*For any* response containing code snippets or technical terms, the formatted output should apply monospace formatting.
**Validates: Requirements 5.5**

### Property 25: Configuration format consistency
*For any* configuration option display, the formatting should be consistent with other configuration displays.
**Validates: Requirements 6.2**

### Property 26: Setup progress indicator
*For any* setup step, a visual progress indicator showing current step and total steps should be displayed.
**Validates: Requirements 6.4**

### Property 27: Confirmation checkmarks
*For any* selection confirmation, the display should include checkmark symbols.
**Validates: Requirements 6.5**

### Property 28: Error format distinction
*For any* error display, the formatting should be visually distinct and include appropriate icons.
**Validates: Requirements 7.1**

### Property 29: Warning vs error styling
*For any* warning and error pair, the warning should have different visual styling than the error.
**Validates: Requirements 7.2**

### Property 30: Stack trace readability
*For any* error with context (stack trace, details), the formatted output should present it in a readable manner.
**Validates: Requirements 7.3**

### Property 31: Error grouping
*For any* set of multiple errors or warnings, the display should group and organize them clearly.
**Validates: Requirements 7.4**

### Property 32: Recovery suggestion highlighting
*For any* error with recovery suggestions, the suggestions should be highlighted prominently.
**Validates: Requirements 7.5**

### Property 33: Concurrent stream labeling
*For any* concurrent streaming from multiple models, each stream should be clearly labeled and separated.
**Validates: Requirements 8.2**

### Property 34: Stream completion indicator
*For any* completed stream, a visual indicator should be added to the output.
**Validates: Requirements 8.3**

### Property 35: Interruption feedback
*For any* interrupted stream, clear visual feedback should be displayed.
**Validates: Requirements 8.4**

### Property 36: Preparation format distinction
*For any* preparation material display, the formatting should be distinct from debate statement formatting.
**Validates: Requirements 8.5**

### Property 37: Color palette consistency
*For any* interface element, the colors used should come from the defined color scheme.
**Validates: Requirements 9.1**

### Property 38: Affirmative color consistency
*For any* set of affirmative position displays, all should use the same color from the color scheme.
**Validates: Requirements 9.2**

### Property 39: Negative color consistency
*For any* set of negative position displays, all should use the same color from the color scheme.
**Validates: Requirements 9.3**

### Property 40: Metadata muted colors
*For any* metadata or secondary information display, the colors should be from the muted range of the color scheme.
**Validates: Requirements 9.4**

### Property 41: Interactive element highlighting
*For any* interactive element display, the highlighting should be visually distinct from surrounding content.
**Validates: Requirements 9.5**

### Property 42: Terminal width adaptation
*For any* terminal width and content, the formatted output should adjust line wrapping and formatting to fit the width.
**Validates: Requirements 10.1**

### Property 43: Box sizing adaptation
*For any* box or border display and terminal width, the box should be sized appropriately for the width.
**Validates: Requirements 10.2**

### Property 44: Narrow terminal degradation
*For any* narrow terminal (< 80 columns), the formatting should gracefully degrade while maintaining readability.
**Validates: Requirements 10.3**

### Property 45: Wide terminal line limits
*For any* wide terminal (> 120 columns), formatted lines should not exceed a reasonable maximum length.
**Validates: Requirements 10.4**

### Property 46: Progress bar with percentage
*For any* preparation phase, an animated progress bar showing completion percentage should be displayed.
**Validates: Requirements 11.1**

### Property 47: Status phrase cycling
*For any* preparation in progress, the display should cycle through descriptive status phrases.
**Validates: Requirements 11.2**

### Property 48: Concurrent progress bars
*For any* scenario with both models preparing simultaneously, separate progress bars should be displayed for each.
**Validates: Requirements 11.3**

### Property 49: Progress completion at 100%
*For any* completed preparation, the progress bar should show 100% before transitioning.
**Validates: Requirements 11.4**

### Property 50: Progress replaces raw output
*For any* preparation with hidden output mode, the progress display should replace the raw preparation output.
**Validates: Requirements 11.5**

### Property 51: Bibliography display on completion
*For any* completed debate, a bibliography section should be displayed listing all cited sources.
**Validates: Requirements 12.1**

### Property 52: Citation extraction
*For any* statement containing source citations, the citations should be extracted and recorded.
**Validates: Requirements 12.2**

### Property 53: Bibliography organization
*For any* bibliography display, sources should be organized by model and position.
**Validates: Requirements 12.3**

### Property 54: Citation deduplication
*For any* bibliography with multiple citations of the same source, the source should appear only once.
**Validates: Requirements 12.4**

### Property 55: URL hyperlink formatting
*For any* citation containing a URL, the URL should be formatted with hyperlink escape codes for supported terminals.
**Validates: Requirements 12.5**

## Error Handling

### Formatting Errors

- **Invalid ANSI codes**: Gracefully fall back to plain text if ANSI codes are not supported
- **Terminal size detection failure**: Use default width (80 columns) if detection fails
- **Malformed markdown**: Render as plain text rather than failing

### Citation Extraction Errors

- **Ambiguous citations**: Record the raw text and mark as requiring manual review
- **Malformed URLs**: Attempt to extract and validate, fall back to plain text if invalid
- **Missing citation metadata**: Store partial citation with available information

### Progress Display Errors

- **Animation failures**: Fall back to static progress indicators
- **Concurrent display conflicts**: Queue updates to avoid terminal corruption
- **Timing calculation errors**: Use elapsed time as fallback

## Testing Strategy

### Unit Testing

Unit tests will verify specific formatting behaviors and edge cases:

- Empty statement formatting
- Single-line vs multi-line statements
- Statements with special characters
- Citation extraction from various formats
- Progress bar state transitions
- Color code generation
- Terminal width edge cases (very narrow, very wide)
- Bibliography deduplication logic

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript/TypeScript property testing library). Each property test will run a minimum of 100 iterations.

Tests will be tagged with comments referencing the design document properties:
```typescript
// Feature: ui-polish, Property 1: Paragraph formatting consistency
```

Key property tests:
- Text formatting preserves content while adding styling
- Line wrapping never exceeds terminal width
- Color consistency across all displays of the same position
- Citation extraction is idempotent
- Progress percentages are always between 0-100
- Bibliography deduplication is consistent
- Responsive layout adapts correctly to all terminal sizes

### Integration Testing

Integration tests will verify end-to-end formatting flows:
- Complete debate formatting from initialization to bibliography
- Concurrent progress bar display during preparation
- Citation tracking throughout all debate rounds
- Terminal resize handling during active debate
- Export formatting for different output formats

## Implementation Notes

### Performance Considerations

- Cache terminal size detection to avoid repeated system calls
- Use string builders for complex formatting to minimize allocations
- Debounce progress bar updates to avoid excessive terminal writes
- Lazy-load citation patterns to reduce startup time

### Accessibility

- Provide option to disable colors for accessibility
- Ensure formatting works with screen readers
- Support high-contrast mode
- Allow customization of color scheme for color blindness

### Terminal Compatibility

- Detect terminal capabilities (ANSI support, hyperlinks, etc.)
- Gracefully degrade features for limited terminals
- Test on common terminals (iTerm2, Terminal.app, Windows Terminal, etc.)
- Provide plain text fallback for all visual enhancements

### Configuration

Add new configuration options:
```typescript
interface UIConfig {
  enableRichFormatting: boolean;      // Enable/disable rich text features
  enableAnimations: boolean;          // Enable/disable animations
  enableColors: boolean;              // Enable/disable colors
  colorScheme: 'default' | 'high-contrast' | 'custom';
  terminalWidth?: number;             // Override auto-detection
  showPreparationProgress: boolean;   // Show progress bars vs raw output
  enableHyperlinks: boolean;          // Enable clickable links
}
```
