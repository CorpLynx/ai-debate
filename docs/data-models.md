# Data Models

All data models are defined as TypeScript interfaces and enums in the `src/models/` directory.

## Core Models

### Debate

The main entity representing a debate session.

```typescript
interface Debate {
  id: string;                     // Unique identifier (UUID)
  topic: string;                  // The debate topic/proposition
  config: DebateConfig;           // Configuration settings
  affirmativeModel: AIModelProvider;  // Model arguing in favor
  negativeModel: AIModelProvider;     // Model arguing against
  state: DebateState;             // Current state in the debate lifecycle
  rounds: DebateRound[];          // All completed rounds
  createdAt: Date;                // When the debate was initialized
  completedAt?: Date;             // When the debate was completed (if applicable)
  errors?: DebateError[];         // Any errors that occurred
}
```

### DebateConfig

Configuration options for a debate.

```typescript
interface DebateConfig {
  timeLimit?: number;         // Seconds per response (default: 120)
  wordLimit?: number;         // Max words per statement (default: 500)
  strictMode: boolean;        // Validate on-topic responses (default: false)
  showPreparation: boolean;   // Display preparation phase (default: true)
  numCrossExamQuestions: number;  // Questions per side (default: 3)
}
```

**Default Configuration:**
```typescript
const DEFAULT_CONFIG = {
  timeLimit: 120,
  wordLimit: 500,
  strictMode: false,
  showPreparation: true,
  numCrossExamQuestions: 3
};
```

### DebateRound

Represents a single round in the debate.

```typescript
interface DebateRound {
  type: RoundType;                    // Type of round
  affirmativeStatement?: Statement;   // Statement from affirmative side
  negativeStatement?: Statement;      // Statement from negative side
  timestamp: Date;                    // When the round occurred
}
```

### Statement

A single statement made by an AI model.

```typescript
interface Statement {
  model: string;        // Name of the model that generated this
  position: Position;   // AFFIRMATIVE or NEGATIVE
  content: string;      // The actual statement text
  wordCount: number;    // Word count of the content
  generatedAt: Date;    // When the statement was generated
}
```

## Enums

### Position

The side an AI model is arguing for.

```typescript
enum Position {
  AFFIRMATIVE = 'affirmative',  // Arguing in favor of the topic
  NEGATIVE = 'negative'         // Arguing against the topic
}
```

### RoundType

Types of rounds in a debate.

```typescript
enum RoundType {
  PREPARATION = 'preparation',    // Research and argument preparation
  OPENING = 'opening',            // Opening statements
  REBUTTAL = 'rebuttal',          // Rebuttals to opponent's opening
  CROSS_EXAM = 'cross_exam',      // Cross-examination Q&A
  CLOSING = 'closing'             // Closing statements
}
```

### DebateState

The lifecycle states of a debate.

```typescript
enum DebateState {
  INITIALIZED = 'initialized',              // Debate created, not started
  PREPARATION = 'preparation',              // Preparation phase complete
  OPENING_STATEMENTS = 'opening_statements', // Opening statements complete
  REBUTTALS = 'rebuttals',                  // Rebuttals complete
  CROSS_EXAMINATION = 'cross_examination',  // Cross-examination complete
  CLOSING_STATEMENTS = 'closing_statements', // Closing statements complete
  COMPLETED = 'completed',                  // Debate finished successfully
  ERROR = 'error'                           // Critical error occurred
}
```

## Supporting Models

### DebateContext

Context provided to AI models when generating statements.

```typescript
interface DebateContext {
  topic: string;                      // The debate topic
  position: Position;                 // This model's position
  roundType: RoundType;               // Current round type
  previousStatements: Statement[];    // Relevant prior statements
  preparationMaterial?: string;       // Model's preparation notes
}
```

### DebateError

Records an error that occurred during a debate.

```typescript
interface DebateError {
  timestamp: Date;          // When the error occurred
  message: string;          // Error message
  state: DebateState;       // State when error occurred
  round?: RoundType;        // Round when error occurred (if applicable)
  model?: string;           // Model that caused error (if applicable)
  originalError?: Error;    // The underlying Error object
}
```

### ValidationResult

Result of a validation operation.

```typescript
interface ValidationResult {
  isValid: boolean;         // Whether validation passed
  errors: string[];         // List of error messages
  invalidParams?: string[]; // Names of invalid parameters
}
```

## Transcript Models

### Transcript

A complete transcript of a debate.

```typescript
interface Transcript {
  debate: Debate;                     // The full debate object
  formattedRounds: FormattedRound[];  // Formatted round data
  summary: TranscriptSummary;         // Summary information
}
```

### TranscriptSummary

Summary metadata for a transcript.

```typescript
interface TranscriptSummary {
  topic: string;                      // Debate topic
  models: {
    affirmative: string;              // Affirmative model name
    negative: string;                 // Negative model name
  };
  totalDuration: number;              // Total debate duration (seconds)
  roundCount: number;                 // Number of rounds
}
```

### FormattedRound

A formatted representation of a debate round.

```typescript
interface FormattedRound {
  roundType: string;              // Type of round
  affirmativeContent?: string;    // Affirmative statement content
  negativeContent?: string;       // Negative statement content
  timestamp: Date;                // When the round occurred
}
```

### OutputFormat

Available transcript output formats.

```typescript
enum OutputFormat {
  TEXT = 'text',
  MARKDOWN = 'markdown',
  JSON = 'json'
}
```
