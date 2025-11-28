# Debate Orchestrator

The `DebateOrchestrator` is the core component that manages the debate lifecycle.

**Location:** `src/orchestrator/DebateOrchestrator.ts`

## Interface

```typescript
interface DebateOrchestrator {
  initializeDebate(
    topic: string, 
    config: DebateConfig, 
    affirmativeModel: AIModelProvider, 
    negativeModel: AIModelProvider
  ): Debate;
  
  executePreparation(debate: Debate): Promise<Debate>;
  executeOpeningStatements(debate: Debate): Promise<Debate>;
  executeRebuttals(debate: Debate): Promise<Debate>;
  executeCrossExamination(debate: Debate): Promise<Debate>;
  executeClosingStatements(debate: Debate): Promise<Debate>;
  getCurrentState(debate: Debate): DebateState;
}
```

## Implementation: DebateOrchestratorImpl

### Constructor

```typescript
constructor(transcriptsDir?: string)
```

Creates an orchestrator with:
- A `DebateValidator` for topic/config validation
- A `TranscriptManagerImpl` for saving transcripts
- A `ConfigurationManager` for handling configuration

### Methods

#### initializeDebate()

Initializes a new debate:
1. Validates the topic (must have at least one non-whitespace character)
2. Creates a new Debate object with a UUID
3. Sets the initial state to `INITIALIZED`
4. Stores the topic and configuration

**Throws:** Error if the topic is invalid

#### executePreparation()

Executes the preparation phase:
1. Validates the state transition (must be `INITIALIZED` → `PREPARATION`)
2. Builds context for both models
3. Generates preparation prompts using `PromptTemplates`
4. Calls both models concurrently to generate preparation materials
5. Creates and stores the preparation round
6. Transitions state to `PREPARATION`

#### executeOpeningStatements()

Executes opening statements:
1. Validates state transition (`PREPARATION` → `OPENING_STATEMENTS`)
2. Affirmative model goes first (per debate protocol)
3. Then negative model generates their opening
4. Stores both statements in the opening round
5. Transitions state to `OPENING_STATEMENTS`

#### executeRebuttals()

Executes rebuttals:
1. Validates state transition (`OPENING_STATEMENTS` → `REBUTTALS`)
2. Retrieves opponent's opening statement for context
3. Each model responds to their opponent's opening
4. Stores rebuttal statements
5. Transitions state to `REBUTTALS`

#### executeCrossExamination()

Executes cross-examination:
1. Validates state transition (`REBUTTALS` → `CROSS_EXAMINATION`)
2. Includes opponent's opening and rebuttal in context
3. Follows the sequence:
   - Affirmative poses question
   - Negative responds
   - Negative poses question
   - Affirmative responds
4. Stores combined Q&A in statements
5. Transitions state to `CROSS_EXAMINATION`

#### executeClosingStatements()

Executes closing statements:
1. Validates state transition (`CROSS_EXAMINATION` → `CLOSING_STATEMENTS`)
2. Includes all previous statements in context
3. Both models generate closing statements
4. Stores closing statements
5. Transitions state to `CLOSING_STATEMENTS`

#### completeDebate()

Marks the debate as completed:
1. Validates state transition (`CLOSING_STATEMENTS` → `COMPLETED`)
2. Sets `completedAt` timestamp
3. Transitions state to `COMPLETED`

## Context Building

The `buildContext()` method constructs the `DebateContext` for each prompt:

| Round Type | Previous Statements Included |
|------------|------------------------------|
| PREPARATION | None |
| OPENING | None (only preparation materials) |
| REBUTTAL | Opponent's opening statement |
| CROSS_EXAM | Opponent's opening and rebuttal |
| CLOSING | All previous statements from both sides |

## State Transitions

Valid state transitions are strictly enforced:

```typescript
const VALID_TRANSITIONS = new Map([
  [DebateState.INITIALIZED, [DebateState.PREPARATION]],
  [DebateState.PREPARATION, [DebateState.OPENING_STATEMENTS]],
  [DebateState.OPENING_STATEMENTS, [DebateState.REBUTTALS]],
  [DebateState.REBUTTALS, [DebateState.CROSS_EXAMINATION]],
  [DebateState.CROSS_EXAMINATION, [DebateState.CLOSING_STATEMENTS]],
  [DebateState.CLOSING_STATEMENTS, [DebateState.COMPLETED]],
  [DebateState.COMPLETED, []],
  [DebateState.ERROR, []]
]);
```

Invalid transitions throw an error with a descriptive message.

## Error Handling

The orchestrator implements robust error handling:

### Retry Logic
- First attempt with configured timeout
- On timeout, retry with 1.5x the original timeout
- If retry fails, throw error

### Error Logging
All errors are logged with:
- Debate ID
- Current state
- Round type (if applicable)
- Model name (if applicable)
- Error message

### Partial Transcript Recovery
On critical errors:
1. The error is logged to the debate
2. A partial transcript is saved with a `partial-` prefix
3. The debate transitions to `ERROR` state

## Word Limit Enforcement

If a `wordLimit` is configured:
1. Responses are checked after generation
2. Responses exceeding the limit are truncated
3. A warning is logged indicating the truncation

```typescript
// Example output
Response exceeded word limit of 500, truncated from 752 to 500 words
```

## Usage Example

```typescript
import { DebateOrchestratorImpl } from './orchestrator/DebateOrchestrator';
import { DEFAULT_CONFIG } from './models/DebateConfig';

const orchestrator = new DebateOrchestratorImpl();

// Initialize
let debate = orchestrator.initializeDebate(
  'Should AI be regulated?',
  DEFAULT_CONFIG,
  affirmativeModel,
  negativeModel
);

// Execute all rounds
debate = await orchestrator.executePreparation(debate);
debate = await orchestrator.executeOpeningStatements(debate);
debate = await orchestrator.executeRebuttals(debate);
debate = await orchestrator.executeCrossExamination(debate);
debate = await orchestrator.executeClosingStatements(debate);
debate = await orchestrator.completeDebate(debate);

console.log(`Debate completed: ${debate.state}`);
```
