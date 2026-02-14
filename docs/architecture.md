# Architecture

## System Architecture

The AI Debate System follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLI Layer                               │
│                    (src/cli/index.ts)                           │
├─────────────────────────────────────────────────────────────────┤
│                      Orchestrator Layer                          │
│               (src/orchestrator/DebateOrchestrator.ts)          │
├─────────────────────────────────────────────────────────────────┤
│                       Service Layer                              │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│   │ TranscriptMgr │  │   Validator   │  │   Formatter   │       │
│   └───────────────┘  └───────────────┘  └───────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                     AI Provider Layer                            │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│   │  OpenAI   │  │ Anthropic │  │   Local   │  │   Mock    │   │
│   │ Provider  │  │  Provider │  │  Provider │  │ Provider  │   │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       Model Layer                                │
│      (Debate, Statement, Position, RoundType, etc.)             │
└─────────────────────────────────────────────────────────────────┘
```

## Component Overview

### CLI Layer (`src/cli/`)
Entry point for the application. Handles:
- Command-line argument parsing
- Model initialization and configuration
- Progress display during debates
- Transcript export

### Orchestrator Layer (`src/orchestrator/`)
Core business logic that:
- Manages debate state machine
- Coordinates round execution
- Builds context for AI prompts
- Handles error recovery

### Service Layer (`src/utils/`, `src/transcript/`, `src/validators/`)
Supporting services:
- **TranscriptManager**: Generates and saves debate transcripts
- **DebateValidator**: Validates topics and configurations
- **ConfigurationManager**: Merges configuration from multiple sources
- **ErrorLogger**: Logs and formats errors
- **StatementFormatter**: Formats statements for display

### AI Provider Layer (`src/providers/`)
Abstraction for AI model integrations:
- **AIModelProvider**: Interface defining the contract
- **OpenAIProvider**: OpenAI/GPT integration
- **AnthropicProvider**: Anthropic/Claude integration
- **LocalModelProvider**: Ollama/LM Studio integration
- **MockAIProvider**: Testing mock provider

### Model Layer (`src/models/`)
TypeScript interfaces and enums defining the domain model.

## Data Flow

```
User Input (CLI)
      │
      ▼
┌─────────────────┐
│  Parse Config   │ ──▶ ConfigurationManager
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Initialize      │
│ AI Providers    │ ──▶ OpenAI/Anthropic/Local/Mock
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Debate   │ ──▶ DebateOrchestrator.initializeDebate()
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute Rounds  │ ──▶ Preparation → Opening → Rebuttal →
│                 │     Cross-Exam → Closing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate        │ ──▶ TranscriptManager
│ Transcript      │
└────────┬────────┘
         │
         ▼
   Save to File
```

## State Machine

The debate follows a strict state machine:

```
INITIALIZED ──▶ PREPARATION ──▶ OPENING_STATEMENTS ──▶ REBUTTALS
                                                           │
                                                           ▼
                                               CROSS_EXAMINATION
                                                           │
                                                           ▼
                                               CLOSING_STATEMENTS
                                                           │
                                                           ▼
                                                     COMPLETED

Any state ──────────────────────────────────────▶ ERROR
```

Valid transitions are enforced by the orchestrator using the `VALID_TRANSITIONS` map.

## Key Design Decisions

1. **Immutable State Updates**: Debate state is updated by creating new objects rather than mutating existing ones
2. **Interface-based Providers**: AI providers implement a common interface for extensibility
3. **Centralized Prompt Templates**: All AI prompts are managed in `PromptTemplates.ts`
4. **Property-based Testing**: Uses fast-check for robust testing
5. **Graceful Error Recovery**: Partial transcripts saved on critical errors
