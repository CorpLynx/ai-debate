# Testing

The AI Debate System has extensive test coverage using Jest and property-based testing with fast-check.

## Test Structure

```
tests/
├── unit/                 # Unit tests for individual components
├── integration/          # Integration tests (currently empty)
├── properties/           # Property-based tests
└── setup.test.ts         # Test setup file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=topic-validation
```

## Test Types

### Unit Tests

Located in `tests/unit/`, these test individual components in isolation.

**Files:**
- `AnthropicProvider.test.ts` - Anthropic provider tests
- `OpenAIProvider.test.ts` - OpenAI provider tests
- `LocalModelProvider.test.ts` - Local model provider tests
- `MockAIProvider.test.ts` - Mock provider tests
- `StatementFormatter.test.ts` - Statement formatting tests
- `ConfigurationManager.file.test.ts` - Config file loading tests
- `TranscriptManager.showPreparation.test.ts` - Transcript filtering tests
- `DebateOrchestrator.closing.test.ts` - Closing statements tests
- `DebateOrchestrator.rebuttals.test.ts` - Rebuttals tests
- `DebateOrchestrator.wordlimit.test.ts` - Word limit enforcement tests
- `cli.test.ts` - CLI tests

### Property-Based Tests

Located in `tests/properties/`, these use fast-check to generate random test cases.

**Files:**
- `topic-validation.property.test.ts` - Topic validation properties
- `debate-initialization.property.test.ts` - Debate initialization properties
- `state-machine.property.test.ts` - State transition properties
- `model-selection.property.test.ts` - Model selection properties
- `context-construction.property.test.ts` - Context building properties
- `preparation-materials.property.test.ts` - Preparation phase properties
- `turn-taking.property.test.ts` - Turn order properties
- `word-limit.property.test.ts` - Word limit properties
- `config-fallback.property.test.ts` - Configuration fallback properties
- `error-logging.property.test.ts` - Error logging properties
- `retry-logic.property.test.ts` - Retry logic properties
- `partial-transcript.property.test.ts` - Partial transcript properties
- `transcript-completeness.property.test.ts` - Transcript completeness properties
- `transcript-metadata.property.test.ts` - Transcript metadata properties
- `transcript-storage.property.test.ts` - Transcript storage properties
- `statement-display.property.test.ts` - Statement display properties

## Property-Based Testing

### Overview

Property-based tests define properties that should hold true for all possible inputs. The fast-check library generates random inputs to verify these properties.

### Configuration

`tests/properties/fast-check-setup.test.ts` contains shared configuration:

```typescript
import * as fc from 'fast-check';

// Custom arbitraries for debate domain
export const topicArbitrary = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);
export const positionArbitrary = fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE);
export const roundTypeArbitrary = fc.constantFrom(...Object.values(RoundType));
```

### Example Property Test

```typescript
describe('Topic Validation', () => {
  it('should reject empty topics', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim().length === 0),
        (emptyTopic) => {
          const result = validator.validateTopic(emptyTopic);
          return !result.isValid;
        }
      )
    );
  });

  it('should accept non-empty topics', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (validTopic) => {
          const result = validator.validateTopic(validTopic);
          return result.isValid;
        }
      )
    );
  });
});
```

## Mocking

### AI Provider Mocking

Use `MockAIProvider` for testing without real API calls:

```typescript
const mockProvider = new MockAIProvider('TestModel', {
  defaultResponse: 'Test response',
  delayMs: 100
});

// Configure specific responses
mockProvider.setResponse('opening', 'My opening statement...');

// Simulate failures
mockProvider.setShouldFail(true, 'API error');

// Check call count
expect(mockProvider.getCallCount()).toBe(3);
```

### File System Mocking

For tests involving file operations, use temporary directories:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debate-test-'));
const transcriptManager = new TranscriptManagerImpl(tmpDir);

// Clean up after tests
afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true });
});
```

## Test Coverage Areas

### Covered Features

- Topic validation (empty, whitespace, valid)
- Configuration merging and validation
- State machine transitions (valid and invalid)
- Model selection and position assignment
- Context construction for each round type
- Statement formatting with colors
- Word limit enforcement
- Error logging and formatting
- Retry logic with timeouts
- Partial transcript recovery
- Transcript generation and storage
- CLI argument parsing

### Property Invariants Tested

1. **Topic Validation**: Empty topics are rejected, non-empty topics are accepted
2. **State Transitions**: Only valid transitions are allowed
3. **Model Selection**: Exactly 2 models selected, positions randomly assigned
4. **Turn Order**: Affirmative always goes before negative
5. **Context Building**: Correct statements included for each round type
6. **Word Limits**: Responses exceeding limits are truncated
7. **Config Fallback**: Invalid configs fall back to defaults
8. **Transcript Completeness**: All statements present, no duplicates
9. **Error Logging**: Errors contain required fields

## Running Specific Tests

```bash
# Run property tests only
npm test -- --testPathPattern=properties

# Run unit tests only
npm test -- --testPathPattern=unit

# Run a specific test file
npm test -- topic-validation.property.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should reject empty topics"
```

## Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run with coverage
npm test -- --coverage

# Run in debug mode (with Node inspector)
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Current Test Status

As of the current state, tests may fail due to:
- Missing `formatTranscript()` implementation in `TranscriptManagerImpl`
- TypeScript compilation errors preventing test execution

See [Current Status](./current-status.md) for details on known issues.
