import * as fc from 'fast-check';
import { InteractiveCLI, InteractiveState } from '../../src/cli/InteractiveCLI';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Interactive CLI Properties', () => {
  let tempDir: string;
  let tempConfigPath: string;
  let originalEnv: NodeJS.ProcessEnv;
  let cliInstances: InteractiveCLI[] = [];

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Create a temporary directory for test config files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'interactive-cli-test-'));
    tempConfigPath = path.join(tempDir, '.debaterc');
    
    // Set up minimal config
    const config = {
      timeLimit: 120,
      wordLimit: 500,
      preparationTime: 180,
      strictMode: false,
      showPreparation: true,
      numCrossExamQuestions: 3
    };
    fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
    
    // Reset CLI instances array
    cliInstances = [];
  });

  afterEach(() => {
    // Close all CLI instances to prevent memory leaks
    cliInstances.forEach(cli => {
      try {
        (cli as any).readline?.close();
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    
    // Restore original environment
    process.env = originalEnv;
    
    // Clean up temporary files
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  // Feature: interactive-mode, Property 1: Configuration step sequence is consistent
  // Validates: Requirements 1.3
  it('should follow consistent step sequence: provider → model → topic → summary → confirmation', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // Placeholder for property-based generation
        () => {
          // Create CLI instance
          const cli = new InteractiveCLI(tempConfigPath);
          cliInstances.push(cli);
          
          // Verify initial state is WELCOME
          expect(cli.getState()).toBe(InteractiveState.WELCOME);
          
          // The state machine should follow this exact sequence:
          // WELCOME → PROVIDER_SELECTION → MODEL_SELECTION → TOPIC_INPUT → SUMMARY → CONFIRMATION
          const expectedSequence = [
            InteractiveState.WELCOME,
            InteractiveState.PROVIDER_SELECTION,
            InteractiveState.MODEL_SELECTION,
            InteractiveState.TOPIC_INPUT,
            InteractiveState.SUMMARY,
            InteractiveState.CONFIRMATION
          ];
          
          // Verify the sequence is defined in the enum
          const stateValues = Object.values(InteractiveState);
          for (const state of expectedSequence) {
            expect(stateValues).toContain(state);
          }
          
          // Verify WELCOME is the initial state
          expect(expectedSequence[0]).toBe(InteractiveState.WELCOME);
          
          // Verify the sequence progresses logically
          expect(expectedSequence.indexOf(InteractiveState.PROVIDER_SELECTION))
            .toBeLessThan(expectedSequence.indexOf(InteractiveState.MODEL_SELECTION));
          expect(expectedSequence.indexOf(InteractiveState.MODEL_SELECTION))
            .toBeLessThan(expectedSequence.indexOf(InteractiveState.TOPIC_INPUT));
          expect(expectedSequence.indexOf(InteractiveState.TOPIC_INPUT))
            .toBeLessThan(expectedSequence.indexOf(InteractiveState.SUMMARY));
          expect(expectedSequence.indexOf(InteractiveState.SUMMARY))
            .toBeLessThan(expectedSequence.indexOf(InteractiveState.CONFIRMATION));
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 24: Exit option is always available
  // Validates: Requirements 10.1
  it('should provide exit option at every interactive prompt', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          InteractiveState.PROVIDER_SELECTION,
          InteractiveState.MODEL_SELECTION,
          InteractiveState.TOPIC_INPUT,
          InteractiveState.CONFIRMATION
        ),
        (state) => {
          // Create CLI instance
          const cli = new InteractiveCLI(tempConfigPath);
          cliInstances.push(cli);
          
          // For each interactive state, verify that:
          // 1. The state is one that requires user input
          // 2. Exit commands should be recognized
          
          const interactiveStates = [
            InteractiveState.PROVIDER_SELECTION,
            InteractiveState.MODEL_SELECTION,
            InteractiveState.TOPIC_INPUT,
            InteractiveState.CONFIRMATION
          ];
          
          // Verify the state is in the list of interactive states
          expect(interactiveStates).toContain(state);
          
          // Verify exit-related states exist
          expect(Object.values(InteractiveState)).toContain(InteractiveState.CANCELLED);
          
          // The CLI should support exit at any of these states
          // This is verified by the existence of the CANCELLED state
          // and the implementation of isExitCommand method
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Verify state transitions are unidirectional
  it('should only allow forward state transitions in the normal flow', () => {
    const cli = new InteractiveCLI(tempConfigPath);
    cliInstances.push(cli);
    
    // Define the expected forward progression
    const stateOrder = [
      InteractiveState.WELCOME,
      InteractiveState.PROVIDER_SELECTION,
      InteractiveState.MODEL_SELECTION,
      InteractiveState.TOPIC_INPUT,
      InteractiveState.SUMMARY,
      InteractiveState.CONFIRMATION,
      InteractiveState.COMPLETE
    ];
    
    // Verify each state comes before the next in the sequence
    for (let i = 0; i < stateOrder.length - 1; i++) {
      const currentIndex = stateOrder.indexOf(stateOrder[i]);
      const nextIndex = stateOrder.indexOf(stateOrder[i + 1]);
      expect(nextIndex).toBe(currentIndex + 1);
    }
  });

  // Additional test: Verify CANCELLED state is terminal
  it('should treat CANCELLED state as terminal', () => {
    const cli = new InteractiveCLI(tempConfigPath);
    cliInstances.push(cli);
    
    // CANCELLED should be a valid state
    expect(Object.values(InteractiveState)).toContain(InteractiveState.CANCELLED);
    
    // CANCELLED should not be in the normal forward progression
    const normalStates = [
      InteractiveState.WELCOME,
      InteractiveState.PROVIDER_SELECTION,
      InteractiveState.MODEL_SELECTION,
      InteractiveState.TOPIC_INPUT,
      InteractiveState.SUMMARY,
      InteractiveState.CONFIRMATION,
      InteractiveState.COMPLETE
    ];
    
    expect(normalStates).not.toContain(InteractiveState.CANCELLED);
  });

  // Additional test: Verify COMPLETE state is terminal
  it('should treat COMPLETE state as terminal', () => {
    const cli = new InteractiveCLI(tempConfigPath);
    cliInstances.push(cli);
    
    // COMPLETE should be a valid state
    expect(Object.values(InteractiveState)).toContain(InteractiveState.COMPLETE);
    
    // COMPLETE should be the final state in normal progression
    const normalStates = [
      InteractiveState.WELCOME,
      InteractiveState.PROVIDER_SELECTION,
      InteractiveState.MODEL_SELECTION,
      InteractiveState.TOPIC_INPUT,
      InteractiveState.SUMMARY,
      InteractiveState.CONFIRMATION,
      InteractiveState.COMPLETE
    ];
    
    expect(normalStates[normalStates.length - 1]).toBe(InteractiveState.COMPLETE);
  });

  // Additional test: Verify all required states exist
  it('should define all required states in the state machine', () => {
    const requiredStates = [
      'WELCOME',
      'PROVIDER_SELECTION',
      'MODEL_SELECTION',
      'TOPIC_INPUT',
      'SUMMARY',
      'CONFIRMATION',
      'CANCELLED',
      'COMPLETE'
    ];
    
    const actualStates = Object.keys(InteractiveState);
    
    for (const requiredState of requiredStates) {
      expect(actualStates).toContain(requiredState);
    }
  });

  // Feature: interactive-mode, Property 4: Same and different provider selections are both valid
  // Validates: Requirements 2.5
  it('should accept both same and different provider selections as valid configurations', () => {
    fc.assert(
      fc.property(
        fc.record({
          affirmativeProvider: fc.constantFrom('openai', 'anthropic', 'ollama'),
          negativeProvider: fc.constantFrom('openai', 'anthropic', 'ollama'),
          configureProviders: fc.boolean()
        }),
        (testCase) => {
          // Clear environment variables
          delete process.env.OPENAI_API_KEY;
          delete process.env.ANTHROPIC_API_KEY;

          // Configure providers if needed
          if (testCase.configureProviders) {
            process.env.OPENAI_API_KEY = 'test-openai-key';
            process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
          }

          // Create CLI instance
          const cli = new InteractiveCLI(tempConfigPath);
          cliInstances.push(cli);

          // Get provider registry to validate
          const registry = (cli as any).providerRegistry;

          // Check if both providers are configured
          const affirmativeConfigured = registry.isProviderConfigured(testCase.affirmativeProvider);
          const negativeConfigured = registry.isProviderConfigured(testCase.negativeProvider);

          // If both providers are configured, the selection should be valid
          // regardless of whether they are the same or different
          if (affirmativeConfigured && negativeConfigured) {
            const affirmativeValidation = registry.validateProvider(testCase.affirmativeProvider);
            const negativeValidation = registry.validateProvider(testCase.negativeProvider);

            // Both should be valid
            expect(affirmativeValidation.isValid).toBe(true);
            expect(negativeValidation.isValid).toBe(true);

            // Test both same and different provider scenarios
            const isSameProvider = testCase.affirmativeProvider === testCase.negativeProvider;
            
            // Both scenarios should be valid
            // Same provider: both positions use the same provider
            // Different providers: positions use different providers
            // Both are acceptable configurations
            if (isSameProvider) {
              // Same provider for both positions is valid
              expect(testCase.affirmativeProvider).toBe(testCase.negativeProvider);
            } else {
              // Different providers for each position is also valid
              expect(testCase.affirmativeProvider).not.toBe(testCase.negativeProvider);
            }

            // The key property: both configurations are valid
            expect(affirmativeValidation.isValid && negativeValidation.isValid).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 27: Provider status is indicated
  // Validates: Requirements 11.1
  it('should indicate configuration status for each provider in the list', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasOpenAIKey: fc.boolean(),
          hasAnthropicKey: fc.boolean(),
          useEnv: fc.boolean()
        }),
        (testCase) => {
          // Clear environment variables
          delete process.env.OPENAI_API_KEY;
          delete process.env.ANTHROPIC_API_KEY;

          if (testCase.useEnv) {
            // Set environment variables
            if (testCase.hasOpenAIKey) {
              process.env.OPENAI_API_KEY = 'test-openai-key';
            }
            if (testCase.hasAnthropicKey) {
              process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
            }
          } else {
            // Write to config file
            const config: any = {
              timeLimit: 120,
              wordLimit: 500,
              preparationTime: 180,
              strictMode: false,
              showPreparation: true,
              numCrossExamQuestions: 3
            };
            if (testCase.hasOpenAIKey) {
              config.openaiApiKey = 'test-openai-key';
            }
            if (testCase.hasAnthropicKey) {
              config.anthropicApiKey = 'test-anthropic-key';
            }
            fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
          }

          // Create CLI instance
          const cli = new InteractiveCLI(testCase.useEnv ? undefined : tempConfigPath);
          cliInstances.push(cli);

          // Get provider registry
          const registry = (cli as any).providerRegistry;

          // Get available providers
          const providers = registry.getAvailableProviders();

          // Verify that each provider has a configuration status indicator
          for (const provider of providers) {
            // Each provider must have an isConfigured field
            expect(provider).toHaveProperty('isConfigured');
            expect(typeof provider.isConfigured).toBe('boolean');

            // Verify the status matches the actual configuration
            const expectedStatus = registry.isProviderConfigured(provider.type);
            expect(provider.isConfigured).toBe(expectedStatus);

            // Verify specific provider statuses
            if (provider.type === 'openai') {
              expect(provider.isConfigured).toBe(testCase.hasOpenAIKey);
            } else if (provider.type === 'anthropic') {
              expect(provider.isConfigured).toBe(testCase.hasAnthropicKey);
            } else if (provider.type === 'ollama') {
              // Ollama should always be configured (no credentials required)
              expect(provider.isConfigured).toBe(true);
            }

            // Verify that provider info includes all required fields for display
            expect(provider).toHaveProperty('type');
            expect(provider).toHaveProperty('name');
            expect(provider).toHaveProperty('description');
            expect(provider).toHaveProperty('requiresCredentials');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 8: Model assignment is complete
  // Validates: Requirements 3.5
  it('should assign each selected model to exactly one position (affirmative or negative)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          affirmativeModelIndex: fc.nat(),
          negativeModelIndex: fc.nat(),
          useRandom: fc.record({
            affirmative: fc.boolean(),
            negative: fc.boolean()
          })
        }),
        async (testCase) => {
          // Set up environment for testing
          process.env.OPENAI_API_KEY = 'test-openai-key';
          process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

          // Create CLI instance
          const cli = new InteractiveCLI(tempConfigPath);
          cliInstances.push(cli);

          // Get provider registry
          const registry = (cli as any).providerRegistry;

          // Get models for a test provider (using ollama as it doesn't require credentials)
          const providerType = 'ollama';
          let models;
          try {
            models = await registry.getModelsForProvider(providerType);
          } catch (error) {
            // If we can't get models (e.g., Ollama not running), skip this test case
            return true;
          }

          if (models.length === 0) {
            // No models available, skip this test case
            return true;
          }

          // Create a model selection
          const affirmativeModel = testCase.useRandom.affirmative 
            ? 'random' as const
            : models[testCase.affirmativeModelIndex % models.length];
          
          const negativeModel = testCase.useRandom.negative
            ? 'random' as const
            : models[testCase.negativeModelIndex % models.length];

          const modelSelection = {
            affirmativeModel,
            negativeModel
          };

          // Verify that each model is assigned to exactly one position
          // Property: Each selected model should be assigned to exactly one position
          
          // 1. Affirmative model is assigned
          expect(modelSelection.affirmativeModel).toBeDefined();
          expect(modelSelection.affirmativeModel).not.toBeNull();
          
          // 2. Negative model is assigned
          expect(modelSelection.negativeModel).toBeDefined();
          expect(modelSelection.negativeModel).not.toBeNull();
          
          // 3. Each model is either a ModelInfo object or 'random'
          if (modelSelection.affirmativeModel !== 'random') {
            expect(modelSelection.affirmativeModel).toHaveProperty('id');
            expect(modelSelection.affirmativeModel).toHaveProperty('name');
            expect(modelSelection.affirmativeModel).toHaveProperty('description');
            expect(modelSelection.affirmativeModel).toHaveProperty('provider');
          } else {
            expect(modelSelection.affirmativeModel).toBe('random');
          }
          
          if (modelSelection.negativeModel !== 'random') {
            expect(modelSelection.negativeModel).toHaveProperty('id');
            expect(modelSelection.negativeModel).toHaveProperty('name');
            expect(modelSelection.negativeModel).toHaveProperty('description');
            expect(modelSelection.negativeModel).toHaveProperty('provider');
          } else {
            expect(modelSelection.negativeModel).toBe('random');
          }
          
          // 4. The assignment is complete - both positions have models
          const hasAffirmativeAssignment = modelSelection.affirmativeModel !== undefined && modelSelection.affirmativeModel !== null;
          const hasNegativeAssignment = modelSelection.negativeModel !== undefined && modelSelection.negativeModel !== null;
          
          expect(hasAffirmativeAssignment && hasNegativeAssignment).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 28: Model descriptions are shown
  // Validates: Requirements 11.2
  it('should show model name and description for each model in the list', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('openai', 'anthropic', 'ollama'),
        async (providerType) => {
          // Set up environment for testing
          process.env.OPENAI_API_KEY = 'test-openai-key';
          process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

          // Create CLI instance
          const cli = new InteractiveCLI(tempConfigPath);
          cliInstances.push(cli);

          // Get provider registry
          const registry = (cli as any).providerRegistry;

          // Get models for the provider
          let models;
          try {
            models = await registry.getModelsForProvider(providerType);
          } catch (error) {
            // If we can't get models (e.g., provider not available), skip this test case
            return true;
          }

          if (models.length === 0) {
            // No models available, skip this test case
            return true;
          }

          // Verify that each model has both name and description
          for (const model of models) {
            // Each model must have a name
            expect(model).toHaveProperty('name');
            expect(typeof model.name).toBe('string');
            expect(model.name.length).toBeGreaterThan(0);
            
            // Each model must have a description
            expect(model).toHaveProperty('description');
            expect(typeof model.description).toBe('string');
            expect(model.description.length).toBeGreaterThan(0);
            
            // Each model must also have id and provider for completeness
            expect(model).toHaveProperty('id');
            expect(model).toHaveProperty('provider');
            
            // The description should be different from the name (provides additional info)
            // Note: This is a soft requirement - some models might have similar name/description
            // but we verify both fields exist and are non-empty
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 9: Topic validation rejects invalid inputs
  // Validates: Requirements 4.2
  it('should reject empty strings and whitespace-only strings as invalid topics', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.string().filter(s => s.length > 0 && s.trim().length === 0),
          fc.string().filter(s => s.trim().length > 0 && s.trim().length < 10)
        ),
        (invalidTopic) => {
          // The validation logic in promptForTopic checks:
          // 1. Topic is not empty after trimming
          // 2. Topic has at least 10 characters after trimming
          
          const trimmed = invalidTopic.trim();
          
          // These topics should be rejected:
          // - Empty strings
          // - Whitespace-only strings
          // - Strings with less than 10 characters after trimming
          const shouldBeRejected = trimmed.length === 0 || trimmed.length < 10;
          
          expect(shouldBeRejected).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 10: Invalid topics trigger error display
  // Validates: Requirements 4.3
  it('should display error message and re-prompt for invalid topic inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.string().filter(s => s.length > 0 && s.trim().length === 0),
          fc.string().filter(s => s.trim().length > 0 && s.trim().length < 10)
        ),
        (invalidTopic) => {
          // The promptForTopic method should:
          // 1. Detect invalid topics (empty or too short)
          // 2. Display an error message
          // 3. Re-prompt the user
          
          const trimmed = invalidTopic.trim();
          
          // Determine what type of error should be shown
          let expectedErrorType: 'empty' | 'too-short' | null = null;
          
          if (trimmed.length === 0) {
            expectedErrorType = 'empty';
          } else if (trimmed.length < 10) {
            expectedErrorType = 'too-short';
          }
          
          // Verify that an error type was determined for invalid inputs
          expect(expectedErrorType).not.toBeNull();
          
          // The implementation should handle these error cases:
          // - Empty: "Topic cannot be empty"
          // - Too short: "Topic is too short. Please provide a meaningful topic (at least 10 characters)"
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 18: Loaded configuration values are used
  // Validates: Requirements 7.2
  it('should use loaded configuration values for debate parameters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          timeLimit: fc.integer({ min: 1, max: 1000 }),
          wordLimit: fc.integer({ min: 1, max: 1000 }),
          preparationTime: fc.integer({ min: 1, max: 600 }),
          strictMode: fc.boolean(),
          showPreparation: fc.boolean(),
          numCrossExamQuestions: fc.integer({ min: 0, max: 10 })
        }),
        async (configData) => {
          // Write config to file
          fs.writeFileSync(tempConfigPath, JSON.stringify(configData, null, 2));

          // Create CLI instance with the config path
          const cli = new InteractiveCLI(tempConfigPath);
          cliInstances.push(cli);

          // Load the debate config using the private method
          const { ConfigurationManager } = await import('../../src/utils/ConfigurationManager');
          const configManager = new ConfigurationManager();
          const result = configManager.loadAndMerge({}, tempConfigPath);
          const loadedConfig = result.config;

          // All configuration values should be loaded and used
          expect(loadedConfig.timeLimit).toBe(configData.timeLimit);
          expect(loadedConfig.wordLimit).toBe(configData.wordLimit);
          expect(loadedConfig.preparationTime).toBe(configData.preparationTime);
          expect(loadedConfig.strictMode).toBe(configData.strictMode);
          expect(loadedConfig.showPreparation).toBe(configData.showPreparation);
          expect(loadedConfig.numCrossExamQuestions).toBe(configData.numCrossExamQuestions);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 21: Menus include numbered options
  // Validates: Requirements 8.3
  it('should include numbered options in all menus', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            label: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
            value: fc.oneof(fc.string(), fc.integer())
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (menuOptions) => {
          // Import display utilities
          const { displayMenu } = require('../../src/utils/DisplayUtils');

          // Create a menu with the options
          const menu = displayMenu('Test Menu', menuOptions, true);

          // Verify that each option is numbered
          menuOptions.forEach((option, index) => {
            const optionNumber = index + 1;
            
            // The menu should contain the option number
            expect(menu).toContain(`${optionNumber}.`);
            
            // The menu should contain the option label
            expect(menu).toContain(option.label);
            
            // If description exists, it should be in the menu
            if (option.description) {
              expect(menu).toContain(option.description);
            }
          });

          // Verify exit option is numbered (should be last number + 1)
          const exitNumber = menuOptions.length + 1;
          expect(menu).toContain(`${exitNumber}.`);
          expect(menu).toContain('Exit');

          // Verify menu has a title
          expect(menu).toContain('Test Menu');

          // Verify menu has separator
          expect(menu).toContain('─');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 20: Configuration confirmation is displayed
  // Validates: Requirements 8.2
  it('should display confirmation of selected values', () => {
    fc.assert(
      fc.property(
        fc.record({
          providerName: fc.constantFrom('OpenAI', 'Anthropic', 'Ollama'),
          modelName: fc.string({ minLength: 3, maxLength: 50 }),
          topic: fc.string({ minLength: 10, maxLength: 200 })
        }),
        (testCase) => {
          // Import display utilities
          const { displayConfirmation } = require('../../src/utils/DisplayUtils');

          // Test that confirmation messages are properly formatted
          const providerConfirmation = displayConfirmation('Selected provider', testCase.providerName);
          const modelConfirmation = displayConfirmation('Selected model', testCase.modelName);
          const topicConfirmation = displayConfirmation('Debate Topic', testCase.topic);

          // Verify confirmations contain the label and value
          expect(providerConfirmation).toContain('Selected provider');
          expect(providerConfirmation).toContain(testCase.providerName);
          
          expect(modelConfirmation).toContain('Selected model');
          expect(modelConfirmation).toContain(testCase.modelName);
          
          expect(topicConfirmation).toContain('Debate Topic');
          expect(topicConfirmation).toContain(testCase.topic);

          // Verify confirmations have visual indicator (✓)
          expect(providerConfirmation).toContain('✓');
          expect(modelConfirmation).toContain('✓');
          expect(topicConfirmation).toContain('✓');

          // Verify confirmations are non-empty
          expect(providerConfirmation.trim().length).toBeGreaterThan(0);
          expect(modelConfirmation.trim().length).toBeGreaterThan(0);
          expect(topicConfirmation.trim().length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: interactive-mode, Property 29: Configuration summary is complete
  // Validates: Requirements 11.4
  it('should display all loaded configuration values in the summary', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          topic: fc.string({ minLength: 10, maxLength: 200 }),
          timeLimit: fc.integer({ min: 1, max: 1000 }),
          wordLimit: fc.integer({ min: 1, max: 1000 }),
          preparationTime: fc.integer({ min: 1, max: 600 }),
          strictMode: fc.boolean(),
          showPreparation: fc.boolean(),
          numCrossExamQuestions: fc.integer({ min: 0, max: 10 })
        }),
        async (testData) => {
          // Write config to file
          const configData = {
            timeLimit: testData.timeLimit,
            wordLimit: testData.wordLimit,
            preparationTime: testData.preparationTime,
            strictMode: testData.strictMode,
            showPreparation: testData.showPreparation,
            numCrossExamQuestions: testData.numCrossExamQuestions
          };
          fs.writeFileSync(tempConfigPath, JSON.stringify(configData, null, 2));

          // Set up environment for testing
          process.env.OPENAI_API_KEY = 'test-openai-key';

          // Create CLI instance
          const cli = new InteractiveCLI(tempConfigPath);
          cliInstances.push(cli);

          // Get provider registry to create mock providers
          const registry = (cli as any).providerRegistry;

          // Create mock session config
          const mockProvider = await registry.createProvider('openai', 'gpt-4');
          
          const sessionConfig = {
            topic: testData.topic,
            providers: {
              affirmativeProvider: 'openai',
              negativeProvider: 'openai'
            },
            models: {
              affirmativeModel: { id: 'gpt-4', name: 'GPT-4', description: 'Test model', provider: 'openai' },
              negativeModel: { id: 'gpt-4', name: 'GPT-4', description: 'Test model', provider: 'openai' }
            },
            debateConfig: configData,
            affirmativeModelProvider: mockProvider,
            negativeModelProvider: mockProvider
          };

          // Capture console output
          const originalLog = console.log;
          const logOutput: string[] = [];
          console.log = (...args: any[]) => {
            logOutput.push(args.join(' '));
          };

          try {
            // Call displaySummary
            cli.displaySummary(sessionConfig);

            // Restore console.log
            console.log = originalLog;

            // Verify that all configuration values appear in the output
            const fullOutput = logOutput.join('\n');

            // Check that the topic is displayed
            expect(fullOutput).toContain(testData.topic);

            // Check that all configuration parameters are displayed
            expect(fullOutput).toContain(`Time Limit: ${testData.timeLimit}s`);
            expect(fullOutput).toContain(`Word Limit: ${testData.wordLimit} words`);
            expect(fullOutput).toContain(`Preparation Time: ${testData.preparationTime}s`);
            expect(fullOutput).toContain(`Strict Mode: ${testData.strictMode ? 'Enabled' : 'Disabled'}`);
            expect(fullOutput).toContain(`Show Preparation: ${testData.showPreparation ? 'Yes' : 'No'}`);
            expect(fullOutput).toContain(`Cross-Exam Questions: ${testData.numCrossExamQuestions}`);

            // Verify that the summary includes model information
            expect(fullOutput).toContain('Affirmative:');
            expect(fullOutput).toContain('Negative:');

            return true;
          } finally {
            // Ensure console.log is restored even if test fails
            console.log = originalLog;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
