# Implementation Plan

- [x] 1. Extend configuration model with preparation time
  - Add `preparationTime` field to DebateConfig interface
  - Update DEFAULT_CONFIG with preparationTime default value (180 seconds)
  - Update configuration file parsing to read preparationTime
  - _Requirements: 5.4, 7.1, 9.1, 9.2_

- [x] 1.1 Write property test for configuration loading
  - **Property 17: Configuration loading reads all parameters**
  - **Validates: Requirements 7.1**

- [x] 1.2 Write property test for missing parameters
  - **Property 19: Missing parameters use defaults**
  - **Validates: Requirements 7.3**

- [x] 1.3 Write property test for preparation time reading
  - **Property 22: Preparation time is read from config**
  - **Validates: Requirements 9.1**

- [x] 2. Create provider registry system
  - Create ProviderRegistry class with provider tracking
  - Implement getAvailableProviders() to list all provider types
  - Implement isProviderConfigured() to check credential status
  - Add provider metadata (name, description, configuration status)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2.1 Write property test for provider configuration status
  - **Property 2: Provider configuration status is accurate**
  - **Validates: Requirements 2.2**

- [x] 2.2 Write property test for provider validation
  - **Property 3: Provider validation is correct**
  - **Validates: Requirements 2.3**

- [x] 3. Extend AI model provider interface for model discovery
  - Add listAvailableModels() method to AIModelProvider interface
  - Implement listAvailableModels() in OpenAIProvider
  - Implement listAvailableModels() in AnthropicProvider
  - Implement listAvailableModels() in LocalModelProvider (Ollama)
  - Add getRandomModel() method to ProviderRegistry
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3.1 Write property test for model list information
  - **Property 5: Model lists include required information**
  - **Validates: Requirements 3.2**

- [x] 3.2 Write property test for random option availability
  - **Property 6: Random option is always available**
  - **Validates: Requirements 3.3**

- [x] 3.3 Write property test for random selection validity
  - **Property 7: Random selection returns valid model**
  - **Validates: Requirements 3.4**

- [x] 4. Implement streaming support in provider interface
  - Add generateResponseStream() method to AIModelProvider interface
  - Add supportsStreaming() method to AIModelProvider interface
  - Implement streaming in OpenAIProvider using OpenAI streaming API
  - Implement streaming in AnthropicProvider using Anthropic streaming API
  - Implement streaming in LocalModelProvider using Ollama streaming API
  - Add fallback to non-streaming for providers that don't support it
  - _Requirements: 6.2, 6.3_

- [x] 4.1 Write property test for streaming display
  - **Property 14: Streaming displays content incrementally**
  - **Validates: Requirements 6.2**

- [x] 5. Create streaming response handler
  - Create StreamingHandler class with onChunk, onComplete, onError methods
  - Implement chunk display with model identification (affirmative/negative)
  - Add visual formatting for streaming output
  - Handle streaming errors gracefully
  - _Requirements: 6.2, 6.4_

- [x] 5.1 Write property test for model identification in output
  - **Property 15: Preparation output includes model identification**
  - **Validates: Requirements 6.4**

- [x] 6. Implement preparation time enforcement
  - Add timeout logic to preparation phase execution
  - Stop generation when preparation time limit is reached
  - Display timeout message and proceed to next phase
  - _Requirements: 5.5, 6.6_

- [x] 6.1 Write property test for preparation time limit
  - **Property 13: Preparation time limit is enforced**
  - **Validates: Requirements 5.5**

- [x] 6.2 Write property test for preparation timeout
  - **Property 16: Preparation timeout stops generation**
  - **Validates: Requirements 6.6**

- [x] 7. Create interactive CLI manager
  - Create InteractiveCLI class with start() method
  - Implement displayWelcome() to show welcome message and overview
  - Create state machine for interactive flow (WELCOME → PROVIDER_SELECTION → MODEL_SELECTION → TOPIC_INPUT → SUMMARY → CONFIRMATION)
  - Add exit handling at each step
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7.1 Write property test for configuration step sequence
  - **Property 1: Configuration step sequence is consistent**
  - **Validates: Requirements 1.3**

- [x] 7.2 Write property test for exit option availability
  - **Property 24: Exit option is always available**
  - **Validates: Requirements 10.1**

- [x] 8. Implement provider selection interface
  - Create selectProviders() method in InteractiveCLI
  - Display numbered list of available providers with configuration status
  - Validate selected providers are configured
  - Display configuration instructions for unconfigured providers
  - Allow same or different providers for both positions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 8.1 Write property test for same/different provider selections
  - **Property 4: Same and different provider selections are both valid**
  - **Validates: Requirements 2.5**

- [x] 8.2 Write property test for provider status display
  - **Property 27: Provider status is indicated**
  - **Validates: Requirements 11.1**

- [x] 9. Implement model selection interface
  - Create selectModels() method in InteractiveCLI
  - Display numbered list of models for selected provider
  - Include "random" option in model list
  - Handle random selection by calling getRandomModel()
  - Assign selected models to affirmative and negative positions
  - Display final model assignments
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 9.1 Write property test for model assignment
  - **Property 8: Model assignment is complete**
  - **Validates: Requirements 3.5**

- [x] 9.2 Write property test for model descriptions
  - **Property 28: Model descriptions are shown**
  - **Validates: Requirements 11.2**

- [x] 10. Implement topic input interface
  - Create promptForTopic() method in InteractiveCLI
  - Display topic input prompt with examples
  - Validate topic is non-empty and contains meaningful content
  - Display error and re-prompt for invalid topics
  - Display topic back to user for confirmation
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10.1 Write property test for topic validation
  - **Property 9: Topic validation rejects invalid inputs**
  - **Validates: Requirements 4.2**

- [x] 10.2 Write property test for invalid topic error handling
  - **Property 10: Invalid topics trigger error display**
  - **Validates: Requirements 4.3**

- [x] 11. Implement configuration summary display
  - Create displaySummary() method in InteractiveCLI
  - Load all debate parameters from global configuration file
  - Display formatted summary including: topic, models, providers, and all config values
  - Show preparation time from loaded configuration
  - _Requirements: 1.4, 7.1, 7.2, 8.5, 11.4_

- [x] 11.1 Write property test for loaded configuration usage
  - **Property 18: Loaded configuration values are used**
  - **Validates: Requirements 7.2**

- [x] 11.2 Write property test for configuration summary completeness
  - **Property 29: Configuration summary is complete**
  - **Validates: Requirements 11.4**

- [x] 12. Implement confirmation and start flow
  - Create confirmStart() method in InteractiveCLI
  - Display confirmation prompt
  - Handle user confirmation (yes/no)
  - Return configured debate session or null if cancelled
  - _Requirements: 1.4_

- [x] 13. Implement input validation utilities
  - Create validation functions for preparation time (positive numbers only)
  - Create validation functions for topic (non-empty, meaningful content)
  - Add error message formatting for validation failures
  - Display suggested ranges for numeric inputs
  - _Requirements: 4.2, 5.2, 5.3_

- [x] 13.1 Write property test for preparation time validation
  - **Property 11: Preparation time validation accepts only positive numbers**
  - **Validates: Requirements 5.2**

- [x] 13.2 Write property test for invalid preparation time error
  - **Property 12: Invalid preparation time triggers error**
  - **Validates: Requirements 5.3**

- [x] 14. Implement UI feedback and display utilities
  - Create menu display function with numbered options
  - Create confirmation display function
  - Add visual formatting (colors, boxes, separators)
  - Implement error message display with distinct formatting
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 14.1 Write property test for configuration confirmation
  - **Property 20: Configuration confirmation is displayed**
  - **Validates: Requirements 8.2**

- [x] 14.2 Write property test for menu numbering
  - **Property 21: Menus include numbered options**
  - **Validates: Requirements 8.3**

- [ ] 15. Implement exit and cancellation handling
  - Add exit detection at each interactive prompt
  - Create exit confirmation dialog
  - Ensure no debate is started when exit is confirmed
  - Ensure no partial configuration is saved on exit
  - Return null from InteractiveCLI.start() on cancellation
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 15.1 Write property test for exit preventing debate start
  - **Property 25: Exit prevents debate start**
  - **Validates: Requirements 10.3**

- [ ] 15.2 Write property test for no partial config save
  - **Property 26: Exit does not save partial config**
  - **Validates: Requirements 10.4**

- [ ] 16. Update debate orchestrator for streaming preparation
  - Modify executePreparation() to use streaming if available
  - Pass StreamingHandler callbacks to model providers
  - Display preparation output in real-time during generation
  - Fall back to non-streaming display if provider doesn't support it
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 17. Update CLI entry point for interactive mode
  - Detect when application is run without arguments
  - Create and invoke InteractiveCLI when no arguments provided
  - Pass configured session to debate orchestrator
  - Maintain backward compatibility with argument-based mode
  - _Requirements: 1.1_

- [ ] 18. Add configuration file support for preparation time
  - Update .debaterc.example with preparationTime field
  - Update configuration loading to parse preparationTime
  - Use default value if preparationTime is missing
  - Document preparationTime in README
  - _Requirements: 7.1, 7.3, 9.1, 9.2_

- [ ] 18.1 Write property test for configuration updates
  - **Property 23: Configuration updates are reflected**
  - **Validates: Requirements 9.4**

- [ ] 19. Implement error handling for provider operations
  - Handle provider unavailable errors
  - Handle model list fetch failures
  - Handle random selection with no models
  - Display clear error messages with recovery suggestions
  - _Requirements: 2.4_

- [ ] 20. Implement error handling for configuration operations
  - Handle missing configuration file (use defaults)
  - Handle invalid configuration format (parse errors)
  - Handle missing individual parameters (use defaults)
  - Display warnings for configuration issues
  - _Requirements: 7.3_

- [ ] 21. Implement error handling for streaming operations
  - Handle stream interruption (display partial content)
  - Handle timeout during streaming (stop and proceed)
  - Display error messages for streaming failures
  - Allow retry on streaming errors
  - _Requirements: 6.6_

- [ ] 22. Add visual enhancements to interactive mode
  - Add welcome screen with ASCII art or box drawing
  - Add progress indicators (Step X of Y)
  - Add color coding for different sections
  - Add loading spinners for async operations
  - Format summary in a visually appealing box
  - _Requirements: 8.1, 8.5_

- [ ] 23. Write unit tests for InteractiveCLI
  - Test welcome display
  - Test provider selection with mock inputs
  - Test model selection with mock inputs
  - Test topic input with various valid and invalid inputs
  - Test summary display
  - Test confirmation flow
  - Test exit at each step
  - _Requirements: All interactive mode requirements_

- [ ] 24. Write unit tests for ProviderRegistry
  - Test provider discovery
  - Test configuration status checking
  - Test model listing for each provider type
  - Test random model selection
  - Test error handling for unavailable providers
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.4_

- [ ] 25. Write unit tests for StreamingHandler
  - Test chunk processing and display
  - Test model identification in output
  - Test completion handling
  - Test error handling
  - _Requirements: 6.2, 6.4_

- [ ] 26. Write integration tests for complete interactive flow
  - Test full flow from welcome to debate start with mock inputs
  - Test flow with different provider combinations
  - Test flow with random model selections
  - Test flow with various topics
  - Test exit at different points
  - _Requirements: All interactive mode requirements_

- [ ] 27. Write integration tests for streaming preparation
  - Test preparation phase with streaming enabled
  - Test preparation phase with streaming disabled (fallback)
  - Test preparation timeout during streaming
  - Test streaming errors and recovery
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 28. Update documentation
  - Update README with interactive mode instructions
  - Document new configuration parameter (preparationTime)
  - Add examples of interactive mode usage
  - Document provider setup requirements
  - Add troubleshooting section for common issues
  - _Requirements: All requirements_

- [ ] 29. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
