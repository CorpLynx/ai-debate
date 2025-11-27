import { DebateConfig } from '../models/DebateConfig';
import { AIModelProvider } from '../providers/AIModelProvider';
import { ProviderRegistry, ProviderInfo, ModelInfo } from '../registry/ProviderRegistry';
import { displayMenu, displayConfirmation, displayError, displayHeader, MenuOption } from '../utils/DisplayUtils';
import * as readline from 'readline';

/**
 * Interactive state machine states
 */
export enum InteractiveState {
  WELCOME = 'welcome',
  PROVIDER_SELECTION = 'provider_selection',
  MODEL_SELECTION = 'model_selection',
  TOPIC_INPUT = 'topic_input',
  SUMMARY = 'summary',
  CONFIRMATION = 'confirmation',
  CANCELLED = 'cancelled',
  COMPLETE = 'complete'
}

/**
 * Provider selection result
 */
export interface ProviderSelection {
  affirmativeProvider: string;
  negativeProvider: string;
}

/**
 * Model selection result
 */
export interface ModelSelection {
  affirmativeModel: ModelInfo | 'random';
  negativeModel: ModelInfo | 'random';
}

/**
 * Complete session configuration
 */
export interface SessionConfig {
  topic: string;
  providers: ProviderSelection;
  models: ModelSelection;
  debateConfig: DebateConfig;
  affirmativeModelProvider: AIModelProvider;
  negativeModelProvider: AIModelProvider;
}

/**
 * Interactive CLI Manager
 * 
 * Orchestrates the interactive setup flow for debates.
 * Guides users through provider selection, model selection, and topic input.
 * 
 * Requirements:
 * - 1.1: Enter interactive mode when no arguments provided
 * - 1.2: Display welcome message and overview
 * - 1.3: Guide through configuration steps in logical sequence
 * - 10.1: Provide exit option at each step
 */
export class InteractiveCLI {
  private state: InteractiveState;
  private providerRegistry: ProviderRegistry;
  private readline: readline.Interface;

  constructor(configPath?: string) {
    this.state = InteractiveState.WELCOME;
    this.providerRegistry = new ProviderRegistry(configPath);
    this.readline = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Start the interactive configuration flow.
   * Returns a configured session or null if cancelled.
   * 
   * @returns SessionConfig if completed, null if cancelled
   */
  async start(): Promise<SessionConfig | null> {
    try {
      // Display welcome message (Requirement 1.2)
      this.displayWelcome();
      this.state = InteractiveState.PROVIDER_SELECTION;

      // Provider selection step
      const providers = await this.selectProviders();
      if (!providers) {
        this.state = InteractiveState.CANCELLED;
        return null;
      }
      this.state = InteractiveState.MODEL_SELECTION;

      // Model selection step
      const models = await this.selectModels(providers);
      if (!models) {
        this.state = InteractiveState.CANCELLED;
        return null;
      }
      this.state = InteractiveState.TOPIC_INPUT;

      // Topic input step
      const topic = await this.promptForTopic();
      if (!topic) {
        this.state = InteractiveState.CANCELLED;
        return null;
      }
      this.state = InteractiveState.SUMMARY;

      // Load debate configuration
      const debateConfig = await this.loadDebateConfig();

      // Resolve actual model instances
      const affirmativeModelProvider = await this.resolveModelProvider(
        providers.affirmativeProvider,
        models.affirmativeModel
      );
      const negativeModelProvider = await this.resolveModelProvider(
        providers.negativeProvider,
        models.negativeModel
      );

      // Create session config
      const sessionConfig: SessionConfig = {
        topic,
        providers,
        models,
        debateConfig,
        affirmativeModelProvider,
        negativeModelProvider
      };

      // Display summary
      this.displaySummary(sessionConfig);
      this.state = InteractiveState.CONFIRMATION;

      // Confirmation step
      const confirmed = await this.confirmStart();
      if (!confirmed) {
        this.state = InteractiveState.CANCELLED;
        return null;
      }

      this.state = InteractiveState.COMPLETE;
      return sessionConfig;
    } finally {
      this.readline.close();
    }
  }

  /**
   * Display welcome message and overview of setup process.
   * 
   * Requirement 1.2: Display welcome message and overview
   */
  displayWelcome(): void {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          Welcome to AI Debate System                     ║');
    console.log('║                                                          ║');
    console.log('║  Configure your debate through the following steps:     ║');
    console.log('║    1. Select AI providers                               ║');
    console.log('║    2. Choose models                                     ║');
    console.log('║    3. Enter debate topic                                ║');
    console.log('║    4. Review and start                                  ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
  }

  /**
   * Select providers for both debate positions.
   * 
   * Requirements:
   * - 2.1: Display list of available providers
   * - 2.2: Indicate which providers are configured
   * - 2.3: Validate provider configuration
   * - 2.4: Display configuration instructions for unconfigured providers
   * - 2.5: Allow same or different providers
   * - 10.1: Provide exit option
   * 
   * @returns ProviderSelection or null if cancelled
   */
  async selectProviders(): Promise<ProviderSelection | null> {
    console.log(displayHeader('Step 1 of 4: Select Providers'));

    // Get available providers
    const providers = this.providerRegistry.getAvailableProviders();

    // Select affirmative provider
    console.log('\nSelect provider for Affirmative position:');
    const affirmativeProvider = await this.selectSingleProvider(providers);
    if (!affirmativeProvider) return null;

    // Select negative provider
    console.log('\nSelect provider for Negative position:');
    const negativeProvider = await this.selectSingleProvider(providers);
    if (!negativeProvider) return null;

    return {
      affirmativeProvider,
      negativeProvider
    };
  }

  /**
   * Helper method to select a single provider from the list.
   * 
   * @param providers - List of available providers
   * @returns Selected provider type or null if cancelled
   */
  private async selectSingleProvider(providers: ProviderInfo[]): Promise<string | null> {
    // Create menu options from providers
    const menuOptions: MenuOption[] = providers.map(provider => {
      const status = provider.isConfigured ? '✓ Configured' : '✗ Not Configured';
      return {
        label: `${provider.name} ${status}`,
        description: provider.description,
        value: provider.type
      };
    });

    // Display menu using display utility (Requirement 8.3)
    const menu = displayMenu('Available Providers:', menuOptions, true);
    console.log(menu);

    // Get user selection
    const selection = await this.prompt(`Enter selection (1-${providers.length + 1}): `);
    
    // Check for exit
    if (this.isExitCommand(selection) || selection === String(providers.length + 1)) {
      return null;
    }

    const index = parseInt(selection) - 1;
    if (isNaN(index) || index < 0 || index >= providers.length) {
      console.log(displayError('Invalid selection. Please try again.'));
      return this.selectSingleProvider(providers);
    }

    const selectedProvider = providers[index];

    // Validate provider configuration (Requirement 2.3)
    const validation = this.providerRegistry.validateProvider(selectedProvider.type);
    if (!validation.isValid) {
      // Display configuration instructions (Requirement 2.4)
      console.log(displayError(validation.error || 'Provider is not configured'));
      return this.selectSingleProvider(providers);
    }

    // Display confirmation (Requirement 8.2)
    console.log(displayConfirmation('Selected provider', selectedProvider.name));

    return selectedProvider.type;
  }

  /**
   * Select models for both debate positions.
   * 
   * Requirements:
   * - 3.1: Display available models for selected provider
   * - 3.2: Show model names and descriptions
   * - 3.3: Include "random" option
   * - 3.5: Assign models to positions
   * - 3.6: Display final model assignments
   * - 10.1: Provide exit option
   * 
   * @param providers - Selected providers for both positions
   * @returns ModelSelection or null if cancelled
   */
  async selectModels(providers: ProviderSelection): Promise<ModelSelection | null> {
    console.log(displayHeader('Step 2 of 4: Select Models'));

    // Select affirmative model
    console.log(`\nSelect model for Affirmative position (${providers.affirmativeProvider}):`);
    const affirmativeModel = await this.selectSingleModel(providers.affirmativeProvider);
    if (!affirmativeModel) return null;

    // Select negative model
    console.log(`\nSelect model for Negative position (${providers.negativeProvider}):`);
    const negativeModel = await this.selectSingleModel(providers.negativeProvider);
    if (!negativeModel) return null;

    // Display final assignments (Requirement 3.6)
    console.log('\n📋 Model Assignments:');
    const affName = affirmativeModel === 'random' ? 'Random' : affirmativeModel.name;
    const negName = negativeModel === 'random' ? 'Random' : negativeModel.name;
    console.log(`   Affirmative: ${affName}`);
    console.log(`   Negative: ${negName}\n`);

    return {
      affirmativeModel,
      negativeModel
    };
  }

  /**
   * Helper method to select a single model from a provider.
   * 
   * @param providerType - The provider type to get models from
   * @returns Selected model or 'random', or null if cancelled
   */
  private async selectSingleModel(providerType: string): Promise<ModelInfo | 'random' | null> {
    try {
      // Get available models
      const models = await this.providerRegistry.getModelsForProvider(providerType);

      // Create menu options from models (Requirement 3.2)
      const menuOptions: MenuOption[] = models.map(model => ({
        label: model.name,
        description: model.description,
        value: model.id
      }));

      // Add random option (Requirement 3.3)
      menuOptions.push({
        label: 'Random',
        description: 'Randomly select a model',
        value: 'random'
      });

      // Display menu using display utility (Requirement 8.3)
      const menu = displayMenu('Available Models:', menuOptions, true);
      console.log(menu);

      // Get user selection
      const selection = await this.prompt(`Enter selection (1-${menuOptions.length + 1}): `);

      // Check for exit
      if (this.isExitCommand(selection) || selection === String(menuOptions.length + 1)) {
        return null;
      }

      // Check for random selection
      if (selection === String(models.length + 1)) {
        console.log(displayConfirmation('Selected model', 'Random'));
        return 'random';
      }

      const index = parseInt(selection) - 1;
      if (isNaN(index) || index < 0 || index >= models.length) {
        console.log(displayError('Invalid selection. Please try again.'));
        return this.selectSingleModel(providerType);
      }

      const selectedModel = models[index];
      console.log(displayConfirmation('Selected model', selectedModel.name));

      return selectedModel;
    } catch (error) {
      console.log(displayError(`Error fetching models: ${(error as Error).message}`));
      return this.selectSingleModel(providerType);
    }
  }

  /**
   * Prompt for debate topic.
   * 
   * Requirements:
   * - 4.1: Prompt user to enter debate topic
   * - 4.2: Validate topic is non-empty and meaningful
   * - 4.3: Display error and re-prompt for invalid topics
   * - 4.4: Display topic back for confirmation
   * - 10.1: Provide exit option
   * 
   * @returns Topic string or null if cancelled
   */
  async promptForTopic(): Promise<string | null> {
    console.log(displayHeader('Step 3 of 4: Enter Debate Topic'));
    console.log('Examples of well-formed debate topics:');
    console.log('  - "Artificial intelligence will benefit humanity more than harm it"');
    console.log('  - "Remote work is more productive than office work"');
    console.log('  - "Social media has a net negative impact on society"\n');

    const topic = await this.prompt('Enter debate topic (or "exit" to cancel): ');

    // Check for exit
    if (this.isExitCommand(topic)) {
      return null;
    }

    // Validate topic (Requirement 4.2)
    const trimmedTopic = topic.trim();
    if (trimmedTopic.length === 0) {
      console.log(displayError('Topic cannot be empty. Please try again.'));
      return this.promptForTopic();
    }

    if (trimmedTopic.length < 10) {
      console.log(displayError('Topic is too short. Please provide a meaningful topic (at least 10 characters).'));
      return this.promptForTopic();
    }

    // Display topic back for confirmation (Requirement 4.4)
    console.log(displayConfirmation('Debate Topic', `"${trimmedTopic}"`));

    return trimmedTopic;
  }

  /**
   * Display configuration summary.
   * 
   * Requirements:
   * - 1.4: Display summary of selected configuration
   * - 7.1: Load all debate parameters from global configuration
   * - 7.2: Display all loaded configuration values
   * - 8.5: Display formatted summary
   * - 11.4: Show all loaded values from global configuration
   * 
   * @param config - The complete session configuration
   */
  displaySummary(config: SessionConfig): void {
    console.log(displayHeader('Step 4 of 4: Review Configuration'));
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                  Configuration Summary                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('📋 Debate Setup:');
    console.log(`   Topic: ${config.topic}`);
    console.log(`   Affirmative: ${config.affirmativeModelProvider.getModelName()} (${config.providers.affirmativeProvider})`);
    console.log(`   Negative: ${config.negativeModelProvider.getModelName()} (${config.providers.negativeProvider})\n`);

    console.log('⚙️  Debate Parameters (from configuration file):');
    console.log(`   Time Limit: ${config.debateConfig.timeLimit}s per response`);
    console.log(`   Word Limit: ${config.debateConfig.wordLimit} words per statement`);
    console.log(`   Preparation Time: ${config.debateConfig.preparationTime}s`);
    console.log(`   Strict Mode: ${config.debateConfig.strictMode ? 'Enabled' : 'Disabled'}`);
    console.log(`   Show Preparation: ${config.debateConfig.showPreparation ? 'Yes' : 'No'}`);
    console.log(`   Cross-Exam Questions: ${config.debateConfig.numCrossExamQuestions} per side\n`);
  }

  /**
   * Confirm start of debate.
   * 
   * Requirements:
   * - 1.4: Display confirmation prompt
   * - 10.2: Confirm exit action
   * 
   * @returns True if confirmed, false if cancelled
   */
  async confirmStart(): Promise<boolean> {
    const response = await this.prompt('Start debate with this configuration? (yes/no): ');

    if (this.isExitCommand(response) || response.toLowerCase() === 'no' || response.toLowerCase() === 'n') {
      const confirmExit = await this.prompt('Are you sure you want to exit? (yes/no): ');
      if (confirmExit.toLowerCase() === 'yes' || confirmExit.toLowerCase() === 'y') {
        console.log('\n👋 Debate cancelled. No configuration saved.\n');
        return false;
      }
      // If they don't confirm exit, ask again
      return this.confirmStart();
    }

    if (response.toLowerCase() === 'yes' || response.toLowerCase() === 'y') {
      console.log(displayConfirmation('Configuration confirmed', 'Starting debate'));
      return true;
    }

    // Invalid response, ask again
    console.log(displayError('Please enter "yes" or "no".'));
    return this.confirmStart();
  }

  /**
   * Load debate configuration from global configuration file.
   * 
   * Requirement 7.1: Load all debate parameters from global configuration
   * 
   * @returns DebateConfig with loaded values
   */
  private async loadDebateConfig(): Promise<DebateConfig> {
    const { ConfigurationManager } = await import('../utils/ConfigurationManager');
    const configManager = new ConfigurationManager();
    const result = configManager.loadAndMerge({});
    return result.config;
  }

  /**
   * Resolve a model selection to an actual provider instance.
   * Handles 'random' selection by querying provider for random model.
   * 
   * Requirement 3.4: Dynamically query provider and randomly select model
   * 
   * @param providerType - The provider type
   * @param modelSelection - The selected model or 'random'
   * @returns AIModelProvider instance
   */
  private async resolveModelProvider(
    providerType: string,
    modelSelection: ModelInfo | 'random'
  ): Promise<AIModelProvider> {
    let modelInfo: ModelInfo;

    if (modelSelection === 'random') {
      // Requirement 3.4: Randomly select model from provider
      modelInfo = await this.providerRegistry.getRandomModel(providerType);
      console.log(`   Random selection: ${modelInfo.name}`);
    } else {
      modelInfo = modelSelection;
    }

    return this.providerRegistry.createProvider(providerType, modelInfo.id);
  }

  /**
   * Get current state of the interactive flow.
   * 
   * @returns Current InteractiveState
   */
  getState(): InteractiveState {
    return this.state;
  }

  /**
   * Prompt user for input.
   * 
   * @param question - The question to ask
   * @returns User's response
   */
  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.readline.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Check if input is an exit command.
   * 
   * Requirement 10.1: Provide exit option at each step
   * 
   * @param input - User input
   * @returns True if input is an exit command
   */
  private isExitCommand(input: string): boolean {
    const normalized = input.toLowerCase().trim();
    return normalized === 'exit' || normalized === 'quit' || normalized === 'q';
  }
}
