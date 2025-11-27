import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { DebateState } from '../../src/models/DebateState';
import { RoundType } from '../../src/models/RoundType';

describe('Preparation Time Limit Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();

  // Feature: interactive-mode, Property 13: Preparation time limit is enforced
  // Validates: Requirements 5.5
  describe('Property 13: Preparation time limit is enforced', () => {
    it('should enforce preparation time limit and not exceed configured duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid topics
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          // Generate preparation time limits (in seconds)
          fc.integer({ min: 1, max: 5 }), // Use short times for testing
          // Generate response generation delays that would exceed the limit
          fc.integer({ min: 2000, max: 3000 }), // Delay in milliseconds
          async (topic, preparationTimeSeconds, generationDelayMs) => {
            // Create config with specific preparation time
            const config: DebateConfig = {
              ...DEFAULT_CONFIG,
              preparationTime: preparationTimeSeconds
            };

            // Create mock providers with delays that would exceed the time limit
            const affirmativeModel = new MockAIProvider('Model_A', {
              defaultResponse: 'Affirmative preparation content',
              delayMs: generationDelayMs
            });
            
            const negativeModel = new MockAIProvider('Model_B', {
              defaultResponse: 'Negative preparation content',
              delayMs: generationDelayMs
            });
            
            // Initialize debate
            const initialDebate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            // Record start time
            const startTime = Date.now();
            
            // Execute preparation phase
            const debateAfterPrep = await orchestrator.executePreparation(initialDebate);
            
            // Record end time
            const endTime = Date.now();
            const actualDurationMs = endTime - startTime;
            const actualDurationSeconds = actualDurationMs / 1000;
            
            // Property: Preparation should not significantly exceed the configured time limit
            // Allow some tolerance for execution overhead (e.g., 20% or 2 seconds, whichever is larger)
            const toleranceSeconds = Math.max(preparationTimeSeconds * 0.2, 2);
            const maxAllowedSeconds = preparationTimeSeconds + toleranceSeconds;
            
            expect(actualDurationSeconds).toBeLessThanOrEqual(maxAllowedSeconds);
            
            // Verify state transitioned correctly
            expect(debateAfterPrep.state).toBe(DebateState.PREPARATION);
            
            // Verify preparation round exists
            expect(debateAfterPrep.rounds.length).toBe(1);
            expect(debateAfterPrep.rounds[0].type).toBe(RoundType.PREPARATION);
          }
        ),
        { numRuns: 20 } // Reduced runs due to timeout testing
      );
    }, 120000); // 120 second timeout

    it('should complete preparation within time limit when generation is fast', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 5, max: 30 }), // Preparation time in seconds
          fc.string({ minLength: 10, maxLength: 200 }), // Response content
          async (topic, preparationTimeSeconds, responseContent) => {
            const config: DebateConfig = {
              ...DEFAULT_CONFIG,
              preparationTime: preparationTimeSeconds
            };

            // Create fast providers (no artificial delay)
            const affirmativeModel = new MockAIProvider('Model_A', {
              defaultResponse: responseContent,
              delayMs: 10 // Very fast
            });
            
            const negativeModel = new MockAIProvider('Model_B', {
              defaultResponse: responseContent,
              delayMs: 10 // Very fast
            });
            
            const initialDebate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            const startTime = Date.now();
            const debateAfterPrep = await orchestrator.executePreparation(initialDebate);
            const endTime = Date.now();
            
            const actualDurationSeconds = (endTime - startTime) / 1000;
            
            // When generation is fast, it should complete well within the limit
            expect(actualDurationSeconds).toBeLessThan(preparationTimeSeconds);
            
            // Verify preparation completed successfully
            expect(debateAfterPrep.state).toBe(DebateState.PREPARATION);
            expect(debateAfterPrep.rounds[0].affirmativeStatement?.content).toBe(responseContent);
            expect(debateAfterPrep.rounds[0].negativeStatement?.content).toBe(responseContent);
          }
        ),
        { numRuns: 100 }
      );
    }, 30000); // 30 second timeout

    it('should respect different preparation time limits across debates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 6, max: 10 }),
          async (topic, shortTimeSeconds, longTimeSeconds) => {
            // Ensure shortTime < longTime
            const [preparationTime1, preparationTime2] = shortTimeSeconds < longTimeSeconds
              ? [shortTimeSeconds, longTimeSeconds]
              : [longTimeSeconds, shortTimeSeconds];

            const config1: DebateConfig = {
              ...DEFAULT_CONFIG,
              preparationTime: preparationTime1
            };

            const config2: DebateConfig = {
              ...DEFAULT_CONFIG,
              preparationTime: preparationTime2
            };

            // Create providers with moderate delay
            const createProviders = () => ({
              affirmative: new MockAIProvider('Model_A', {
                defaultResponse: 'Preparation content',
                delayMs: 1000
              }),
              negative: new MockAIProvider('Model_B', {
                defaultResponse: 'Preparation content',
                delayMs: 1000
              })
            });

            // First debate with shorter time limit
            const providers1 = createProviders();
            const debate1 = orchestrator.initializeDebate(
              topic,
              config1,
              providers1.affirmative,
              providers1.negative
            );
            
            const start1 = Date.now();
            await orchestrator.executePreparation(debate1);
            const duration1 = (Date.now() - start1) / 1000;

            // Second debate with longer time limit
            const providers2 = createProviders();
            const debate2 = orchestrator.initializeDebate(
              topic,
              config2,
              providers2.affirmative,
              providers2.negative
            );
            
            const start2 = Date.now();
            await orchestrator.executePreparation(debate2);
            const duration2 = (Date.now() - start2) / 1000;

            // Both should respect their respective limits (with tolerance)
            const tolerance1 = Math.max(preparationTime1 * 0.2, 2);
            const tolerance2 = Math.max(preparationTime2 * 0.2, 2);
            
            expect(duration1).toBeLessThanOrEqual(preparationTime1 + tolerance1);
            expect(duration2).toBeLessThanOrEqual(preparationTime2 + tolerance2);
          }
        ),
        { numRuns: 10 } // Fewer runs since this test runs two debates
      );
    }, 120000); // 120 second timeout
  });
});
