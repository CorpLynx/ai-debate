# AI Debate System

A system for orchestrating formal debates between AI models with dynamic personality profiles and diverse argumentation styles.

## Features

- **Dynamic Personality System**: Debaters exhibit unique behavioral characteristics across four dimensions (civility, manner, research depth, rhetoric usage)
- **Debate Tactics**: Support for various argumentation strategies including Gish Gallop, Strawman, Appeal to Emotion, and more
- **Multiple AI Providers**: Support for OpenAI, Anthropic, and local models
- **Rich Formatting**: Enhanced terminal output with colors, animations, and rich text
- **Flexible Configuration**: Extensive customization through configuration files and environment variables
- **Property-Based Testing**: Comprehensive test coverage ensuring correctness

## Documentation

- **[Personality System Guide](docs/personality-system.md)** - Complete guide to personality dimensions, traits, and how they affect debates
- **[Debate Tactics Reference](docs/debate-tactics-reference.md)** - Detailed reference for all debate tactics with examples and usage guidelines
- **[Personality Examples](docs/personality-examples.md)** - Ready-to-use personality configurations and complete debate scenarios
- **[Error Handling](docs/error-handling-implementation.md)** - Error handling patterns and best practices
- **[Configuration Guide](docs/configuration-error-handling.md)** - Configuration management and troubleshooting

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Quick Start

### Basic Debate

```typescript
import { DebateOrchestrator } from './orchestrator/DebateOrchestrator';
import { PersonalityGenerator } from './utils/PersonalityGenerator';

const orchestrator = new DebateOrchestrator();
const generator = new PersonalityGenerator();

// Create a debate with random personalities
const debate = await orchestrator.initializeDebate({
  topic: "Should artificial intelligence be regulated?",
  affirmativePersonality: generator.generateRandom(),
  negativePersonality: generator.generateRandom()
});

await orchestrator.runDebate(debate);
```

### Using Preset Personalities

```typescript
import { DebateTactic } from './models/DebateTactic';

// Academic debate
const academicDebate = await orchestrator.initializeDebate({
  topic: "Should governments invest in nuclear energy?",
  affirmativePersonality: {
    civility: 9,
    manner: 8,
    researchDepth: 9,
    rhetoricUsage: 2,
    tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
  },
  negativePersonality: {
    civility: 9,
    manner: 8,
    researchDepth: 9,
    rhetoricUsage: 2,
    tactics: [DebateTactic.NONE]
  }
});

// Activist debate
const activistDebate = await orchestrator.initializeDebate({
  topic: "Should billionaires be taxed at 90%?",
  affirmativePersonality: {
    civility: 4,
    manner: 3,
    researchDepth: 5,
    rhetoricUsage: 9,
    tactics: [DebateTactic.APPEAL_TO_EMOTION, DebateTactic.FALSE_DILEMMA]
  },
  negativePersonality: {
    civility: 3,
    manner: 2,
    researchDepth: 4,
    rhetoricUsage: 8,
    tactics: [DebateTactic.SLIPPERY_SLOPE]
  }
});
```

See [Personality Examples](docs/personality-examples.md) for more ready-to-use configurations.

## Testing

```bash
npm test
```

## Development

```bash
npm run dev
```

## Configuration

The debate system can be configured using a `.debaterc` file in your project directory or home directory. See `.debaterc.example` for a template.

### Configuration Parameters

#### Debate Configuration

- **timeLimit** (number, optional): Maximum seconds per response. Default: 120
- **wordLimit** (number, optional): Maximum words per statement. Default: 500
- **strictMode** (boolean): Validate on-topic responses. Default: false
- **showPreparation** (boolean): Display preparation phase output. Default: true
- **numCrossExamQuestions** (number): Number of cross-examination questions per side. Default: 3
- **preparationTime** (number, optional): Seconds allocated for the preparation phase where AI models research and prepare arguments. Default: 180

#### UI Configuration

The `ui` object allows you to customize the visual presentation and formatting:

- **enableRichFormatting** (boolean): Enable/disable rich text features (markdown-like formatting, emphasis, lists). Default: true
- **enableAnimations** (boolean): Enable/disable animations (progress bars, status indicators). Default: true (false in CI environments)
- **enableColors** (boolean): Enable/disable ANSI colors. Default: auto-detected based on terminal capabilities
- **colorScheme** (string): Color scheme selection. Options: `"default"`, `"high-contrast"`, `"plain"`, `"custom"`. Default: "default"
- **terminalWidth** (number, optional): Override auto-detected terminal width (40-500). Default: auto-detected
- **showPreparationProgress** (boolean): Show animated progress bars during preparation instead of raw output. Default: true
- **enableHyperlinks** (boolean): Enable clickable hyperlinks in supported terminals. Default: auto-detected
- **customColorScheme** (object, optional): Custom color scheme when `colorScheme` is set to `"custom"`
- **customFormattingRules** (object, optional): Custom formatting rules to override defaults

### Example Configuration

```json
{
  "timeLimit": 60,
  "wordLimit": 300,
  "strictMode": false,
  "showPreparation": true,
  "numCrossExamQuestions": 3,
  "preparationTime": 180,
  "ui": {
    "enableRichFormatting": true,
    "enableAnimations": true,
    "enableColors": true,
    "colorScheme": "default",
    "terminalWidth": null,
    "showPreparationProgress": true,
    "enableHyperlinks": true
  }
}
```

### Accessibility Options

For accessibility, you can disable colors and animations:

```json
{
  "ui": {
    "enableColors": false,
    "enableAnimations": false,
    "colorScheme": "plain"
  }
}
```

Or use high-contrast mode for better visibility:

```json
{
  "ui": {
    "colorScheme": "high-contrast"
  }
}
```

### Configuration Precedence

Configuration values are loaded with the following precedence (highest to lowest):
1. CLI options (command-line flags)
2. Environment variables
3. Configuration file (`.debaterc`)
4. Default values

### Environment Variables

You can configure the debate system using environment variables:

#### Debate Configuration
- `DEBATE_TIME_LIMIT`: Maximum seconds per response
- `DEBATE_WORD_LIMIT`: Maximum words per statement
- `DEBATE_STRICT_MODE`: Enable strict mode (`true` or `false`)
- `DEBATE_SHOW_PREPARATION`: Display preparation phase (`true` or `false`)
- `DEBATE_CROSS_EXAM_QUESTIONS`: Number of cross-examination questions
- `DEBATE_PREPARATION_TIME`: Preparation time in seconds

#### UI Configuration
- `DEBATE_UI_ENABLE_RICH_FORMATTING`: Enable rich text formatting (`true` or `false`)
- `DEBATE_UI_ENABLE_ANIMATIONS`: Enable animations (`true` or `false`)
- `DEBATE_UI_ENABLE_COLORS`: Enable colors (`true` or `false`)
- `DEBATE_UI_COLOR_SCHEME`: Color scheme (`default`, `high-contrast`, `plain`, or `custom`)
- `DEBATE_UI_TERMINAL_WIDTH`: Override terminal width (40-500)
- `DEBATE_UI_SHOW_PREPARATION_PROGRESS`: Show progress bars (`true` or `false`)
- `DEBATE_UI_ENABLE_HYPERLINKS`: Enable hyperlinks (`true` or `false`)

#### API Keys
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
