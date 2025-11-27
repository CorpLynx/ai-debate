import { DebateOrchestratorImpl } from './src/orchestrator/DebateOrchestrator';
import { LocalModelProvider } from './src/providers/LocalModelProvider';
import { DEFAULT_CONFIG } from './src/models/DebateConfig';
import { formatStatement } from './src/utils/StatementFormatter';
import { RoundType } from './src/models/RoundType';

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

/**
 * Fetch available models from Ollama API
 */
async function getAvailableOllamaModels(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json() as OllamaTagsResponse;
    return data.models.map(m => m.name);
  } catch (error) {
    throw new Error(`Failed to fetch Ollama models: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function runOllamaDebate() {
  console.log('🎯 Starting Ollama Debate Test\n');

  const baseUrl = 'http://localhost:11434';

  // Check if Ollama is running
  console.log('Checking Ollama availability...');
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error('Ollama not responding');
    }
  } catch (error) {
    console.error('❌ Ollama is not running or not accessible.');
    console.error('\nTo fix this:');
    console.error('  1. Start Ollama: ollama serve');
    console.error('  2. Verify it\'s running: curl http://localhost:11434/api/tags');
    process.exit(1);
  }

  // Fetch available models
  console.log('Fetching available models...');
  let availableModels: string[];
  try {
    availableModels = await getAvailableOllamaModels(baseUrl);
  } catch (error) {
    console.error('❌ Failed to fetch models from Ollama.');
    console.error(error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }

  if (availableModels.length === 0) {
    console.error('❌ No models found in Ollama.');
    console.error('\nTo fix this, pull at least one model:');
    console.error('  ollama pull llama2');
    console.error('  ollama pull mistral');
    console.error('\nOr list available models: ollama list');
    process.exit(1);
  }

  console.log(`✅ Found ${availableModels.length} model(s): ${availableModels.join(', ')}\n`);

  // Select models for debate
  let modelName1: string;
  let modelName2: string;

  if (availableModels.length === 1) {
    console.log('ℹ️  Only one model available - using the same model for both sides');
    modelName1 = availableModels[0];
    modelName2 = availableModels[0];
  } else {
    // Use first two different models
    modelName1 = availableModels[0];
    modelName2 = availableModels[1];
    console.log('ℹ️  Using two different models for the debate');
  }

  // Initialize model providers
  const model1 = new LocalModelProvider({
    baseUrl,
    model: modelName1,
    apiFormat: 'ollama',
    maxTokens: 500,
    temperature: 0.7,
    timeout: 60000
  });

  const model2 = new LocalModelProvider({
    baseUrl,
    model: modelName2,
    apiFormat: 'ollama',
    maxTokens: 500,
    temperature: 0.8, // Slightly different temperature for variety if same model
    timeout: 60000
  });

  console.log('✅ Models initialized\n');

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
