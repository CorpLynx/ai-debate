#!/usr/bin/env node

import { Command } from 'commander';
import { DebateConfig, DEFAULT_CONFIG } from '../models/DebateConfig';
import { DebateOrchestratorImpl } from '../orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../providers/MockAIProvider';
import { OpenAIProvider } from '../providers/OpenAIProvider';
import { AnthropicProvider } from '../providers/AnthropicProvider';
import { AIModelProvider } from '../providers/AIModelProvider';
import { selectAndAssignModels } from '../utils/ModelSelection';
import { formatStatement, formatThinkingIndicator } from '../utils/StatementFormatter';
import { RoundType } from '../models/RoundType';
import { DebateState } from '../models/DebateState';
import { ConfigurationManager } from '../utils/ConfigurationManager';
import { TranscriptManagerImpl } from '../transcript/TranscriptManager';
import { InteractiveCLI, SessionConfig } from './InteractiveCLI';

/**
 * CLI Interface for the AI Debate System
 * 
 * Requirements:
 * - 1.1: Accept debate topic as argument
 * - 1.3: Display confirmation that topic has been accepted
 * - 2.3: Display which model is taking which position
 * - 7.1, 7.2, 7.3: Display debate progress with status indicators
 * - 7.4: Show status indicator for which model is currently generating
 * - 8.3: Display or export the complete debate transcript
 */

const program = new Command();

program
  .name('ai-debate')
  .description('Orchestrate formal debates between AI models')
  .version('1.0.0')
  .argument('<topic>', 'The debate topic or proposition')
  .option('-c, --config <path>', 'Path to configuration file (default: ./.debaterc)')
  .option('-t, --time-limit <seconds>', 'Maximum time per response in seconds', parseFloat)
  .option('-w, --word-limit <words>', 'Maximum words per statement', parseInt)
  .option('-s, --strict-mode', 'Enable strict mode (validate on-topic responses)', false)
  .option('--no-show-preparation', 'Hide preparation phase from display')
  .option('-q, --cross-exam-questions <number>', 'Number of cross-examination questions per side', parseInt)
  .option('--mock', 'Use mock AI providers for testing', false)
  .option('--openai-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env var)')
  .option('--anthropic-key <key>', 'Anthropic API key (or set ANTHROPIC_API_KEY env var)')
  .option('--export <format>', 'Export transcript format (text, markdown, json)', 'text')
  .action(async (topic: string, options: any) => {
    try {
      await runDebate(topic, options);
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * Run a debate from an interactive session configuration
 * 
 * Requirements:
 * - 1.1: Pass configured session to debate orchestrator
 */
async function runDebateFromSession(sessionConfig: SessionConfig): Promise<void> {
  const { topic, debateConfig, affirmativeModelProvider, negativeModelProvider } = sessionConfig;
  
  // Display topic confirmation
  console.log('\n🎯 Debate Topic:', topic);
  console.log('');
  
  // Display model assignments
  console.log('📋 Model Assignments:');
  console.log(`   Affirmative: ${affirmativeModelProvider.getModelName()}`);
  console.log(`   Negative: ${negativeModelProvider.getModelName()}`);
  console.log('');
  
  // Initialize orchestrator
  const orchestrator = new DebateOrchestratorImpl();
  
  // Initialize debate
  let debate = orchestrator.initializeDebate(topic, debateConfig, affirmativeModelProvider, negativeModelProvider);
  
  // Display configuration
  displayConfiguration(debateConfig);
  
  // Execute debate rounds with progress display
  try {
    // Preparation phase
    console.log('\n🔬 Preparation Phase');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executePreparation',
      RoundType.PREPARATION,
      debateConfig.showPreparation
    );
    
    // Opening statements
    console.log('\n📢 Opening Statements');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeOpeningStatements',
      RoundType.OPENING,
      true
    );
    
    // Rebuttals
    console.log('\n🔄 Rebuttals');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeRebuttals',
      RoundType.REBUTTAL,
      true
    );
    
    // Cross-examination
    console.log('\n❓ Cross-Examination');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeCrossExamination',
      RoundType.CROSS_EXAM,
      true
    );
    
    // Closing statements
    console.log('\n🎬 Closing Statements');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeClosingStatements',
      RoundType.CLOSING,
      true
    );
    
    // Mark debate as completed
    debate = await orchestrator.completeDebate(debate);
    
    // Display completion message
    console.log('\n✅ Debate Completed!');
    console.log('═'.repeat(80));
    
    // Display bibliography (Requirements 12.1, 12.3, 12.4, 12.5)
    orchestrator.displayBibliography();
    
    // Generate and display/export transcript
    await exportTranscript(debate, 'text');
    
  } catch (error) {
    console.error('\n❌ Debate encountered an error:', (error as Error).message);
    console.log('\n💾 Attempting to save partial transcript...');
    
    // Try to save partial transcript
    try {
      const transcriptManager = new TranscriptManagerImpl();
      const filePath = await transcriptManager.savePartialTranscript(debate);
      console.log(`✅ Partial transcript saved to: ${filePath}`);
    } catch (saveError) {
      console.error('❌ Failed to save partial transcript:', (saveError as Error).message);
    }
    
    throw error;
  }
}

/**
 * Main function to run a debate from command-line arguments
 */
async function runDebate(topic: string, options: any): Promise<void> {
  // Parse configuration from CLI options
  const config = parseConfig(options);
  
  // Display topic confirmation (Requirement 1.3)
  console.log('\n🎯 Debate Topic:', topic);
  console.log('');
  
  // Initialize available models
  const availableModels = await initializeModels(options);
  
  if (availableModels.length < 2) {
    throw new Error('At least 2 AI models are required to conduct a debate. Please configure API keys or use --mock flag.');
  }
  
  // Select and assign models to positions
  const { affirmativeModel, negativeModel } = selectAndAssignModels(availableModels);
  
  // Display model assignments (Requirement 2.3)
  console.log('📋 Model Assignments:');
  console.log(`   Affirmative: ${affirmativeModel.getModelName()}`);
  console.log(`   Negative: ${negativeModel.getModelName()}`);
  console.log('');
  
  // Initialize orchestrator
  const orchestrator = new DebateOrchestratorImpl();
  
  // Initialize debate
  let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);
  
  // Display configuration
  displayConfiguration(config);
  
  // Execute debate rounds with progress display
  try {
    // Preparation phase
    console.log('\n🔬 Preparation Phase');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executePreparation',
      RoundType.PREPARATION,
      config.showPreparation
    );
    
    // Opening statements
    console.log('\n📢 Opening Statements');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeOpeningStatements',
      RoundType.OPENING,
      true
    );
    
    // Rebuttals
    console.log('\n🔄 Rebuttals');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeRebuttals',
      RoundType.REBUTTAL,
      true
    );
    
    // Cross-examination
    console.log('\n❓ Cross-Examination');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeCrossExamination',
      RoundType.CROSS_EXAM,
      true
    );
    
    // Closing statements
    console.log('\n🎬 Closing Statements');
    console.log('═'.repeat(80));
    debate = await executeRoundWithProgress(
      orchestrator,
      debate,
      'executeClosingStatements',
      RoundType.CLOSING,
      true
    );
    
    // Mark debate as completed
    debate = await orchestrator.completeDebate(debate);
    
    // Display completion message
    console.log('\n✅ Debate Completed!');
    console.log('═'.repeat(80));
    
    // Display bibliography (Requirements 12.1, 12.3, 12.4, 12.5)
    orchestrator.displayBibliography();
    
    // Generate and display/export transcript (Requirement 8.3)
    await exportTranscript(debate, options.export);
    
  } catch (error) {
    console.error('\n❌ Debate encountered an error:', (error as Error).message);
    console.log('\n💾 Attempting to save partial transcript...');
    
    // Try to save partial transcript
    try {
      const transcriptManager = new TranscriptManagerImpl();
      const filePath = await transcriptManager.savePartialTranscript(debate);
      console.log(`✅ Partial transcript saved to: ${filePath}`);
    } catch (saveError) {
      console.error('❌ Failed to save partial transcript:', (saveError as Error).message);
    }
    
    throw error;
  }
}

/**
 * Parses CLI options into DebateConfig
 */
function parseConfig(options: any): DebateConfig {
  const configManager = new ConfigurationManager();
  
  // Build partial config from CLI options
  const cliConfig: Partial<DebateConfig> = {};
  
  if (options.timeLimit !== undefined) {
    cliConfig.timeLimit = options.timeLimit;
  }
  
  if (options.wordLimit !== undefined) {
    cliConfig.wordLimit = options.wordLimit;
  }
  
  if (options.strictMode !== undefined) {
    cliConfig.strictMode = options.strictMode;
  }
  
  if (options.showPreparation !== undefined) {
    cliConfig.showPreparation = options.showPreparation;
  }
  
  if (options.crossExamQuestions !== undefined) {
    cliConfig.numCrossExamQuestions = options.crossExamQuestions;
  }
  
  // Load and merge from all sources (file, env, CLI)
  const result = configManager.loadAndMerge(cliConfig, options.config);
  
  // Display warnings for invalid parameters
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    result.warnings.forEach(warning => console.log(`   ${warning}`));
  }
  
  return result.config;
}

/**
 * Initializes available AI model providers based on CLI options and environment
 * 
 * API keys are loaded with precedence: CLI > Env > Config File
 */
async function initializeModels(options: any): Promise<AIModelProvider[]> {
  const models: AIModelProvider[] = [];
  
  // Use mock providers if requested
  if (options.mock) {
    models.push(
      new MockAIProvider('MockGPT-4', {
        defaultResponse: 'I am arguing from the affirmative position...'
      }),
      new MockAIProvider('MockClaude', {
        defaultResponse: 'I am arguing from the negative position...'
      })
    );
    return models;
  }
  
  // Load API keys from all sources (CLI > Env > File)
  const configManager = new ConfigurationManager();
  const cliAPIKeys = {
    openaiApiKey: options.openaiKey,
    anthropicApiKey: options.anthropicKey
  };
  const mergedAPIKeys = configManager.loadAndMergeAPIKeys(cliAPIKeys, options.config);
  
  // Try to initialize OpenAI provider
  if (mergedAPIKeys.openaiApiKey) {
    try {
      const openaiProvider = new OpenAIProvider({ apiKey: mergedAPIKeys.openaiApiKey });
      if (await openaiProvider.validateAvailability()) {
        models.push(openaiProvider);
      }
    } catch (error) {
      console.warn('⚠️  Failed to initialize OpenAI provider:', (error as Error).message);
    }
  }
  
  // Try to initialize Anthropic provider
  if (mergedAPIKeys.anthropicApiKey) {
    try {
      const anthropicProvider = new AnthropicProvider({ apiKey: mergedAPIKeys.anthropicApiKey });
      if (await anthropicProvider.validateAvailability()) {
        models.push(anthropicProvider);
      }
    } catch (error) {
      console.warn('⚠️  Failed to initialize Anthropic provider:', (error as Error).message);
    }
  }
  
  return models;
}

/**
 * Displays the current configuration with enhanced formatting
 * Requirements: 6.2, 9.1
 */
function displayConfiguration(config: DebateConfig): void {
  const { displayConfigSection } = require('../utils/DisplayUtils');
  
  const configItems = {
    'Time Limit': `${config.timeLimit}s per response`,
    'Word Limit': `${config.wordLimit} words per statement`,
    'Strict Mode': config.strictMode ? 'Enabled' : 'Disabled',
    'Show Preparation': config.showPreparation ? 'Yes' : 'No',
    'Cross-Exam Questions': `${config.numCrossExamQuestions} per side`
  };
  
  console.log(displayConfigSection('⚙️  Configuration', configItems));
}

/**
 * Executes a debate round with progress indicators and enhanced statement display
 * 
 * Requirements:
 * - 1.5: Apply consistent indentation and margins
 * - 2.1: Display visually prominent round header with decorative elements
 * - 2.2: Use distinct visual styling for metadata versus content
 * - 2.3: Use clear visual separators between statements
 * - 2.4: Use consistent color coding for positions
 * - 2.5: Display round progress in clear format
 * - 7.1: Display statements immediately after generation
 * - 7.2, 7.3: Clearly indicate model, position, and round type
 * - 7.4: Show status indicator while model is generating
 * - All UI polish requirements for rich text formatting and responsive layout
 */
async function executeRoundWithProgress(
  orchestrator: DebateOrchestratorImpl,
  debate: any,
  method: 'executePreparation' | 'executeOpeningStatements' | 'executeRebuttals' | 'executeCrossExamination' | 'executeClosingStatements',
  roundType: RoundType,
  displayStatements: boolean
): Promise<any> {
  // Execute the round (streaming handler will display progress indicators)
  const updatedDebate = await (orchestrator as any)[method](debate);
  
  // Display statements if requested with enhanced formatting
  // (Requirements 7.1, 7.2, 7.3, 2.5, and all UI polish requirements)
  if (displayStatements) {
    const currentRound = updatedDebate.rounds[updatedDebate.rounds.length - 1];
    
    // Calculate round progress (Requirement 2.5)
    // Total rounds: preparation, opening, rebuttal, cross-exam, closing = 5
    const totalRounds = 5;
    const currentRoundNumber = updatedDebate.rounds.length;
    
    // Display affirmative statement with rich text formatting and responsive layout
    if (currentRound.affirmativeStatement) {
      console.log(formatStatement(
        currentRound.affirmativeStatement, 
        roundType,
        currentRoundNumber,
        totalRounds
      ));
    }
    
    // Display negative statement with rich text formatting and responsive layout
    if (currentRound.negativeStatement) {
      console.log(formatStatement(
        currentRound.negativeStatement, 
        roundType,
        currentRoundNumber,
        totalRounds
      ));
    }
  }
  
  return updatedDebate;
}

/**
 * Exports the debate transcript in the specified format with enhanced formatting
 * 
 * Requirements: 8.3, 4.1, 4.2, 4.3, 4.4, 4.5
 */
async function exportTranscript(debate: any, format: string): Promise<void> {
  const transcriptManager = new TranscriptManagerImpl();
  const { displaySummaryBox, displayConfirmation } = require('../utils/DisplayUtils');
  
  // Generate transcript
  const transcript = transcriptManager.generateTranscript(debate);
  
  // Save to file (always saves as JSON internally)
  const filePath = await transcriptManager.saveTranscript(transcript);
  console.log(displayConfirmation('Transcript saved', filePath));
  
  // Display enhanced summary with formatted box (Requirements 4.3, 4.4, 4.5)
  const summaryData = [
    {
      title: '📊 Debate Summary',
      items: {
        'Topic': transcript.summary.topic,
        'Affirmative': transcript.summary.models.affirmative,
        'Negative': transcript.summary.models.negative,
        'Duration': `${Math.round(transcript.summary.totalDuration)}s`,
        'Rounds': transcript.summary.roundCount.toString()
      }
    }
  ];
  
  console.log(displaySummaryBox('Debate Complete', summaryData));
}

/**
 * Main entry point - detects interactive vs argument-based mode
 * 
 * Requirement 1.1: Enter interactive mode when application is run without arguments
 */
async function main() {
  // Check if running without arguments (only node and script path)
  // process.argv[0] = node, process.argv[1] = script path
  const hasArguments = process.argv.length > 2;
  
  if (!hasArguments) {
    // Launch interactive mode (Requirement 1.1)
    try {
      const interactiveCLI = new InteractiveCLI();
      const sessionConfig = await interactiveCLI.start();
      
      if (!sessionConfig) {
        // User cancelled
        console.log('\n👋 Debate cancelled. Goodbye!\n');
        process.exit(0);
      }
      
      // Run debate with interactive configuration
      await runDebateFromSession(sessionConfig);
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      process.exit(1);
    }
  } else {
    // Parse command line arguments (backward compatibility)
    program.parse();
  }
}

// Start the application
main();
