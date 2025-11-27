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

- **timeLimit** (number, optional): Maximum seconds per response. Default: 120
- **wordLimit** (number, optional): Maximum words per statement. Default: 500
- **strictMode** (boolean): Validate on-topic responses. Default: false
- **showPreparation** (boolean): Display preparation phase output. Default: true
- **numCrossExamQuestions** (number): Number of cross-examination questions per side. Default: 3
- **preparationTime** (number, optional): Seconds allocated for the preparation phase where AI models research and prepare arguments. Default: 180

### Example Configuration

```json
{
  "timeLimit": 60,
  "wordLimit": 300,
  "strictMode": false,
  "showPreparation": true,
  "numCrossExamQuestions": 3,
  "preparationTime": 180
}
```

### Configuration Precedence

Configuration values are loaded with the following precedence (highest to lowest):
1. CLI options (command-line flags)
2. Environment variables (e.g., `DEBATE_PREPARATION_TIME`)
3. Configuration file (`.debaterc`)
4. Default values
