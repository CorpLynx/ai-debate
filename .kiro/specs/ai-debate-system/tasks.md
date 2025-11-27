# Implementation Plan

- [x] 1. Set up project structure and core types
  - Initialize TypeScript project with necessary dependencies
  - Create directory structure (src/models, src/providers, src/orchestrator, src/cli, tests/)
  - Define core data models and interfaces (Debate, DebateConfig, DebateState, Statement, etc.)
  - Set up testing framework (Jest) and property-based testing library (fast-check)
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement topic validation
  - Create DebateValidator class with topic validation logic
  - Implement validation for non-empty topics and whitespace-only rejection
  - _Requirements: 1.1, 1.4_

- [x] 2.1 Write property test for topic validation
  - **Property 1: Topic validation correctly identifies non-empty topics**
  - **Validates: Requirements 1.1, 1.4**

- [x] 3. Implement AI model provider interface and mock provider
  - Define AIModelProvider interface with generateResponse, getModelName, and validateAvailability methods
  - Create MockAIProvider for testing that returns configurable responses
  - _Requirements: 2.1, 2.2_

- [x] 4. Implement model selection and position assignment
  - Create model selection logic that picks two distinct models from available providers
  - Implement random position assignment (affirmative/negative)
  - Handle edge case of insufficient models (< 2)
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 4.1 Write property test for model selection
  - **Property 3: Model selection produces distinct models**
  - **Validates: Requirements 2.1**

- [x] 4.2 Write property test for position assignment
  - **Property 4: Position assignment is complete and exclusive**
  - **Validates: Requirements 2.2**

- [x] 5. Implement debate state machine
  - Create DebateOrchestrator class with state management
  - Implement state transition logic following the sequence: INITIALIZED → PREPARATION → OPENING_STATEMENTS → REBUTTALS → CROSS_EXAMINATION → CLOSING_STATEMENTS → COMPLETED
  - Add validation to prevent invalid state transitions
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.7_

- [x] 5.1 Write property test for state machine transitions
  - **Property 5: Debate state machine follows correct sequence**
  - **Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.6, 3.7**

- [x] 6. Implement debate initialization
  - Create initializeDebate method that accepts topic and configuration
  - Store topic in debate session
  - Display confirmation to user
  - _Requirements: 1.2, 1.3_

- [x] 6.1 Write property test for topic storage round-trip
  - **Property 2: Topic storage round-trip**
  - **Validates: Requirements 1.2**

- [x] 7. Implement preparation phase
  - Create executePreparation method in DebateOrchestrator
  - Prompt both models to research the topic and compose arguments
  - Store preparation materials for each model
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7.1 Write property test for preparation materials storage
  - **Property 7: Preparation materials are stored and retrievable**
  - **Validates: Requirements 4.3**

- [x] 8. Implement context construction for statement generation
  - Create buildContext method that constructs DebateContext for each round type
  - Include position indicator (affirmative/negative) in context
  - For rebuttals, include opponent's opening statement
  - For closing statements, include all previous statements
  - For cross-examination, include opponent's opening and rebuttal
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.5_

- [x] 8.1 Write property test for position indicator in context
  - **Property 8: Context includes correct position indicator**
  - **Validates: Requirements 5.1, 5.2**

- [x] 8.2 Write property test for rebuttal context
  - **Property 9: Rebuttal context includes opponent's opening**
  - **Validates: Requirements 5.3**

- [x] 8.3 Write property test for closing context
  - **Property 10: Closing context includes all previous statements**
  - **Validates: Requirements 5.4**

- [x] 8.4 Write property test for cross-examination context
  - **Property 12: Cross-examination context includes opening and rebuttal**
  - **Validates: Requirements 6.5**

- [x] 9. Implement opening statements round
  - Create executeOpeningStatements method
  - Prompt affirmative model first, then negative model
  - Store both statements in debate rounds
  - _Requirements: 3.3_

- [x] 9.1 Write property test for turn-taking in rounds
  - **Property 6: Turn-taking within rounds is correct**
  - **Validates: Requirements 3.3**

- [x] 10. Implement rebuttals round
  - Create executeRebuttals method
  - Generate rebuttals for both models with opponent's opening as context
  - Store rebuttal statements
  - _Requirements: 3.1, 5.3_

- [x] 11. Implement cross-examination round
  - Create executeCrossExamination method
  - Implement turn sequence: affirmative asks → negative responds → negative asks → affirmative responds
  - Provide opening and rebuttal as context for questions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 11.1 Write property test for cross-examination turn sequence
  - **Property 11: Cross-examination follows correct turn sequence**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 12. Implement closing statements round
  - Create executeClosingStatements method
  - Provide all previous statements as context
  - Mark debate as completed after both closing statements
  - _Requirements: 3.1, 5.4_

- [x] 13. Implement statement display functionality
  - Create formatStatement method that includes model name, position, and round type
  - Display statements immediately after generation
  - Add visual formatting (colors, separators)
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 13.1 Write property test for statement display metadata
  - **Property 13: Statement display includes required metadata**
  - **Validates: Requirements 7.2, 7.3**

- [x] 14. Imp     lement transcript generation
  - Create TranscriptManager class
  - Implement generateTranscript method that collects all statements in chronological order
  - Include debate topic, models, positions, preparation materials, and all statements
  - Ensure no statements are missing or duplicated
  - _Requirements: 8.1, 8.2_

- [x] 14.1 Write property test for transcript completeness
  - **Property 14: Transcript contains all statements in order**
  - **Validates: Requirements 8.1**

- [x] 14.2 Write property test for transcript metadata
  - **Property 15: Transcript includes all required metadata**
  - **Validates: Requirements 8.2**

- [x] 15. Implement transcript storage and retrieval
  - Implement saveTranscript method to persist transcripts to file system
  - Implement loadTranscript method to retrieve saved transcripts
  - Preserve formatting and attribution
  - _Requirements: 8.3, 8.4_

- [x] 15.1 Write property test for transcript storage round-trip
  - **Property 16: Transcript storage round-trip preserves data**
  - **Validates: Requirements 8.4**

- [x] 16. Implement error handling for model failures
  - Add try-catch blocks around model generation calls
  - Log errors with context (debate state, round, model)
  - Notify user with clear error descriptions
  - Save partial transcript on critical errors
  - _Requirements: 9.1, 9.3, 9.4_

- [x] 16.1 Write property test for error logging
  - **Property 17: Model failures trigger error logging**
  - **Validates: Requirements 9.1**

- [x] 16.2 Write property test for partial transcript preservation
  - **Property 19: Critical errors preserve partial transcripts**
  - **Validates: Requirements 9.3**

- [x] 17. Implement timeout and retry logic
  - Add timeout configuration to model generation calls
  - Implement single retry on timeout with exponential backoff
  - Report failure after retry exhausted
  - _Requirements: 9.2_

- [x] 17.1 Write property test for retry logic
  - **Property 18: Timeouts trigger exactly one retry**
  - **Validates: Requirements 9.2**

- [x] 18. Implement configuration management
  - Create default configuration values
  - Implement configuration validation
  - Fall back to defaults for invalid parameters and notify user
  - Support time limits, word limits, strict mode, and other options
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 18.1 Write property test for word limit enforcement
  - **Property 20: Word limit enforcement**
  - **Validates: Requirements 10.2**

- [x] 18.2 Write property test for invalid configuration fallback
  - **Property 21: Invalid configuration falls back to defaults**
  - **Validates: Requirements 10.4**

- [x] 19. Implement word limit enforcement
  - Add word counting logic to statement validation
  - Truncate or reject statements exceeding configured word limit
  - _Requirements: 10.2_

- [x] 20. Implement optional preparation display
  - Add configuration option to show/hide preparation phase
  - Conditionally display preparation summary based on config
  - _Requirements: 4.4_

- [x] 21. Implement real AI model providers
  - Create OpenAIProvider class implementing AIModelProvider interface
  - Create AnthropicProvider class implementing AIModelProvider interface
  - Handle API authentication and configuration
  - Implement rate limiting and error handling
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 21.1 Write unit tests for OpenAI provider
  - Test response generation with mock API
  - Test error handling and retries
  - _Requirements: 2.1, 2.2_

- [x] 21.2 Write unit tests for Anthropic provider
  - Test response generation with mock API
  - Test error handling and retries
  - _Requirements: 2.1, 2.2_

- [x] 22. Implement CLI interface
  - Create command-line interface using Commander.js or similar
  - Accept debate topic as argument
  - Display debate progress with status indicators
  - Show final transcript
  - Support configuration options via CLI flags
  - _Requirements: 1.1, 1.3, 2.3, 7.1, 7.2, 7.3, 7.4, 8.3_

- [x] 22.1 Write unit tests for CLI input parsing
  - Test topic extraction from arguments
  - Test configuration flag parsing
  - _Requirements: 1.1_

- [x] 23. Implement prompt engineering for each round
  - Create prompt templates for preparation phase
  - Create prompt templates for opening statements
  - Create prompt templates for rebuttals
  - Create prompt templates for cross-examination questions and answers
  - Create prompt templates for closing statements
  - Include debate rules and format instructions in prompts
  - _Requirements: 4.1, 5.1, 5.2_

- [x] 24. Add visual formatting and user experience enhancements
  - Implement color coding for affirmative vs negative positions
  - Add progress indicators showing current round
  - Add "thinking" indicators while models generate responses
  - Format output with clear separators between rounds
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 24.1 Write property tests for statement display
  - **Property 22: Statement display includes all required metadata**
  - **Property 23: Color coding distinguishes affirmative from negative positions**
  - **Property 24: Plain formatting removes all color codes**
  - **Property 25: Formatted output includes visual separators**
  - **Property 26: Thinking indicator includes model, position, and round information**
  - **Property 27: Round type is consistently formatted**
  - **Property 28: Content indentation is preserved for multi-line statements**
  - **Property 29: Formatted output is never empty**
  - **Property 30: Position color coding is mutually exclusive**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 25. Implement transcript export formats
  - Add formatTranscript method supporting multiple output formats
  - Support plain text format
  - Support markdown format
  - Support JSON format
  - _Requirements: 8.3_

- [ ] 25.1 Write unit tests for transcript formatting
  - Test each output format with sample debates
  - Verify all information is preserved
  - _Requirements: 8.3, 8.4_

- [ ] 26. Add configuration file support
  - Support loading configuration from .debaterc file
  - Support environment variables for API keys
  - Merge configuration from multiple sources (file, env, CLI)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 27. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 28. Write integration tests for full debate flow
  - Test complete debate from initialization to transcript generation
  - Use mock providers to simulate full debate
  - Verify all rounds execute in correct order
  - _Requirements: All requirements_

- [ ] 29. Write integration tests for error scenarios
  - Test debate behavior when model fails during different rounds
  - Test timeout and retry scenarios
  - Test partial transcript generation on errors
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 30. Add documentation and examples
  - Write README with installation and usage instructions
  - Add example debates demonstrating different topics
  - Document configuration options
  - Add API documentation for extending with custom providers
  - _Requirements: All requirements_

- [ ] 31. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
