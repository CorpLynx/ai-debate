# Testing AI Debate System with Local Ollama

This guide will help you run the AI debate system using your local Ollama models.

## Prerequisites

1. **Install Ollama** (if not already installed):
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Start Ollama service**:
   ```bash
   ollama serve
   ```

3. **Pull at least one model** (in a new terminal):
   ```bash
   # Minimum: Pull one model (will be used for both sides)
   ollama pull llama2
   
   # Better: Pull two different models for more interesting debates
   ollama pull mistral
   
   # Or use other models like:
   # ollama pull llama3
   # ollama pull phi
   # ollama pull gemma
   ```

## Setup the Project

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

## Running a Debate with Ollama

### Option 1: Using the CLI with Mock Providers (Quick Test)

Test the system first with mock providers to ensure everything works:

```bash
npm run cli -- "Artificial intelligence will benefit humanity" --mock
```

### Option 2: Use the Ollama Test Script (Recommended)

The included `test-ollama.ts` script automatically:
- Queries Ollama API to discover available models
- Uses two different models if available
- Falls back to using the same model for both sides if only one is available

Create a file `test-ollama.ts` in the project root:

```typescript
import { DebateOrchestratorImpl } from './src/orchestrator/DebateOrchestrator';
import { LocalModelProvider } from './src/providers/LocalModelProvider';
import { DEFAULT_CONFIG } from './src/models/DebateConfig';
import { formatStatement } from './src/utils/StatementFormatter';
import { RoundType } from './src/models/RoundType';

async function runOllamaDebate() {
  console.log('🎯 Starting Ollama Debate Test\n');

  // Initialize two Ollama models
  const model1 = new LocalModelProvider({
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
    apiFormat: 'ollama',
    maxTokens: 500,
    temperature: 0.7,
    timeout: 60000
  });

  const model2 = new LocalModelProvider({
    baseUrl: 'http://localhost:11434',
    model: 'mistral',
    apiFormat: 'ollama',
    maxTokens: 500,
    temperature: 0.7,
    timeout: 60000
  });

  // Validate models are available
  console.log('Checking model availability...');
  const model1Available = await model1.validateAvailability();
  const model2Available = await model2.validateAvailability();

  if (!model1Available || !model2Available) {
    console.error('❌ Ollama models not available. Make sure Ollama is running and models are pulled.');
    process.exit(1);
  }

  console.log('✅ Models available\n');

  // Initialize orchestrator
  const orchestrator = new DebateOrchestratorImpl();
  const topic = 'Artificial intelligence will benefit humanity more than harm it';

  console.log(`📋 Topic: ${topic}`);
  console.log(`📋 Affirmative: ${model1.getModelName()}`);
  console.log(`📋 Negative: ${model2.getModelName()}\n`);

  // Initialize debate with shorter limits for testing
  const config = {
    ...DEFAULT_CONFIG,
    wordLimit: 150,
    timeLimit: 60,
    numCrossExamQuestions: 2,
    showPreparation: false
  };

  let debate = orchestrator.initializeDebate(topic, config, model1, model2);

  try {
    // Opening statements
    console.log('📢 Opening Statements');
    console.log('═'.repeat(80));
    debate = await orchestrator.executeOpeningStatements(debate);
    const openingRound = debate.rounds[debate.rounds.length - 1];
    if (openingRound.affirmativeStatement) {
      console.log(formatStatement(openingRound.affirmativeStatement, RoundType.OPENING));
    }
    if (openingRound.negativeStatement) {
      console.log(formatStatement(openingRound.negativeStatement, RoundType.OPENING));
    }

    // Rebuttals
    console.log('\n🔄 Rebuttals');
    console.log('═'.repeat(80));
    debate = await orchestrator.executeRebuttals(debate);
    const rebuttalRound = debate.rounds[debate.rounds.length - 1];
    if (rebuttalRound.affirmativeStatement) {
      console.log(formatStatement(rebuttalRound.affirmativeStatement, RoundType.REBUTTAL));
    }
    if (rebuttalRound.negativeStatement) {
      console.log(formatStatement(rebuttalRound.negativeStatement, RoundType.REBUTTAL));
    }

    // Closing statements
    console.log('\n🎬 Closing Statements');
    console.log('═'.repeat(80));
    debate = await orchestrator.executeClosingStatements(debate);
    const closingRound = debate.rounds[debate.rounds.length - 1];
    if (closingRound.affirmativeStatement) {
      console.log(formatStatement(closingRound.affirmativeStatement, RoundType.CLOSING));
    }
    if (closingRound.negativeStatement) {
      console.log(formatStatement(closingRound.negativeStatement, RoundType.CLOSING));
    }

    console.log('\n✅ Debate completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during debate:', error);
    process.exit(1);
  }
}

runOllamaDebate();
```

3. **Run the test**:
   ```bash
   npx ts-node test-ollama.ts
   ```

### Option 3: Modify the CLI to Support Ollama

The CLI currently doesn't have built-in Ollama support, but you can add it. Here's what you need to add to `src/cli/index.ts`:

Add these options to the program:
```typescript
.option('--ollama', 'Use Ollama for local models', false)
.option('--ollama-url <url>', 'Ollama base URL', 'http://localhost:11434')
.option('--ollama-model1 <model>', 'First Ollama model name', 'llama2')
.option('--ollama-model2 <model>', 'Second Ollama model name', 'mistral')
```

Then in the `initializeModels` function, add:
```typescript
// Try to initialize Ollama providers
if (options.ollama) {
  try {
    const ollamaModel1 = new LocalModelProvider({
      baseUrl: options.ollamaUrl,
      model: options.ollamaModel1,
      apiFormat: 'ollama',
      maxTokens: 500,
      temperature: 0.7
    });
    
    const ollamaModel2 = new LocalModelProvider({
      baseUrl: options.ollamaUrl,
      model: options.ollamaModel2,
      apiFormat: 'ollama',
      maxTokens: 500,
      temperature: 0.7
    });
    
    if (await ollamaModel1.validateAvailability()) {
      models.push(ollamaModel1, ollamaModel2);
    }
  } catch (error) {
    console.warn('⚠️  Failed to initialize Ollama providers:', (error as Error).message);
  }
}
```

## Quick Start Commands

```bash
# 1. Make sure Ollama is running
ollama serve

# 2. In another terminal, pull at least one model
ollama pull llama2

# 3. (Optional) Pull a second model for better debates
ollama pull mistral

# 4. Build the project
npm run build

# 5. Run the test script (auto-detects available models)
npx ts-node test-ollama.ts
```

## Troubleshooting

### Ollama not responding
- Check if Ollama is running: `curl http://localhost:11434/api/tags`
- Restart Ollama: `killall ollama && ollama serve`

### Models not found
- List available models: `ollama list`
- Pull missing models: `ollama pull <model-name>`

### Timeout errors
- Local models can be slow. Increase timeout in the config:
  ```typescript
  timeout: 120000  // 2 minutes
  ```

### Out of memory
- Use smaller models like `phi` or `gemma:2b`
- Reduce `maxTokens` to 300-400

## Tips for Better Results

1. **Use different models** for more interesting debates (e.g., llama2 vs mistral)
2. **Adjust temperature** (0.7-0.9) for more creative responses
3. **Keep word limits reasonable** (150-300) for faster responses
4. **Start with shorter debates** (skip preparation and cross-exam) for testing
5. **Monitor Ollama logs** to see what's happening: `ollama serve --verbose`
