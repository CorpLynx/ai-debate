# Configuration

The AI Debate System supports configuration from multiple sources with a defined precedence order.

## Configuration Sources

Configuration is loaded from multiple sources with the following precedence (highest to lowest):

1. **CLI flags** - Command-line arguments
2. **Environment variables** - `DEBATE_*` prefixed variables
3. **Configuration file** - `.debaterc` JSON file
4. **Default values** - Built-in defaults

Higher precedence values override lower precedence values.

## Configuration File

Create a `.debaterc` file in the project root (or specify a custom path with `--config`).

### Format

```json
{
  "timeLimit": 60,
  "wordLimit": 300,
  "strictMode": false,
  "showPreparation": true,
  "numCrossExamQuestions": 3
}
```

### Example Configuration

See `.debaterc.example` for a sample configuration file.

## Environment Variables

| Variable | Description | Type |
|----------|-------------|------|
| `DEBATE_TIME_LIMIT` | Seconds per response | number |
| `DEBATE_WORD_LIMIT` | Max words per statement | number |
| `DEBATE_STRICT_MODE` | Enable strict validation | "true" or "false" |
| `DEBATE_SHOW_PREPARATION` | Show preparation phase | "true" or "false" |
| `DEBATE_CROSS_EXAM_QUESTIONS` | Questions per cross-exam | number |
| `OPENAI_API_KEY` | OpenAI API key | string |
| `ANTHROPIC_API_KEY` | Anthropic API key | string |

### Example

```bash
export DEBATE_TIME_LIMIT=60
export DEBATE_WORD_LIMIT=300
export DEBATE_STRICT_MODE=true
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

## Configuration Options

### timeLimit

**Type:** `number` (positive, finite)  
**Default:** `120`  
**Description:** Maximum time in seconds allowed for each model response. If a response takes longer, the request is retried with a longer timeout.

### wordLimit

**Type:** `number` (positive integer)  
**Default:** `500`  
**Description:** Maximum words allowed per statement. Responses exceeding this limit are truncated with `...` appended.

### strictMode

**Type:** `boolean`  
**Default:** `false`  
**Description:** When enabled, validates that responses stay on-topic. Off-topic responses may be rejected or flagged.

### showPreparation

**Type:** `boolean`  
**Default:** `true`  
**Description:** Whether to display the preparation phase in the output and include it in transcripts.

### numCrossExamQuestions

**Type:** `number` (non-negative integer)  
**Default:** `3`  
**Description:** Number of cross-examination questions each side can ask. Currently, the system processes one question-answer exchange per side.

## Configuration Manager

The `ConfigurationManager` class handles configuration:

**Location:** `src/utils/ConfigurationManager.ts`

### Methods

#### loadAndMerge()

Loads and merges configuration from all sources:

```typescript
loadAndMerge(
  cliConfig: Partial<DebateConfig> = {}, 
  configPath?: string
): ConfigurationResult
```

Returns:
```typescript
interface ConfigurationResult {
  config: DebateConfig;    // Merged final configuration
  warnings: string[];      // Warning messages for invalid values
  invalidParams: string[]; // Names of invalid parameters
}
```

#### loadFromFile()

Loads configuration from a JSON file:

```typescript
loadFromFile(configPath?: string): Partial<DebateConfig>
```

Returns an empty object if the file doesn't exist or is invalid.

#### loadFromEnv()

Loads configuration from environment variables:

```typescript
loadFromEnv(): Partial<DebateConfig>
```

#### mergeAndValidate()

Merges user configuration with defaults and validates:

```typescript
mergeAndValidate(userConfig: Partial<DebateConfig> = {}): ConfigurationResult
```

### Validation Rules

| Parameter | Validation Rules |
|-----------|-----------------|
| `timeLimit` | Must be a positive, finite number |
| `wordLimit` | Must be a positive integer |
| `strictMode` | Must be a boolean |
| `showPreparation` | Must be a boolean |
| `numCrossExamQuestions` | Must be a non-negative integer |

### Fallback Behavior

When an invalid value is provided:
1. A warning is generated
2. The default value is used instead
3. The invalid parameter name is tracked

Example warning:
```
Invalid value for wordLimit, using default: 500
```

## Usage Examples

### Programmatic Usage

```typescript
import { ConfigurationManager } from './utils/ConfigurationManager';
import { DEFAULT_CONFIG } from './models/DebateConfig';

const configManager = new ConfigurationManager();

// Load from all sources
const result = configManager.loadAndMerge(
  { wordLimit: 300 },  // CLI overrides
  './.debaterc'        // Config file path
);

// Check for warnings
if (result.warnings.length > 0) {
  console.warn('Configuration warnings:', result.warnings);
}

// Use the merged configuration
console.log('Final config:', result.config);
```

### CLI Usage

```bash
# Override specific settings
npm run cli -- "Topic" --word-limit 300 --time-limit 60

# Use a custom config file
npm run cli -- "Topic" --config ./custom-config.json

# Combine with environment variables
DEBATE_STRICT_MODE=true npm run cli -- "Topic" --word-limit 300
```
