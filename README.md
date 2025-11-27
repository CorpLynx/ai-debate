# AI Debate System

A system for orchestrating formal debates between AI models.

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

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
