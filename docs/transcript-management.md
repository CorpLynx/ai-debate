# Transcript Management

The AI Debate System saves complete transcripts of debates for later review.

**Location:** `src/transcript/TranscriptManager.ts`

## Interface

```typescript
interface TranscriptManager {
  generateTranscript(debate: Debate): Transcript;
  formatTranscript(transcript: Transcript, format: OutputFormat): string;
  saveTranscript(transcript: Transcript): Promise<string>;
  loadTranscript(id: string): Promise<Transcript>;
}
```

## Implementation: TranscriptManagerImpl

### Constructor

```typescript
constructor(transcriptsDir: string = './transcripts')
```

Creates a transcript manager that saves files to the specified directory.

### Methods

#### generateTranscript()

Generates a complete transcript from a debate:
- Collects all rounds in chronological order
- Excludes preparation phase if `showPreparation` is false
- Calculates total duration
- Creates summary metadata

```typescript
const transcript = transcriptManager.generateTranscript(debate);
```

#### saveTranscript()

Saves a transcript as a JSON file:
- Creates the transcripts directory if it doesn't exist
- Uses the debate ID as the filename
- Returns the file path

```typescript
const filePath = await transcriptManager.saveTranscript(transcript);
// Returns: './transcripts/abc123-def456.json'
```

#### savePartialTranscript()

Saves a partial transcript when an error occurs:
- Generates a transcript from the current state
- Adds a `partial: true` marker
- Includes any logged errors
- Uses a `partial-` prefix in the filename

```typescript
const filePath = await transcriptManager.savePartialTranscript(debate);
// Returns: './transcripts/partial-abc123-def456.json'
```

#### loadTranscript()

Loads a previously saved transcript:
- Reads the JSON file
- Reconstructs the Transcript object
- Note: AI providers are replaced with placeholder objects

```typescript
const transcript = await transcriptManager.loadTranscript('abc123-def456');
```

## Transcript Structure

### Saved JSON Format

```json
{
  "debate": {
    "id": "abc123-def456",
    "topic": "Should AI be regulated?",
    "config": {
      "timeLimit": 120,
      "wordLimit": 500,
      "strictMode": false,
      "showPreparation": true,
      "numCrossExamQuestions": 3
    },
    "affirmativeModelName": "OpenAI-gpt-4",
    "negativeModelName": "Anthropic-claude-3-5-sonnet-20241022",
    "state": "completed",
    "rounds": [
      {
        "type": "preparation",
        "affirmativeStatement": {
          "model": "OpenAI-gpt-4",
          "position": "affirmative",
          "content": "...",
          "wordCount": 245,
          "generatedAt": "2024-01-15T10:30:00.000Z"
        },
        "negativeStatement": {
          "model": "Anthropic-claude-3-5-sonnet-20241022",
          "position": "negative",
          "content": "...",
          "wordCount": 238,
          "generatedAt": "2024-01-15T10:30:05.000Z"
        },
        "timestamp": "2024-01-15T10:30:05.000Z"
      }
      // ... more rounds
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "completedAt": "2024-01-15T10:45:00.000Z"
  },
  "formattedRounds": [
    {
      "roundType": "preparation",
      "affirmativeContent": "...",
      "negativeContent": "...",
      "timestamp": "2024-01-15T10:30:05.000Z"
    }
    // ... more rounds
  ],
  "summary": {
    "topic": "Should AI be regulated?",
    "models": {
      "affirmative": "OpenAI-gpt-4",
      "negative": "Anthropic-claude-3-5-sonnet-20241022"
    },
    "totalDuration": 900,
    "roundCount": 5
  }
}
```

### Partial Transcript Format

Partial transcripts include additional fields:

```json
{
  "partial": true,
  "errors": [
    {
      "timestamp": "2024-01-15T10:35:00.000Z",
      "message": "API rate limit exceeded",
      "state": "rebuttals",
      "round": "rebuttal",
      "model": "OpenAI-gpt-4"
    }
  ],
  // ... rest of transcript
}
```

## File Storage

### Default Location

Transcripts are saved to `./transcripts/` by default.

### File Naming

- Complete transcripts: `{debate-id}.json`
- Partial transcripts: `partial-{debate-id}.json`

### Example Files

```
transcripts/
├── abc123-def456.json                    # Complete debate
├── partial-xyz789-abc123.json            # Partial (error occurred)
└── ...
```

## Usage Examples

### Saving After Debate Completion

```typescript
const transcriptManager = new TranscriptManagerImpl();

// Run debate...
const completedDebate = await orchestrator.completeDebate(debate);

// Generate and save transcript
const transcript = transcriptManager.generateTranscript(completedDebate);
const filePath = await transcriptManager.saveTranscript(transcript);

console.log(`Transcript saved to: ${filePath}`);
```

### Saving on Error

```typescript
try {
  debate = await orchestrator.executeRebuttals(debate);
} catch (error) {
  // Save partial transcript
  const filePath = await transcriptManager.savePartialTranscript(debate);
  console.error(`Error occurred. Partial transcript saved to: ${filePath}`);
  throw error;
}
```

### Loading a Transcript

```typescript
const transcript = await transcriptManager.loadTranscript('abc123-def456');

console.log(`Topic: ${transcript.summary.topic}`);
console.log(`Duration: ${transcript.summary.totalDuration}s`);
console.log(`Rounds: ${transcript.summary.roundCount}`);

for (const round of transcript.formattedRounds) {
  console.log(`\n--- ${round.roundType} ---`);
  console.log(`Affirmative: ${round.affirmativeContent}`);
  console.log(`Negative: ${round.negativeContent}`);
}
```

## Notes

- The `formatTranscript()` method is declared in the interface but not yet implemented in `TranscriptManagerImpl`
- AI provider instances are not serialized; only their names are saved
- When loading transcripts, AI providers are replaced with placeholder mock objects
