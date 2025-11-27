# Design Document: Interactive Mode

## Overview

The Interactive Mode feature extends the AI Debate System with a guided command-line interface that allows users to configure and launch debates through step-by-step prompts rather than command-line arguments. The system presents menus for provider selection, model selection, and topic entry, while reading all other debate parameters from a global configuration file. The design emphasizes streaming output for real-time feedback during the preparation phase and supports dynamic model discovery from providers.

## Architecture

The interactive mode integrates with the existing debate system architecture by adding a new CLI interaction layer:

```
┌─────────────────────────────────────────────────────────┐
│              Interactive CLI Interface                   │
│  (Prompts, Menus, Input Validation, Streaming Display)  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Provider   │  │    Config   │  │   Debate    │
│   Registry   │  │   Manager   │  │ Orchestrator│
│              │  │             │  │             │
└──────────────┘  └─────────────┘  └─────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│         Model Provider Implementations            │
│  (OpenAI, Anthropic, Ollama, Local Models)       │
└──────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**: Interactive mode is a separate CLI layer that doesn't modify core debate logic
2. **Configuration-Driven**: All debate parameters come from global config; interactive mode only handles provider/model/topic selection
3. **Streaming Support**: Provider interface extended to support streaming responses for real-time display
4. **Dynamic Discovery**: Providers can be queried at runtime for available models
5. **Graceful Degradation**: System handles missing providers or configuration gracefully

## Components and Interfaces

### 1. Interactive CLI Manager

Orchestrates the interactive setup flow and user interaction.

**Responsibilities:**
- Display welcome message and guide user through setup
- Present provider selection menu
- Present model selection menus
- Prompt for debate topic
- Display configuration summary
- Handle user input validation
- Manage exit/cancel flow

**Key Methods:**
```typescript
interface InteractiveCLI {
  start(): Promise<DebateSession | null>
  displayWelcome(): void
  selectProviders(): Promise<ProviderSelection>
  selectModels(providers: ProviderSelection): Promise<ModelSelection>
  promptForTopic(): Promise<string>
  displaySummary(config: SessionConfig): void
  confirmStart(): Promise<boolean>
}
```

### 2. Provider Registry

Manages available AI providers and their configuration status.

**Responsibilities:**
- Track which providers are installed and configured
- Query providers for available models
- Validate provider credentials
- Provide provider metadata (names, descriptions, status)

**Key Methods:**
```typescript
interface ProviderRegistry {
  getAvailableProviders(): ProviderInfo[]
  isProviderConfigured(providerType: string): boolean
  getModelsForProvider(providerType: string): Promise<ModelInfo[]>
  getRandomModel(providerType: string): Promise<ModelInfo>
  validateProvider(providerType: string): ValidationResult
}

interface ProviderInfo {
  type: string
  name: string
  description: string
  isConfigured: boolean
  requiresCredentials: boolean
}

interface ModelInfo {
  id: string
  name: string
  description: string
  provider: string
}
```

### 3. Streaming Response Handler

Handles streaming output from AI models during preparation phase.

**Responsibilities:**
- Receive streaming tokens/chunks from providers
- Display content incrementally to user
- Track which model is generating content
- Handle streaming errors gracefully

**Key Methods:**
```typescript
interface StreamingHandler {
  onChunk(chunk: string, model: string, position: Position): void
  onComplete(model: string, position: Position): void
  onError(error: Error, model: string, position: Position): void
}
```

### 4. Extended AI Model Provider Interface

Extends existing provider interface to support streaming and model discovery.

**New Methods:**
```typescript
interface AIModelProvider {
  // Existing methods...
  generateResponse(prompt: string, context: DebateContext): Promise<string>
  getModelName(): string
  validateAvailability(): Promise<boolean>
  
  // New methods for interactive mode
  generateResponseStream(
    prompt: string, 
    context: DebateContext, 
    onChunk: (chunk: string) => void
  ): Promise<string>
  
  listAvailableModels(): Promise<ModelInfo[]>
  supportsStreaming(): boolean
}
```

### 5. Configuration Manager Extensions

Extends existing configuration manager to support preparation time parameter.

**New Configuration Fields:**
```typescript
interface DebateConfig {
  // Existing fields...
  timeLimit?: number
  wordLimit?: number
  strictMode: boolean
  showPreparation: boolean
  numCrossExamQuestions: number
  
  // New field
  preparationTime?: number  // seconds allocated for preparation phase
}
```

## Data Models

### ProviderSelection
```typescript
interface ProviderSelection {
  affirmativeProvider: string  // provider type (e.g., 'openai', 'anthropic', 'ollama')
  negativeProvider: string
}
```

### ModelSelection
```typescript
interface ModelSelection {
  affirmativeModel: ModelInfo | 'random'
  negativeModel: ModelInfo | 'random'
}
```

### SessionConfig
```typescript
interface SessionConfig {
  topic: string
  providers: ProviderSelection
  models: ModelSelection
  debateConfig: DebateConfig  // loaded from global config
}
```

### InteractiveState
```typescript
enum InteractiveState {
  WELCOME = 'welcome',
  PROVIDER_SELECTION = 'provider_selection',
  MODEL_SELECTION = 'model_selection',
  TOPIC_INPUT = 'topic_input',
  SUMMARY = 'summary',
  CONFIRMATION = 'confirmation',
  CANCELLED = 'cancelled',
  COMPLETE = 'complete'
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Configuration step sequence is consistent
*For any* interactive session, the prompts should appear in the order: provider selection → model selection → topic input → summary → confirmation.
**Validates: Requirements 1.3**

### Property 2: Provider configuration status is accurate
*For any* provider in the system, the displayed configuration status should match whether valid credentials exist for that provider.
**Validates: Requirements 2.2**

### Property 3: Provider validation is correct
*For any* provider selection, if the provider lacks valid credentials, the validation should fail and return an error.
**Validates: Requirements 2.3**

### Property 4: Same and different provider selections are both valid
*For any* two provider selections (same or different), both should be accepted as valid configurations.
**Validates: Requirements 2.5**

### Property 5: Model lists include required information
*For any* provider's model list, each model entry should include a name and description.
**Validates: Requirements 3.2**

### Property 6: Random option is always available
*For any* provider with at least one model, the model selection menu should include a "random" option.
**Validates: Requirements 3.3**

### Property 7: Random selection returns valid model
*For any* provider with multiple models, selecting "random" should return one of the available models from that provider.
**Validates: Requirements 3.4**

### Property 8: Model assignment is complete
*For any* model selection, each selected model should be assigned to exactly one position (affirmative or negative).
**Validates: Requirements 3.5**

### Property 9: Topic validation rejects invalid inputs
*For any* topic string, the validation should reject empty strings and whitespace-only strings.
**Validates: Requirements 4.2**

### Property 10: Invalid topics trigger error display
*For any* invalid topic input, an error message should be displayed and the user should be re-prompted.
**Validates: Requirements 4.3**

### Property 11: Preparation time validation accepts only positive numbers
*For any* preparation time input, the validation should accept positive numbers and reject zero, negative numbers, and non-numeric values.
**Validates: Requirements 5.2**

### Property 12: Invalid preparation time triggers error
*For any* invalid preparation time input, an error message should be displayed with a suggested range.
**Validates: Requirements 5.3**

### Property 13: Preparation time limit is enforced
*For any* configured preparation time, the preparation phase should not exceed that duration.
**Validates: Requirements 5.5**

### Property 14: Streaming displays content incrementally
*For any* generated preparation content, the display should show chunks as they arrive rather than waiting for completion.
**Validates: Requirements 6.2**

### Property 15: Preparation output includes model identification
*For any* preparation output chunk, the display should indicate which model (affirmative or negative) generated it.
**Validates: Requirements 6.4**

### Property 16: Preparation timeout stops generation
*For any* preparation that exceeds the time limit, the system should stop generation and proceed to the next phase.
**Validates: Requirements 6.6**

### Property 17: Configuration loading reads all parameters
*For any* valid global configuration file, all debate parameters should be loaded into memory.
**Validates: Requirements 7.1**

### Property 18: Loaded configuration values are used
*For any* loaded configuration, the debate should use those values for word limit, time limit, preparation time, and other settings.
**Validates: Requirements 7.2**

### Property 19: Missing parameters use defaults
*For any* configuration parameter missing from the global config file, the system should use a hardcoded default value.
**Validates: Requirements 7.3**

### Property 20: Configuration confirmation is displayed
*For any* configuration value selection, a confirmation message should be displayed to the user.
**Validates: Requirements 8.2**

### Property 21: Menus include numbered options
*For any* menu display, each option should be numbered to indicate how to make selections.
**Validates: Requirements 8.3**

### Property 22: Preparation time is read from config
*For any* global configuration file containing a preparation time parameter, that value should be loaded and used.
**Validates: Requirements 9.1**

### Property 23: Configuration updates are reflected
*For any* updated global configuration file, subsequent debates should use the new preparation time value.
**Validates: Requirements 9.4**

### Property 24: Exit option is always available
*For any* interactive prompt, an exit or cancel option should be provided to the user.
**Validates: Requirements 10.1**

### Property 25: Exit prevents debate start
*For any* confirmed exit action, no debate should be initiated.
**Validates: Requirements 10.3**

### Property 26: Exit does not save partial config
*For any* exit action, partial configuration should not be persisted unless explicitly requested.
**Validates: Requirements 10.4**

### Property 27: Provider status is indicated
*For any* provider list display, each provider should show whether it is configured and available.
**Validates: Requirements 11.1**

### Property 28: Model descriptions are shown
*For any* model list display, each model should show its name and a brief description.
**Validates: Requirements 11.2**

### Property 29: Configuration summary is complete
*For any* configuration summary display, all loaded values from the global configuration file should be shown.
**Validates: Requirements 11.4**

## Error Handling

### Input Validation Errors
- **Empty topic**: Display error "Topic cannot be empty" and re-prompt
- **Invalid preparation time**: Display error "Preparation time must be a positive number (suggested: 30-300 seconds)" and re-prompt
- **Unconfigured provider**: Display error "Provider [name] is not configured. Please set up credentials in [config location]"

### Provider Errors
- **Provider unavailable**: Display warning and remove from available options
- **Model list fetch failure**: Display error "Failed to fetch models from [provider]. Please check your connection and credentials."
- **Random selection with no models**: Display error "No models available from [provider]"

### Configuration Errors
- **Missing config file**: Use all default values and display warning
- **Invalid config format**: Display error with specific parsing issue and use defaults
- **Missing parameter**: Use default value silently (no error)

### Streaming Errors
- **Stream interruption**: Display partial content and error message, allow retry
- **Timeout during streaming**: Stop stream, display what was generated, proceed to next phase

### Exit Handling
- **User cancels at any step**: Confirm cancellation, exit gracefully
- **Unexpected termination**: Save no state, clean exit

## Testing Strategy

The Interactive Mode will employ both unit tests and property-based tests using **fast-check** for TypeScript. Each property-based test will run a minimum of 100 iterations.

### Property-Based Testing

**Property Test Requirements:**
- Each test must be tagged with: `// Feature: interactive-mode, Property {number}: {property_text}`
- Each correctness property must be implemented by a single property-based test
- Tests should use smart generators for realistic input scenarios

**Key Property Tests:**

1. **Configuration step sequence** (Property 1): Generate random interactive sessions and verify prompt order
2. **Provider validation** (Properties 2, 3, 4): Generate provider configurations and verify validation logic
3. **Model selection** (Properties 5-8): Generate model lists and selections, verify completeness and validity
4. **Topic validation** (Properties 9, 10): Generate various topic strings and verify validation
5. **Preparation time** (Properties 11-13, 16): Generate time values and verify validation and enforcement
6. **Streaming behavior** (Properties 14, 15): Generate content chunks and verify incremental display
7. **Configuration loading** (Properties 17-19, 22, 23): Generate config files and verify loading and defaults
8. **UI feedback** (Properties 20, 21, 27-29): Generate UI states and verify display completeness
9. **Exit handling** (Properties 24-26): Generate exit scenarios and verify no side effects

### Unit Testing

**Core Unit Tests:**
1. **Interactive CLI Manager**: Test each step of the interactive flow with mock inputs
2. **Provider Registry**: Test provider discovery, validation, and model listing
3. **Streaming Handler**: Test chunk processing and display formatting
4. **Configuration Manager**: Test config file parsing and default value handling

**Edge Cases:**
- No providers configured
- Single provider available
- Provider with no models
- Very long topic strings
- Malformed configuration files
- Network failures during model discovery
- User exits at each possible step

**Integration Tests:**
- Complete interactive flow from start to debate launch
- Streaming preparation phase with mock providers
- Configuration loading from various file states
- Error recovery scenarios

## Implementation Considerations

### 1. User Experience

**Interactive Flow:**
```
1. Welcome screen with brief explanation
2. Provider selection menu (numbered list)
3. Model selection for affirmative (numbered list + random option)
4. Model selection for negative (numbered list + random option)
5. Topic input prompt with examples
6. Configuration summary (loaded from global config)
7. Confirmation prompt
8. Start debate or exit
```

**Visual Design:**
- Use colors to distinguish different sections
- Box important information (summary, errors)
- Show progress indicators (Step 1 of 4, etc.)
- Use clear labels and spacing

**Example Flow:**
```
╔══════════════════════════════════════════════════════════╗
║          Welcome to AI Debate System                     ║
║                                                          ║
║  Configure your debate through the following steps:     ║
║    1. Select AI providers                               ║
║    2. Choose models                                     ║
║    3. Enter debate topic                                ║
║    4. Review and start                                  ║
╚══════════════════════════════════════════════════════════╝

Step 1 of 4: Select Provider for Affirmative Position
─────────────────────────────────────────────────────

Available Providers:
  1. OpenAI (GPT-4, GPT-3.5) ✓ Configured
  2. Anthropic (Claude) ✓ Configured  
  3. Ollama (Local Models) ✓ Configured
  4. Exit

Enter selection (1-4): _
```

### 2. Streaming Implementation

**Streaming Architecture:**
- Providers implement `generateResponseStream()` method
- Callback function receives chunks as they arrive
- Display updates immediately for each chunk
- Fallback to non-streaming if provider doesn't support it

**Streaming Display:**
```
═══════════════════════════════════════════════════════════
Preparation Phase
═══════════════════════════════════════════════════════════

[AFFIRMATIVE - GPT-4] Researching topic...

The question of artificial intelligence's impact on humanity 
requires examining both potential benefits and risks. Key 
considerations include: economic disruption through automation,
[streaming continues...]

[NEGATIVE - Claude] Researching topic...

While AI offers significant advantages, we must carefully 
consider the existential risks and ethical implications...
[streaming continues...]
```

### 3. Configuration Management

**Global Configuration File (.debaterc):**
```json
{
  "timeLimit": 120,
  "wordLimit": 500,
  "preparationTime": 180,
  "strictMode": false,
  "showPreparation": true,
  "numCrossExamQuestions": 3
}
```

**Configuration Loading Priority:**
1. Load from `.debaterc` in current directory
2. Fall back to `~/.debaterc` in home directory
3. Use hardcoded defaults if no file found

**Default Values:**
```typescript
const DEFAULT_CONFIG: DebateConfig = {
  timeLimit: 120,
  wordLimit: 500,
  preparationTime: 180,
  strictMode: false,
  showPreparation: true,
  numCrossExamQuestions: 3
}
```

### 4. Provider Discovery

**Dynamic Model Discovery:**
- Query provider API at runtime for available models
- Cache results for session duration
- Handle API failures gracefully
- Support offline mode for local providers

**Random Model Selection:**
- Fetch all available models from provider
- Use cryptographically secure random selection
- Display selected model to user before debate starts
- Allow user to re-roll if desired

### 5. Input Validation

**Topic Validation:**
- Trim whitespace
- Reject empty or whitespace-only strings
- Minimum length: 10 characters
- Maximum length: 500 characters
- Allow all Unicode characters

**Preparation Time Validation:**
- Must be positive integer
- Suggested range: 30-300 seconds
- Warn if value is very low (< 30) or very high (> 600)
- Allow override with confirmation

### 6. Exit Handling

**Exit Points:**
- User can exit at any prompt by entering 'exit', 'quit', or 'q'
- Ctrl+C handled gracefully with confirmation
- No partial state saved unless explicitly requested

**Exit Confirmation:**
```
Are you sure you want to exit? (y/n): _
```

## Integration with Existing System

### Minimal Changes to Core

The interactive mode is designed to integrate with minimal changes to the existing debate system:

1. **CLI Entry Point**: Add new command-line flag `--interactive` or detect no arguments
2. **Provider Interface**: Extend with streaming and model discovery methods
3. **Configuration**: Add `preparationTime` field to DebateConfig
4. **Orchestrator**: Use streaming callbacks during preparation phase if available

### Backward Compatibility

- Existing command-line argument mode continues to work
- Non-streaming providers fall back to batch generation
- Missing `preparationTime` in config uses default
- All existing tests continue to pass

## Future Enhancements

1. **Saved Sessions**: Allow saving and resuming interactive sessions
2. **Model Comparison**: Show model capabilities side-by-side during selection
3. **Topic Suggestions**: Provide trending or suggested debate topics
4. **Provider Health Check**: Test provider connectivity before selection
5. **Advanced Configuration**: Allow overriding specific config values interactively
6. **Debate History**: Show recent debates and allow quick re-run with same config
7. **Multi-Language Support**: Internationalize prompts and messages
8. **Voice Input**: Support voice-to-text for topic entry
9. **Web Interface**: Extend interactive mode to web-based UI
10. **Collaborative Setup**: Allow multiple users to configure debate together

## Security Considerations

1. **Credential Storage**: Never display API keys in interactive mode
2. **Input Sanitization**: Validate and sanitize all user inputs
3. **File System Access**: Restrict config file access to user's home directory
4. **Network Security**: Use HTTPS for all provider API calls
5. **Error Messages**: Don't leak sensitive information in error messages

## Performance Considerations

1. **Provider Discovery**: Cache model lists to avoid repeated API calls
2. **Streaming**: Use efficient buffering for chunk display
3. **Configuration Loading**: Parse config file once at startup
4. **Async Operations**: Use async/await for non-blocking I/O
5. **Memory Management**: Clean up resources after debate completion
