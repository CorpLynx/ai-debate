# Design Document: AI Debate System

## Overview

The AI Debate System is a command-line application that orchestrates formal debates between two AI language models on user-specified topics. The system manages the complete debate lifecycle from topic submission through preparation, structured argumentation rounds, and transcript generation. The architecture emphasizes modularity, allowing easy integration of different AI model providers while maintaining a consistent debate flow.

## Architecture

The system follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Interface                         │
│              (User Input/Output)                         │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Debate Orchestrator                     │
│         (State Management & Flow Control)                │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   AI Model   │  │   Debate    │  │  Transcript │
│   Provider   │  │   Validator │  │   Manager   │
│   Interface  │  │             │  │             │
└──────────────┘  └─────────────┘  └─────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│         Model Implementations                     │
│  (OpenAI, Anthropic, Local Models, etc.)         │
└──────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Provider Abstraction**: AI models are accessed through a common interface, enabling support for multiple providers
2. **State Machine**: Debate flow is managed as a state machine with well-defined transitions
3. **Immutable Debate State**: Each debate round produces new state rather than mutating existing state
4. **Separation of Concerns**: CLI, orchestration, model interaction, and persistence are independent layers

## Components and Interfaces

### 1. Debate Orchestrator

The central component that manages debate lifecycle and coordinates between other components.

**Responsibilities:**
- Initialize debates with topic and configuration
- Manage debate state transitions through rounds
- Coordinate AI model invocations with appropriate context
- Enforce debate rules and timing constraints
- Handle errors and retry logic

**Key Methods:**
```typescript
interface DebateOrchestrator {
  initializeDebate(topic: string, config: DebateConfig): Debate
  executePreparation(debate: Debate): Promise<Debate>
  executeOpeningStatements(debate: Debate): Promise<Debate>
  executeRebuttals(debate: Debate): Promise<Debate>
  executeCrossExamination(debate: Debate): Promise<Debate>
  executeClosingStatements(debate: Debate): Promise<Debate>
  getCurrentState(debate: Debate): DebateState
}
```

### 2. AI Model Provider Interface

Abstract interface for interacting with different AI model providers.

**Responsibilities:**
- Generate responses based on prompts and context
- Handle provider-specific authentication and configuration
- Manage rate limiting and retries
- Normalize responses to common format

**Key Methods:**
```typescript
interface AIModelProvider {
  generateResponse(prompt: string, context: DebateContext): Promise<string>
  getModelName(): string
  validateAvailability(): Promise<boolean>
}
```

**Implementations:**
- OpenAIProvider
- AnthropicProvider
- LocalModelProvider (for self-hosted models)

### 3. Debate Validator

Validates debate inputs, configurations, and optionally model responses.

**Responsibilities:**
- Validate topic is non-empty and well-formed
- Validate configuration parameters
- Optionally check if responses stay on-topic (strict mode)
- Enforce word/character limits

**Key Methods:**
```typescript
interface DebateValidator {
  validateTopic(topic: string): ValidationResult
  validateConfig(config: DebateConfig): ValidationResult
  validateResponse(response: string, config: DebateConfig): ValidationResult
  checkOnTopic(response: string, topic: string): boolean
}
```

### 4. Transcript Manager

Manages debate transcript generation, storage, and retrieval.

**Responsibilities:**
- Build transcript from debate state
- Format transcript for display and export
- Persist transcripts to storage
- Retrieve historical transcripts

**Key Methods:**
```typescript
interface TranscriptManager {
  generateTranscript(debate: Debate): Transcript
  formatTranscript(transcript: Transcript, format: OutputFormat): string
  saveTranscript(transcript: Transcript): Promise<string>
  loadTranscript(id: string): Promise<Transcript>
}
```

### 5. CLI Interface

Handles user interaction through command-line interface.

**Responsibilities:**
- Accept user input for topics and configuration
- Display debate progress in real-time
- Show status indicators during model generation
- Present final transcript
- Handle user commands (start, configure, view history)

## Data Models

### Debate
```typescript
interface Debate {
  id: string
  topic: string
  config: DebateConfig
  affirmativeModel: AIModelProvider
  negativeModel: AIModelProvider
  state: DebateState
  rounds: DebateRound[]
  createdAt: Date
  completedAt?: Date
}
```

### DebateConfig
```typescript
interface DebateConfig {
  timeLimit?: number  // seconds per response
  wordLimit?: number  // max words per statement
  strictMode: boolean // validate on-topic responses
  showPreparation: boolean // display preparation phase
  numCrossExamQuestions: number // questions per side
}
```

### DebateState
```typescript
enum DebateState {
  INITIALIZED = 'initialized',
  PREPARATION = 'preparation',
  OPENING_STATEMENTS = 'opening_statements',
  REBUTTALS = 'rebuttals',
  CROSS_EXAMINATION = 'cross_examination',
  CLOSING_STATEMENTS = 'closing_statements',
  COMPLETED = 'completed',
  ERROR = 'error'
}
```

### DebateRound
```typescript
interface DebateRound {
  type: RoundType
  affirmativeStatement?: Statement
  negativeStatement?: Statement
  timestamp: Date
}

enum RoundType {
  PREPARATION = 'preparation',
  OPENING = 'opening',
  REBUTTAL = 'rebuttal',
  CROSS_EXAM = 'cross_exam',
  CLOSING = 'closing'
}
```

### Statement
```typescript
interface Statement {
  model: string
  position: Position
  content: string
  wordCount: number
  generatedAt: Date
}

enum Position {
  AFFIRMATIVE = 'affirmative',
  NEGATIVE = 'negative'
}
```

### DebateContext
```typescript
interface DebateContext {
  topic: string
  position: Position
  roundType: RoundType
  previousStatements: Statement[]
  preparationMaterial?: string
}
```

### Transcript
```typescript
interface Transcript {
  debate: Debate
  formattedRounds: FormattedRound[]
  summary: TranscriptSummary
}

interface TranscriptSummary {
  topic: string
  models: { affirmative: string; negative: string }
  totalDuration: number
  roundCount: number
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Topic validation correctly identifies non-empty topics
*For any* string input, the validation function should return true if and only if the string contains at least one non-whitespace character.
**Validates: Requirements 1.1, 1.4**

### Property 2: Topic storage round-trip
*For any* valid debate topic, storing the topic in a debate session and then retrieving it should return the exact same topic string.
**Validates: Requirements 1.2**

### Property 3: Model selection produces distinct models
*For any* set of available AI models with at least two models, the selection function should return two different models.
**Validates: Requirements 2.1**

### Property 4: Position assignment is complete and exclusive
*For any* two selected models, the position assignment should assign exactly one model to affirmative and exactly one model to negative, with no model assigned to both positions.
**Validates: Requirements 2.2**

### Property 5: Debate state machine follows correct sequence
*For any* debate execution, the state transitions should follow the exact sequence: INITIALIZED → PREPARATION → OPENING_STATEMENTS → REBUTTALS → CROSS_EXAMINATION → CLOSING_STATEMENTS → COMPLETED, with no states skipped or repeated.
**Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.6, 3.7**

### Property 6: Turn-taking within rounds is correct
*For any* debate round requiring both models to speak, the affirmative model should generate its statement before the negative model is prompted.
**Validates: Requirements 3.3**

### Property 7: Preparation materials are stored and retrievable
*For any* model's preparation output, storing the preparation materials and then retrieving them should return the same content.
**Validates: Requirements 4.3**

### Property 8: Context includes correct position indicator
*For any* statement generation request, the context provided to an affirmative model should indicate the affirmative position, and the context provided to a negative model should indicate the negative position.
**Validates: Requirements 5.1, 5.2**

### Property 9: Rebuttal context includes opponent's opening
*For any* rebuttal generation, the context should include the opposing model's opening statement.
**Validates: Requirements 5.3**

### Property 10: Closing context includes all previous statements
*For any* closing statement generation, the context should include all statements from preparation, opening, rebuttal, and cross-examination rounds.
**Validates: Requirements 5.4**

### Property 11: Cross-examination follows correct turn sequence
*For any* cross-examination round, the sequence should be: affirmative asks question → negative responds → negative asks question → affirmative responds.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 12: Cross-examination context includes opening and rebuttal
*For any* cross-examination question generation, the context should include both the opposing model's opening statement and rebuttal.
**Validates: Requirements 6.5**

### Property 13: Statement display includes required metadata
*For any* statement display, the output should include the model name, position (affirmative/negative), and round type.
**Validates: Requirements 7.2, 7.3**

### Property 14: Transcript contains all statements in order
*For any* completed debate, the generated transcript should contain all statements from all rounds in chronological order with no statements missing or duplicated.
**Validates: Requirements 8.1**

### Property 15: Transcript includes all required metadata
*For any* generated transcript, it should include the debate topic, both model names, their positions, preparation materials (if shown), and all statements.
**Validates: Requirements 8.2**

### Property 16: Transcript storage round-trip preserves data
*For any* transcript, saving it to storage and then loading it should return a transcript with identical content, formatting, and attribution.
**Validates: Requirements 8.4**

### Property 17: Model failures trigger error logging
*For any* model generation failure, the system should produce an error log entry and return an error notification.
**Validates: Requirements 9.1**

### Property 18: Timeouts trigger exactly one retry
*For any* model generation timeout, the system should attempt exactly one retry before reporting failure.
**Validates: Requirements 9.2**

### Property 19: Critical errors preserve partial transcripts
*For any* critical error during a debate, a partial transcript containing all statements generated before the error should be saved.
**Validates: Requirements 9.3**

### Property 20: Word limit enforcement
*For any* statement and word limit configuration, if the statement exceeds the word limit, it should be truncated or rejected according to the configuration.
**Validates: Requirements 10.2**

### Property 21: Invalid configuration falls back to defaults
*For any* invalid configuration parameter, the system should use the corresponding default value and include the parameter name in a notification to the user.
**Validates: Requirements 10.4**

## Error Handling

The system implements a multi-layered error handling strategy:

### 1. Input Validation Errors
- **Topic validation failures**: Return clear error messages indicating the topic is empty or invalid
- **Configuration validation failures**: Fall back to default values and notify user
- **Insufficient models**: Prevent debate initiation and explain the requirement

### 2. Runtime Errors
- **Model generation failures**: Log error, notify user, save partial transcript
- **Timeout errors**: Implement single retry with exponential backoff
- **Network errors**: Retry with backoff, then fail gracefully
- **State transition errors**: Log invalid transitions and prevent corruption

### 3. Error Recovery
- **Partial transcript preservation**: Always save progress before terminating
- **Graceful degradation**: Continue debate if one round fails (optional)
- **Error context**: Include debate state, current round, and model information in error logs

### 4. Error Reporting
All errors should include:
- Clear description of what went wrong
- Current debate state and round
- Affected model (if applicable)
- Suggested user actions (if any)

## Testing Strategy

The AI Debate System will employ a comprehensive testing approach combining unit tests and property-based tests to ensure correctness across all components.

### Property-Based Testing

We will use **fast-check** (for TypeScript/JavaScript) as our property-based testing library. Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Property Test Requirements:**
- Each test must be tagged with a comment explicitly referencing the correctness property from this design document
- Tag format: `// Feature: ai-debate-system, Property {number}: {property_text}`
- Each correctness property must be implemented by a single property-based test
- Tests should use smart generators that constrain inputs to valid ranges

**Key Property Tests:**
1. **Topic validation** (Property 1): Generate random strings including empty, whitespace-only, and valid topics
2. **Round-trip properties** (Properties 2, 7, 16): Test storage and retrieval of topics, preparation materials, and transcripts
3. **State machine** (Property 5): Generate random debate flows and verify state transitions
4. **Context construction** (Properties 8-10, 12): Generate debates and verify context includes required information
5. **Turn-taking** (Properties 6, 11): Verify correct ordering of model prompts
6. **Transcript completeness** (Properties 14, 15): Generate debates with varying numbers of rounds and verify all content is captured
7. **Error handling** (Properties 17-19): Inject failures and verify proper error handling
8. **Configuration** (Properties 20, 21): Generate valid and invalid configurations and verify enforcement

### Unit Testing

Unit tests will cover specific examples, edge cases, and integration points:

**Core Unit Tests:**
1. **Debate Orchestrator**: Test each state transition with specific scenarios
2. **Model Provider Interface**: Test response generation with mock providers
3. **Validator**: Test specific validation cases (empty strings, whitespace, special characters)
4. **Transcript Manager**: Test formatting with specific debate examples
5. **CLI Interface**: Test user input parsing and output formatting

**Edge Cases:**
- Zero available models
- One available model
- Empty preparation materials
- Very long statements (word limit boundary)
- Timeout scenarios
- Network failures during different rounds

**Integration Tests:**
- End-to-end debate flow with mock AI providers
- Transcript generation from complete debates
- Error recovery scenarios
- Configuration override behavior

### Test Organization

```
tests/
├── unit/
│   ├── orchestrator.test.ts
│   ├── validator.test.ts
│   ├── transcript.test.ts
│   └── providers/
│       ├── openai.test.ts
│       └── anthropic.test.ts
├── properties/
│   ├── topic-validation.property.test.ts
│   ├── state-machine.property.test.ts
│   ├── context-construction.property.test.ts
│   ├── transcript.property.test.ts
│   └── error-handling.property.test.ts
└── integration/
    ├── full-debate.test.ts
    └── error-recovery.test.ts
```

## Implementation Considerations

### 1. AI Model Integration

**Provider Selection:**
- Support OpenAI (GPT-4, GPT-3.5) and Anthropic (Claude) initially
- Design for easy addition of new providers
- Consider local model support (Ollama, LM Studio)

**Prompt Engineering:**
- Craft prompts that encourage substantive argumentation
- Include debate rules and format in system prompts
- Provide clear position indicators (affirmative vs negative)
- Structure context to include relevant previous statements

### 2. State Management

**Immutable State Pattern:**
- Each state transition creates new debate object
- Enables easy rollback and debugging
- Simplifies error recovery

**State Persistence:**
- Save state after each round completion
- Enable resume from interruption
- Support debate history browsing

### 3. Performance Considerations

**Concurrent Generation:**
- Preparation phase can run both models concurrently
- Reduces total debate time
- Requires careful synchronization

**Caching:**
- Cache model responses for replay/review
- Cache prepared materials for multiple debates on same topic
- Consider caching common validation results

### 4. User Experience

**Progress Indicators:**
- Show which model is "thinking"
- Display estimated time remaining
- Provide round progress (e.g., "Round 2 of 5")

**Formatting:**
- Use colors to distinguish positions
- Indent or box statements for clarity
- Add visual separators between rounds

**Interactivity:**
- Allow pausing between rounds
- Enable saving and resuming debates
- Support exporting in multiple formats (text, markdown, JSON)

### 5. Configuration Management

**Default Configuration:**
```typescript
const DEFAULT_CONFIG: DebateConfig = {
  timeLimit: 120, // 2 minutes per response
  wordLimit: 500, // reasonable statement length
  strictMode: false, // lenient by default
  showPreparation: true, // show research phase
  numCrossExamQuestions: 3 // 3 questions per side
}
```

**Configuration Sources:**
- Command-line arguments
- Configuration file (.debaterc)
- Environment variables
- Interactive prompts

### 6. Extensibility

**Plugin Architecture:**
- Allow custom model providers via plugin interface
- Support custom validators
- Enable custom transcript formatters
- Allow custom debate formats (beyond standard structure)

**Hooks:**
- Pre-round hooks (e.g., for logging, analytics)
- Post-round hooks (e.g., for saving, notifications)
- Error hooks (e.g., for custom error handling)

## Future Enhancements

Potential features for future iterations:

1. **Judging System**: Add AI or human judges to evaluate arguments
2. **Audience Participation**: Allow observers to vote or comment
3. **Multi-Model Debates**: Support more than two participants
4. **Debate Tournaments**: Organize multiple debates with rankings
5. **Argument Analysis**: Provide analysis of logical fallacies, evidence quality
6. **Real-time Fact-Checking**: Integrate fact-checking APIs
7. **Voice Output**: Text-to-speech for statements
8. **Web Interface**: Browser-based UI in addition to CLI
9. **Debate Templates**: Pre-configured formats for different debate styles
10. **Collaborative Debates**: Allow human-AI hybrid teams

## Security Considerations

1. **API Key Management**: Secure storage of provider API keys
2. **Rate Limiting**: Prevent abuse of AI model APIs
3. **Input Sanitization**: Validate and sanitize all user inputs
4. **Data Privacy**: Handle debate transcripts according to privacy requirements
5. **Cost Controls**: Implement spending limits for API usage

## Deployment

**Target Platforms:**
- macOS, Linux, Windows (cross-platform CLI)
- Node.js runtime (v18+)
- Package as npm package for easy installation

**Dependencies:**
- AI provider SDKs (OpenAI, Anthropic)
- CLI framework (Commander.js or similar)
- Testing frameworks (Jest, fast-check)
- Storage (file system initially, database optional)

**Distribution:**
```bash
npm install -g ai-debate-system
ai-debate "Should AI be regulated?"
```
