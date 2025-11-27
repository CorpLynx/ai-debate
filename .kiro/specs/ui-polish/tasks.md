# Implementation Plan

- [x] 1. Set up core formatting infras tructure
  - Create ColorScheme and FormattingRules data models
  - Implement terminal size detection utility
  - Set up configuration for UI options
  - _Requirements: 9.1, 10.1, 10.5_

- [ ]* 1.1 Write property test for color scheme consistency
  - **Property 37: Color palette consistency**
  - **Validates: Requirements 9.1**

- [ ]* 1.2 Write property test for terminal size detection
  - **Property 42: Terminal width adaptation**
  - **Validates: Requirements 10.1**

- [x] 2. Implement ResponsiveLayout component
  - Create TerminalSize interface and detection logic
  - Implement text wrapping with configurable width
  - Create responsive box sizing logic
  - Add graceful degradation for narrow terminals
  - Add line length limits for wide terminals
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 2.1 Write property test for line wrapping bounds
  - **Property 3: Line wrapping within bounds**
  - **Validates: Requirements 1.3**

- [ ]* 2.2 Write property test for box sizing adaptation
  - **Property 43: Box sizing adaptation**
  - **Validates: Requirements 10.2**

- [ ]* 2.3 Write property test for narrow terminal degradation
  - **Property 44: Narrow terminal degradation**
  - **Validates: Requirements 10.3**

- [ ]* 2.4 Write property test for wide terminal line limits
  - **Property 45: Wide terminal line limits**
  - **Validates: Requirements 10.4**

- [x] 3. Implement RichTextFormatter component
  - Create markdown-like parser for emphasis, headers, lists
  - Implement quote detection and formatting
  - Add code snippet detection and monospace formatting
  - Implement list enhancement (numbered and bulleted)
  - Add paragraph break detection and spacing
  - Create section distinction logic
  - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 3.1 Write property test for paragraph formatting
  - **Property 1: Paragraph formatting consistency**
  - **Validates: Requirements 1.1**

- [ ]* 3.2 Write property test for section distinction
  - **Property 2: Section distinction**
  - **Validates: Requirements 1.2**

- [ ]* 3.3 Write property test for list preservation
  - **Property 4: List formatting preservation**
  - **Validates: Requirements 1.4**

- [ ]* 3.4 Write property test for quote distinction
  - **Property 20: Quote visual distinction**
  - **Validates: Requirements 5.1**

- [ ]* 3.5 Write property test for emphasis rendering
  - **Property 21: Emphasis rendering**
  - **Validates: Requirements 5.2**

- [ ]* 3.6 Write property test for list alignment
  - **Property 22: List alignment enhancement**
  - **Validates: Requirements 5.3**

- [ ]* 3.7 Write property test for header prominence
  - **Property 23: Header visual prominence**
  - **Validates: Requirements 5.4**

- [ ]* 3.8 Write property test for code formatting
  - **Property 24: Code monospace formatting**
  - **Validates: Requirements 5.5**

- [x] 4. Enhance StatementFormatter with rich text support
  - Integrate RichTextFormatter into statement formatting
  - Implement enhanced round headers with decorative elements
  - Add metadata styling distinct from content
  - Create visual statement separators
  - Apply position-specific color coding consistently
  - Add consistent indentation and margins
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 4.1 Write property test for consistent indentation
  - **Property 5: Consistent indentation**
  - **Validates: Requirements 1.5**

- [ ]* 4.2 Write property test for round header presence
  - **Property 6: Round header presence**
  - **Validates: Requirements 2.1**

- [ ]* 4.3 Write property test for metadata styling
  - **Property 7: Metadata styling distinction**
  - **Validates: Requirements 2.2**

- [ ]* 4.4 Write property test for statement separators
  - **Property 8: Statement separator insertion**
  - **Validates: Requirements 2.3**

- [ ]* 4.5 Write property test for position color consistency
  - **Property 9: Position color consistency**
  - **Validates: Requirements 2.4**

- [ ]* 4.6 Write property test for affirmative color consistency
  - **Property 38: Affirmative color consistency**
  - **Validates: Requirements 9.2**

- [ ]* 4.7 Write property test for negative color consistency
  - **Property 39: Negative color consistency**
  - **Validates: Requirements 9.3**

- [ ]* 4.8 Write property test for round progress format
  - **Property 10: Round progress format**
  - **Validates: Requirements 2.5**

- [x] 5. Implement ProgressDisplay component
  - Create ProgressBar data model
  - Implement animated progress bar rendering
  - Add status phrase cycling logic with predefined phrases
  - Create concurrent progress bar display manager
  - Add progress completion handling
  - Implement percentage calculation and display
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 5.1 Write property test for progress bar percentage
  - **Property 46: Progress bar with percentage**
  - **Validates: Requirements 11.1**

- [ ]* 5.2 Write property test for status phrase cycling
  - **Property 47: Status phrase cycling**
  - **Validates: Requirements 11.2**

- [ ]* 5.3 Write property test for concurrent progress bars
  - **Property 48: Concurrent progress bars**
  - **Validates: Requirements 11.3**

- [ ]* 5.4 Write property test for progress completion
  - **Property 49: Progress completion at 100%**
  - **Validates: Requirements 11.4**

- [ ]* 5.5 Write property test for progress output replacement
  - **Property 50: Progress replaces raw output**
  - **Validates: Requirements 11.5**

- [x] 6. Integrate ProgressDisplay into StreamingHandler
  - Replace raw preparation output with progress bars
  - Add progress updates during preparation phase
  - Implement concurrent progress for both models
  - Add completion indicators with timing
  - Enhance streaming indicators for active model
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 6.1 Write property test for streaming indicator
  - **Property 11: Streaming indicator presence**
  - **Validates: Requirements 3.2**

- [ ]* 6.2 Write property test for completion indicator
  - **Property 12: Completion indicator with timing**
  - **Validates: Requirements 3.3**

- [ ]* 6.3 Write property test for concurrent activity distinction
  - **Property 13: Concurrent activity distinction**
  - **Validates: Requirements 3.4**

- [ ]* 6.4 Write property test for progress on delay
  - **Property 14: Progress indicator on delay**
  - **Validates: Requirements 3.5**

- [x] 7. Implement CitationExtractor component
  - Create Citation data model and CitationType enum
  - Implement citation pattern detection (URLs, academic, etc.)
  - Add citation extraction from text
  - Create citation normalization logic
  - Add support for various citation formats
  - _Requirements: 12.2_

- [ ]* 7.1 Write property test for citation extraction
  - **Property 52: Citation extraction**
  - **Validates: Requirements 12.2**

- [x] 8. Implement CitationTracker component
  - Create citation storage and management
  - Implement deduplication logic
  - Add retrieval by position/model
  - Create similarity detection for deduplication
  - _Requirements: 12.2, 12.4_

- [ ]* 8.1 Write property test for citation deduplication
  - **Property 54: Citation deduplication**
  - **Validates: Requirements 12.4**

- [x] 9. Implement BibliographyGenerator component
  - Create bibliography formatting logic
  - Implement citation organization by position
  - Add hyperlink formatting for URLs
  - Create formatted citation entry rendering
  - Add support for different citation styles
  - _Requirements: 12.1, 12.3, 12.5_

- [ ]* 9.1 Write property test for bibliography display
  - **Property 51: Bibliography display on completion**
  - **Validates: Requirements 12.1**

- [ ]* 9.2 Write property test for bibliography organization
  - **Property 53: Bibliography organization**
  - **Validates: Requirements 12.3**

- [ ]* 9.3 Write property test for URL hyperlink formatting
  - **Property 55: URL hyperlink formatting**
  - **Validates: Requirements 12.5**

- [x] 10. Integrate citation system into debate flow
  - Add citation extraction hooks to statement processing
  - Track citations throughout all debate rounds
  - Display bibliography at debate completion
  - Add citation tracking to transcript
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 11. Enhance DisplayUtils with new formatting features
  - Update error and warning formatting with better styling
  - Add stack trace formatting for error context
  - Implement error grouping and organization
  - Add recovery suggestion highlighting
  - Enhance configuration display formatting
  - Add setup progress indicators
  - Improve confirmation displays with checkmarks
  - _Requirements: 6.2, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 11.1 Write property test for error format distinction
  - **Property 28: Error format distinction**
  - **Validates: Requirements 7.1**

- [ ]* 11.2 Write property test for warning vs error styling
  - **Property 29: Warning vs error styling**
  - **Validates: Requirements 7.2**

- [ ]* 11.3 Write property test for stack trace readability
  - **Property 30: Stack trace readability**
  - **Validates: Requirements 7.3**

- [ ]* 11.4 Write property test for error grouping
  - **Property 31: Error grouping**
  - **Validates: Requirements 7.4**

- [ ]* 11.5 Write property test for recovery suggestion highlighting
  - **Property 32: Recovery suggestion highlighting**
  - **Validates: Requirements 7.5**

- [ ]* 11.6 Write property test for configuration format consistency
  - **Property 25: Configuration format consistency**
  - **Validates: Requirements 6.2**

- [ ]* 11.7 Write property test for setup progress indicator
  - **Property 26: Setup progress indicator**
  - **Validates: Requirements 6.4**

- [ ]* 11.8 Write property test for confirmation checkmarks
  - **Property 27: Confirmation checkmarks**
  - **Validates: Requirements 6.5**

- [x] 12. Enhance TranscriptManager with rich formatting
  - Add section headers to transcript display
  - Implement decorative borders for text export
  - Create formatted summary statistics display
  - Add consistent timestamp formatting
  - Enhance metric displays with visual emphasis
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 12.1 Write property test for transcript section headers
  - **Property 15: Transcript section headers**
  - **Validates: Requirements 4.1**

- [ ]* 12.2 Write property test for export decorative elements
  - **Property 16: Export decorative elements**
  - **Validates: Requirements 4.2**

- [ ]* 12.3 Write property test for summary table format
  - **Property 17: Summary table format**
  - **Validates: Requirements 4.3**

- [ ]* 12.4 Write property test for timestamp consistency
  - **Property 18: Timestamp format consistency**
  - **Validates: Requirements 4.4**

- [ ]* 12.5 Write property test for metric emphasis
  - **Property 19: Metric visual emphasis**
  - **Validates: Requirements 4.5**

- [x] 13. Update StreamingHandler for enhanced streaming display
  - Add concurrent stream labeling and separation
  - Implement stream completion indicators
  - Add interruption handling with visual feedback
  - Create distinct formatting for preparation materials
  - Enhance model identification during streaming
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ]* 13.1 Write property test for concurrent stream labeling
  - **Property 33: Concurrent stream labeling**
  - **Validates: Requirements 8.2**

- [ ]* 13.2 Write property test for stream completion indicator
  - **Property 34: Stream completion indicator**
  - **Validates: Requirements 8.3**

- [ ]* 13.3 Write property test for interruption feedback
  - **Property 35: Interruption feedback**
  - **Validates: Requirements 8.4**

- [ ]* 13.4 Write property test for preparation format distinction
  - **Property 36: Preparation format distinction**
  - **Validates: Requirements 8.5**

- [x] 14. Add color scheme consistency enforcement
  - Implement metadata muted color application
  - Add interactive element highlighting
  - Ensure all UI elements use defined color palette
  - Add color scheme validation
  - _Requirements: 9.1, 9.4, 9.5_

- [ ]* 14.1 Write property test for metadata muted colors
  - **Property 40: Metadata muted colors**
  - **Validates: Requirements 9.4**

- [ ]* 14.2 Write property test for interactive element highlighting
  - **Property 41: Interactive element highlighting**
  - **Validates: Requirements 9.5**

- [x] 15. Update CLI entry point with enhanced formatting
  - Integrate all formatting enhancements into debate flow
  - Add progress bars to preparation phase
  - Display bibliography at debate completion
  - Apply rich text formatting to all statement displays
  - Add responsive layout throughout
  - _Requirements: All_

- [ ] 16. Add configuration options for UI features
  - Add UIConfig interface to configuration system
  - Implement enable/disable flags for features
  - Add color scheme selection
  - Create terminal width override option
  - Add accessibility options (disable colors, animations)
  - _Requirements: All_

- [ ]* 16.1 Write unit tests for configuration loading
  - Test default values
  - Test configuration merging
  - Test validation of UI options
  - _Requirements: All_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Add welcome banner enhancement
  - Create visually appealing ASCII art for welcome screen
  - Enhance box drawing with better styling
  - Add color and animation to welcome flow
  - _Requirements: 6.3_

- [ ]* 18.1 Write example test for welcome banner
  - Verify banner contains ASCII art or box drawing
  - **Validates: Requirements 6.3**

- [ ] 19. Final integration and polish
  - Test complete debate flow with all enhancements
  - Verify formatting on different terminal sizes
  - Test with colors disabled for accessibility
  - Verify citation extraction and bibliography display
  - Test progress bars during preparation
  - Ensure all visual elements are consistent
  - _Requirements: All_

- [ ]* 19.1 Write integration tests for complete debate flow
  - Test debate from start to bibliography display
  - Test with various terminal sizes
  - Test with colors disabled
  - _Requirements: All_

- [ ] 20. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
