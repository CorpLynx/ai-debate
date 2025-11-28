# CLI Interface

The AI Debate System provides a command-line interface for running debates.

**Location:** `src/cli/index.ts`

## Usage

```bash
# Using npm run
npm run cli -- "<topic>" [options]

# Using the built binary
./dist/cli/index.js "<topic>" [options]

# Using npx with ts-node (development)
npx ts-node src/cli/index.ts "<topic>" [options]
```

## Command Syntax

```
ai-debate <topic> [options]
```

### Arguments

| Argument | Description |
|----------|-------------|
| `<topic>` | The debate topic or proposition (required) |

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `-c, --config <path>` | Path to configuration file | `./.debaterc` |
| `-t, --time-limit <seconds>` | Maximum time per response in seconds | 120 |
| `-w, --word-limit <words>` | Maximum words per statement | 500 |
| `-s, --strict-mode` | Enable strict mode (validate on-topic responses) | false |
| `--no-show-preparation` | Hide preparation phase from display | (shows by default) |
| `-q, --cross-exam-questions <number>` | Number of cross-examination questions per side | 3 |
| `--mock` | Use mock AI providers for testing | false |
| `--openai-key <key>` | OpenAI API key | `$OPENAI_API_KEY` |
| `--anthropic-key <key>` | Anthropic API key | `$ANTHROPIC_API_KEY` |
| `--export <format>` | Export transcript format (text, markdown, json) | text |
| `-V, --version` | Output the version number | |
| `-h, --help` | Display help for command | |

## Examples

### Basic Usage

```bash
# Run a debate with mock providers (for testing)
npm run cli -- "Should artificial intelligence be regulated?" --mock

# Run a debate with real AI providers
npm run cli -- "Is remote work better than office work?" \
  --openai-key sk-... \
  --anthropic-key sk-ant-...
```

### With Configuration

```bash
# Use custom word and time limits
npm run cli -- "Should social media be age-restricted?" \
  --word-limit 300 \
  --time-limit 60 \
  --mock

# Use strict mode
npm run cli -- "Is nuclear energy safe?" \
  --strict-mode \
  --mock
```

### Using Environment Variables

```bash
# Set API keys in environment
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

# Run without explicit keys
npm run cli -- "Should space exploration be prioritized?"
```

## Output Display

The CLI provides colorful, structured output:

### Topic Confirmation
```
🎯 Debate Topic: Should AI be regulated?
```

### Model Assignments
```
📋 Model Assignments:
   Affirmative: OpenAI-gpt-4
   Negative: Anthropic-claude-3-5-sonnet-20241022
```

### Configuration Display
```
⚙️  Configuration:
   Time Limit: 120s per response
   Word Limit: 500 words per statement
   Strict Mode: Disabled
   Show Preparation: Yes
   Cross-Exam Questions: 3 per side
```

### Round Headers
```
🔬 Preparation Phase
════════════════════════════════════════════════════════════════════════════════

📢 Opening Statements
════════════════════════════════════════════════════════════════════════════════

🔄 Rebuttals
════════════════════════════════════════════════════════════════════════════════

❓ Cross-Examination
════════════════════════════════════════════════════════════════════════════════

🎬 Closing Statements
════════════════════════════════════════════════════════════════════════════════
```

### Statement Display

Statements are displayed with:
- Colored headers (cyan for affirmative, magenta for negative)
- Model name and position
- Round type indicator
- Indented content
- Separator lines

```
────────────────────────────────────────────────────────────────────────────────
Opening Statement
Model: OpenAI-gpt-4
Position: Affirmative
────────────────────────────────────────────────────────────────────────────────

  [Statement content here...]

────────────────────────────────────────────────────────────────────────────────
```

### Thinking Indicator

While a model is generating:
```
[Opening Statement]
Affirmative (OpenAI-gpt-4) is thinking...
```

### Completion and Summary
```
✅ Debate Completed!
════════════════════════════════════════════════════════════════════════════════

💾 Transcript saved to: ./transcripts/abc123-def456.json

📊 Debate Summary:
   Topic: Should AI be regulated?
   Affirmative: OpenAI-gpt-4
   Negative: Anthropic-claude-3-5-sonnet-20241022
   Duration: 245s
   Rounds: 5
```

## Error Handling

### Configuration Warnings
```
⚠️  Configuration Warnings:
   Invalid value for wordLimit, using default: 500
```

### Runtime Errors
```
❌ Error: At least 2 AI models are required to conduct a debate.
   Please configure API keys or use --mock flag.
```

### Partial Transcript Recovery
```
❌ Debate encountered an error: API rate limit exceeded

💾 Attempting to save partial transcript...
✅ Partial transcript saved to: ./transcripts/partial-abc123.json
```

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Successful completion |
| 1 | Error occurred |
