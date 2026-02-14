# AI Providers

The AI Debate System uses an interface-based approach to support multiple AI model providers.

## Provider Interface

All AI providers implement the `AIModelProvider` interface:

```typescript
interface AIModelProvider {
  generateResponse(prompt: string, context: DebateContext): Promise<string>;
  getModelName(): string;
  validateAvailability(): Promise<boolean>;
}
```

### Methods

| Method | Description |
|--------|-------------|
| `generateResponse()` | Generates a response given a prompt and debate context |
| `getModelName()` | Returns a human-readable name for the model |
| `validateAvailability()` | Checks if the provider is properly configured and available |

## Available Providers

### OpenAI Provider

Integrates with OpenAI's API for GPT models.

**Location:** `src/providers/OpenAIProvider.ts`

**Configuration:**
```typescript
interface OpenAIProviderConfig {
  apiKey: string;         // Required: OpenAI API key
  model?: string;         // Default: 'gpt-4'
  maxTokens?: number;     // Default: 1000
  temperature?: number;   // Default: 0.7
  timeout?: number;       // Default: 60000 (60 seconds)
  maxRetries?: number;    // Default: 2
}
```

**Usage:**
```typescript
import { OpenAIProvider } from './providers/OpenAIProvider';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
  temperature: 0.7
});
```

### Anthropic Provider

Integrates with Anthropic's API for Claude models.

**Location:** `src/providers/AnthropicProvider.ts`

**Configuration:**
```typescript
interface AnthropicProviderConfig {
  apiKey: string;         // Required: Anthropic API key
  model?: string;         // Default: 'claude-3-5-sonnet-20241022'
  maxTokens?: number;     // Default: 1000
  temperature?: number;   // Default: 0.7
  timeout?: number;       // Default: 60000 (60 seconds)
  maxRetries?: number;    // Default: 2
}
```

**Usage:**
```typescript
import { AnthropicProvider } from './providers/AnthropicProvider';

const provider = new AnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-20241022'
});
```

### Local Model Provider

Supports locally hosted models via Ollama or OpenAI-compatible APIs (e.g., LM Studio).

**Location:** `src/providers/LocalModelProvider.ts`

**Configuration:**
```typescript
interface LocalModelProviderConfig {
  baseUrl: string;        // Required: Base URL of the local server
  model: string;          // Required: Model name
  maxTokens?: number;     // Default: 1000
  temperature?: number;   // Default: 0.7
  timeout?: number;       // Default: 120000 (2 minutes)
  apiFormat?: 'ollama' | 'openai-compatible';  // Default: 'ollama'
}
```

**Usage with Ollama:**
```typescript
import { LocalModelProvider } from './providers/LocalModelProvider';

const provider = new LocalModelProvider({
  baseUrl: 'http://localhost:11434',
  model: 'llama2',
  apiFormat: 'ollama'
});
```

**Usage with LM Studio:**
```typescript
const provider = new LocalModelProvider({
  baseUrl: 'http://localhost:1234',
  model: 'local-model',
  apiFormat: 'openai-compatible'
});
```

### Mock Provider

For testing purposes, returns configurable mock responses.

**Location:** `src/providers/MockAIProvider.ts`

**Configuration:**
```typescript
const provider = new MockAIProvider(
  modelName: string = 'MockModel',
  options: {
    responses?: Map<string, string>;  // Specific responses for prompts
    defaultResponse?: string;          // Default response text
    available?: boolean;               // Simulate availability (default: true)
    shouldFail?: boolean;              // Force failures (default: false)
    failureMessage?: string;           // Custom failure message
    delayMs?: number;                  // Simulated latency (default: 0)
  }
);
```

**Features:**
- Configure specific responses for prompts, round types, or positions
- Simulate delays for testing timeout handling
- Force failures for error handling tests
- Track call count for verification

**Usage:**
```typescript
import { MockAIProvider } from './providers/MockAIProvider';

const mockProvider = new MockAIProvider('MockGPT', {
  defaultResponse: 'This is a mock response',
  delayMs: 100
});

// Set specific responses
mockProvider.setResponse('opening', 'My opening statement...');
mockProvider.setResponse('affirmative', 'Affirmative position response...');

// Simulate failures
mockProvider.setShouldFail(true, 'API rate limit exceeded');
```

## Provider Selection and Assignment

The system uses the `ModelSelection` utility to:
1. Select two distinct models from available providers
2. Randomly assign them to affirmative and negative positions

```typescript
import { selectAndAssignModels } from './utils/ModelSelection';

const { affirmativeModel, negativeModel } = selectAndAssignModels(availableModels);
```

## Common System Prompt

All providers use a similar system prompt structure that includes:
- The debate topic and model's position
- Current round type
- Debate guidelines and rules
- Previous statements for context
- Preparation materials (if available)

Example system prompt:
```
You are participating in a formal debate. You are arguing in favor of the topic: "AI should be regulated".

Your role is to present well-reasoned arguments, use evidence and logic, and engage constructively with opposing viewpoints.

Current round: opening
Your position: affirmative

Debate guidelines:
- Present clear, logical arguments
- Use evidence and reasoning to support your points
- Address counterarguments thoughtfully
- Maintain a respectful and professional tone
- Stay focused on the topic
```
