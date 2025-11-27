import { DebateConfig } from '../models/DebateConfig';
import { AIModelProvider } from '../providers/AIModelProvider';
import { ProviderRegistry, ProviderInfo, ModelInfo } from '../registry/ProviderRegistry';
import { 
  displayMenu, 
  displayConfirmation, 
  displayError, 
  displayHeader, 
  displayWelcomeBanner,
  displaySummaryBox,
  MenuOption 
} from '../utils/DisplayUtils';
import * as readline from 'readline';
import chalk from 'chalk';

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

      // Provider selection step (with retry loop for error recovery)
      let providers: ProviderSelection | null = null;
      let models: ModelSelection | null = null;
      
      while (!models) {
        // Provider selection
        if (!providers) {
          providers = await this.selectProviders();
          if (!providers) {
            this.state = InteractiveState.CANCELLED;
            return null;
          }
          this.state = InteractiveState.MODEL_SELECTION;
        }

        // Model selection step (may return null if user wants to change providers)
        models = await this.selectModels(providers);
        if (!models) {
          // Check if user wants to exit or go back to provider selection
          console.log('\n⚠️  Model selection cancelled.\n');
          console.log('Options:');
          console.log('  1. Select different providers');
          console.log('  2. Exit setup\n');
          
          const choice = await this.prompt('Choose an option (1-2): ');
          
          if (choice === '1') {
            // Go back to provider selection
            providers = null;
            this.state = InteractiveState.PROVIDER_SELECTION;
            continue;
          } else {
            // Exit
            this.state = InteractiveState.CANCELLED;
            return null;
          }
        }
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

      // At this point, both providers and models are guaranteed to be non-null
      // TypeScript needs explicit assertion since it can't infer from the while loop
      if (!providers || !models) {
        throw new Error('Internal error: providers or models are null after selection');
      }

      // Resolve actual model instances with error handling
      let affirmativeModelProvider: AIModelProvider;
      let negativeModelProvider: AIModelProvider;
      
      try {
        console.log('\n🔧 Initializing AI providers...');
        
        affirmativeModelProvider = await this.resolveModelProvider(
          providers.affirmativeProvider,
          models.affirmativeModel
        );
        
        negativeModelProvider = await this.resolveModelProvider(
          providers.negativeProvider,
          models.negativeModel
        );
        
        console.log(displayConfirmation('Providers initialized', 'Ready to start debate'));
      } catch (error) {
        // Handle provider initialization failures
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.log('\n' + displayError('Failed to initialize providers'));
        console.log(`\n${errorMessage}\n`);
        
        console.log('This usually happens when:');
        console.log('  - The provider service is temporarily unavailable');
        console.log('  - Network connectivity issues');
        console.log('  - Invalid API credentials\n');
        
        console.log('Would you like to:');
        console.log('  1. Try again');
        console.log('  2. Select different providers/models');
        console.log('  3. Exit setup\n');
        
        const recovery = await this.prompt('Choose an option (1-3): ');
        
        if (recovery === '1') {
          // Retry initialization - go back to topic input to try again
          this.state = InteractiveState.TOPIC_INPUT;
          return this.start();
        } else if (recovery === '2') {
          // Go back to provider selection
          this.state = InteractiveState.PROVIDER_SELECTION;
          return this.start();
        } else {
          // Exit
          this.state = InteractiveState.CANCELLED;
          return null;
        }
      }

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
   * Requirement 6.3: Add welcome screen with ASCII art or box drawing
   */
  displayWelcome(): void {
    console.log(displayWelcomeBanner({ animated: false }));
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
   * - 8.1: Add progress indicators (Step X of Y)
   * 
   * @returns ProviderSelection or null if cancelled
   */
  async selectProviders(): Promise<ProviderSelection | null> {
    console.log(displayHeader('Select Providers', 60, 1, 4));

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
    
    // Check for exit (Requirement 10.1, 10.2)
    if (this.isExitCommand(selection) || selection === String(providers.length + 1)) {
      const confirmed = await this.confirmExit();
      if (confirmed) {
        return null;
      }
      // If not confirmed, ask again
      return this.selectSingleProvider(providers);
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
   * - 8.1: Add progress indicators (Step X of Y)
   * - 2.4: Handle provider errors with recovery options
   * 
   * @param providers - Selected providers for both positions
   * @returns ModelSelection or null if cancelled or needs to go back to provider selection
   */
  async selectModels(providers: ProviderSelection): Promise<ModelSelection | null> {
    console.log(displayHeader('Select Models', 60, 2, 4));

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
   * Requirements:
   * - 8.1: Add loading spinners for async operations
   * - 2.4: Display clear error messages with recovery suggestions
   * 
   * @param providerType - The provider type to get models from
   * @returns Selected model or 'random', or null if cancelled
   */
  private async selectSingleModel(providerType: string): Promise<ModelInfo | 'random' | null> {
    try {
      // Simple loading message instead of spinner to avoid readline interference
      console.log(`\n⏳ Fetching available models from ${providerType}...`);
      
      // Get available models with enhanced error handling
      const models = await this.providerRegistry.getModelsForProvider(providerType);
      
      console.log(displayConfirmation('Models loaded', `Found ${models.length} models`));

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

      // Check for exit (Requirement 10.1, 10.2)
      if (this.isExitCommand(selection) || selection === String(menuOptions.length + 1)) {
        const confirmed = await this.confirmExit();
        if (confirmed) {
          return null;
        }
        // If not confirmed, ask again
        return this.selectSingleModel(providerType);
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
      // Enhanced error handling with recovery suggestions (Requirement 2.4)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.log('\n' + displayError(`Failed to fetch models from ${providerType}`));
      console.log(`\n${errorMessage}\n`);
      
      // Provide recovery options
      console.log('Recovery options:');
      console.log('  1. Try again');
      console.log('  2. Select a different provider');
      console.log('  3. Exit setup\n');
      
      const recovery = await this.prompt('Choose an option (1-3): ');
      
      if (recovery === '1') {
        // Retry with same provider
        return this.selectSingleModel(providerType);
      } else if (recovery === '2') {
        // Return null to go back to provider selection
        return null;
      } else {
        // Exit
        const confirmed = await this.confirmExit();
        if (confirmed) {
          return null;
        }
        // If not confirmed, show recovery options again
        return this.selectSingleModel(providerType);
      }
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
   * - 8.1: Add progress indicators (Step X of Y)
   * 
   * @returns Topic string or null if cancelled
   */
  async promptForTopic(): Promise<string | null> {
    console.log(displayHeader('Enter Debate Topic', 60, 3, 4));
    console.log('Examples of well-formed debate topics:');
    console.log('  - "Artificial intelligence will benefit humanity more than harm it"');
    console.log('  - "Remote work is more productive than office work"');
    console.log('  - "Social media has a net negative impact on society"\n');

    const topic = await this.prompt('Enter debate topic (or "exit" to cancel): ');

    // Check for exit (Requirement 10.1, 10.2)
    if (this.isExitCommand(topic)) {
      const confirmed = await this.confirmExit();
      if (confirmed) {
        return null;
      }
      // If not confirmed, ask again
      return this.promptForTopic();
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
   * - 8.1: Format summary in a visually appealing box
   * 
   * @param config - The complete session configuration
   */
  displaySummary(config: SessionConfig): void {
    console.log(displayHeader('Review Configuration', 60, 4, 4));
    
    // Create sections for the summary box
    const sections: Array<{ title: string; items: Record<string, string | number | boolean> }> = [
      {
        title: '📋 Debate Setup',
        items: {
          'Topic': config.topic,
          'Affirmative': `${config.affirmativeModelProvider.getModelName()} (${config.providers.affirmativeProvider})`,
          'Negative': `${config.negativeModelProvider.getModelName()} (${config.providers.negativeProvider})`
        }
      },
      {
        title: '⚙️  Debate Parameters',
        items: {
          'Time Limit': `${config.debateConfig.timeLimit}s per response`,
          'Word Limit': `${config.debateConfig.wordLimit} words`,
          'Preparation Time': `${config.debateConfig.preparationTime}s`,
          'Strict Mode': config.debateConfig.strictMode ? 'Enabled' : 'Disabled',
          'Show Preparation': config.debateConfig.showPreparation ? 'Yes' : 'No',
          'Cross-Exam Questions': `${config.debateConfig.numCrossExamQuestions} per side`
        }
      }
    ];
    
    console.log(displaySummaryBox('Configuration Summary', sections));
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
      const confirmed = await this.confirmExit();
      if (confirmed) {
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
   * Requirement 7.3: Display warnings for configuration issues
   * 
   * @returns DebateConfig with loaded values
   */
  private async loadDebateConfig(): Promise<DebateConfig> {
    const { ConfigurationManager } = await import('../utils/ConfigurationManager');
    const configManager = new ConfigurationManager();
    const result = configManager.loadAndMerge({});
    
    // Display warnings if any configuration issues occurred
    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Configuration Warnings:'));
      for (const warning of result.warnings) {
        console.log(chalk.yellow(`   ${warning}`));
      }
      console.log(); // Empty line for spacing
    }
    
    return result.config;
  }

  /**
   * Resolve a model selection to an actual provider instance.
   * Handles 'random' selection by querying provider for random model.
   * 
   * Requirement 3.4: Dynamically query provider and randomly select model
   * Requirement 2.4: Handle provider errors with clear messages
   * 
   * @param providerType - The provider type
   * @param modelSelection - The selected model or 'random'
   * @returns AIModelProvider instance
   * @throws Error if provider is unavailable or model cannot be resolved
   */
  private async resolveModelProvider(
    providerType: string,
    modelSelection: ModelInfo | 'random'
  ): Promise<AIModelProvider> {
    try {
      let modelInfo: ModelInfo;

      if (modelSelection === 'random') {
        // Requirement 3.4: Randomly select model from provider
        console.log(`   🎲 Selecting random model from ${providerType}...`);
        modelInfo = await this.providerRegistry.getRandomModel(providerType);
        console.log(`   Random selection: ${modelInfo.name}`);
      } else {
        modelInfo = modelSelection;
      }

      return this.providerRegistry.createProvider(providerType, modelInfo.id);
    } catch (error) {
      // Enhanced error handling for provider resolution failures
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to initialize ${providerType} provider: ${errorMessage}`);
    }
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
    return new Promise((resolve, reject) => {
      // Check if readline is still open
      if ((this.readline as any).closed) {
        reject(new Error('Readline interface is closed'));
        return;
      }
      
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

  /**
   * Confirm exit action with the user.
   * 
   * Requirements:
   * - 10.2: Confirm exit action
   * - 10.3: Terminate gracefully without starting debate
   * - 10.4: Do not save partial configuration
   * 
   * @returns True if exit is confirmed, false if user wants to continue
   */
  private async confirmExit(): Promise<boolean> {
    const response = await this.prompt('Are you sure you want to exit? (yes/no): ');
    
    if (response.toLowerCase() === 'yes' || response.toLowerCase() === 'y') {
      console.log('\n👋 Debate cancelled. No configuration saved.\n');
      return true;
    }
    
    if (response.toLowerCase() === 'no' || response.toLowerCase() === 'n') {
      return false;
    }
    
    // Invalid response, ask again
    console.log(displayError('Please enter "yes" or "no".'));
    return this.confirmExit();
  }
}
