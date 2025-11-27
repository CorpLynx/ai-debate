/**
 * Property-based tests for timeout and retry logic
 * Feature: ai-debate-system, Property 18: Timeouts trigger exactly one retry
 * Validates: Requirements 9.2
 */

import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig } from '../../src/models/DebateConfig';

describe('Property 18: Timeouts trigger exactly one retry', () => {
  /**
   * For any model generation timeout, the system should attempt exactly one retry
   * before reporting failure.
   */
  it('should retry exactly once when a timeout occurs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (topic) => {
          // Use a fixed short timeout for faster testing
          const timeoutSeconds = 1;
          
          // Create orchestrator
          const orchestrator = new DebateOrchestratorImpl();
          
          // Create mock providers
          // The negative model will have a delay that exceeds even the retry timeout
          const affirmativeModel = new MockAIProvider('AffirmativeModel');
          const retryTimeout = (timeoutSeconds * 1000) * 1.5; // Exponential backoff timeout
          const negativeModel = new MockAIProvider('NegativeModel', {
            delayMs: retryTimeout + 200 // Delay longer than retry timeout
          });
          
          // Create config with short timeout
          const config: DebateConfig = {
            timeLimit: timeoutSeconds,
            strictMode: false,
            showPreparation: true,
            numCrossExamQuestions: 3
          };
          
          // Initialize debate
          const debate = orchestrator.initializeDebate(
            topic,
            config,
            affirmativeModel,
            negativeModel
          );
          
          // Reset call count before test
          negativeModel.resetCallCount();
          
          // Try to execute preparation (which will timeout on negative model)
          let caughtError = false;
          let errorMessage = '';
          
          try {
            await orchestrator.executePreparation(debate);
          } catch (error) {
            caughtError = true;
            errorMessage = (error as Error).message;
            // Error should be thrown after retry
          }
          
          // Verify error was caught
          if (!caughtError) {
            console.log('No error caught! Negative model call count:', negativeModel.getCallCount());
            console.log('Debate state:', debate.state);
          }
          expect(caughtError).toBe(true);
          
          // Verify the model was called exactly twice (initial attempt + 1 retry)
          expect(negativeModel.getCallCount()).toBe(2);
        }
      ),
      { numRuns: 10, timeout: 30000 } // Reduced runs due to actual delays in test
    );
  }, 35000); // Jest timeout

  /**
   * For any model generation that succeeds on retry, the system should return
   * the successful response.
   */
  it('should succeed on retry if the second attempt completes within timeout', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        async (topic) => {
          // Use a fixed short timeout for faster testing
          const timeoutSeconds = 1;
          
          // Create orchestrator
          const orchestrator = new DebateOrchestratorImpl();
          
          // Create mock providers
          const affirmativeModel = new MockAIProvider('AffirmativeModel');
          
          // Create a provider that times out on first call but succeeds on second
          let callCount = 0;
          const negativeModel = new MockAIProvider('NegativeModel');
          
          // Override generateResponse to simulate timeout on first call only
          const originalGenerate = negativeModel.generateResponse.bind(negativeModel);
          negativeModel.generateResponse = async (prompt, context) => {
            callCount++;
            if (callCount === 1) {
              // First call: delay longer than initial timeout
              await new Promise(resolve => setTimeout(resolve, (timeoutSeconds * 1000) + 200));
            } else {
              // Second call: respond quickly (within retry timeout)
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            return originalGenerate(prompt, context);
          };
          
          // Create config with timeout
          const config: DebateConfig = {
            timeLimit: timeoutSeconds,
            strictMode: false,
            showPreparation: true,
            numCrossExamQuestions: 3
          };
          
          // Initialize debate
          const debate = orchestrator.initializeDebate(
            topic,
            config,
            affirmativeModel,
            negativeModel
          );
          
          // Execute preparation (should succeed on retry)
          const result = await orchestrator.executePreparation(debate);
          
          // Verify the preparation succeeded
          expect(result.rounds.length).toBe(1);
          expect(result.rounds[0].negativeStatement).toBeDefined();
          
          // Verify the model was called exactly twice (initial attempt + 1 retry)
          expect(callCount).toBe(2);
        }
      ),
      { numRuns: 20, timeout: 60000 } // Reduce runs for this slower test
    );
  }, 65000); // Jest timeout

  /**
   * For any non-timeout error, the system should not retry and should fail immediately.
   */
  it('should not retry for non-timeout errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (topic, errorMessage) => {
          // Create orchestrator
          const orchestrator = new DebateOrchestratorImpl();
          
          // Create mock providers - negative model will fail with non-timeout error
          const affirmativeModel = new MockAIProvider('AffirmativeModel');
          const negativeModel = new MockAIProvider('NegativeModel', {
            shouldFail: true,
            failureMessage: errorMessage
          });
          
          // Create config
          const config: DebateConfig = {
            timeLimit: 120,
            strictMode: false,
            showPreparation: true,
            numCrossExamQuestions: 3
          };
          
          // Initialize debate
          const debate = orchestrator.initializeDebate(
            topic,
            config,
            affirmativeModel,
            negativeModel
          );
          
          // Reset call count before test
          negativeModel.resetCallCount();
          
          // Try to execute preparation (which will fail on negative model)
          let caughtError = false;
          
          try {
            await orchestrator.executePreparation(debate);
          } catch (error) {
            caughtError = true;
            // Error should be thrown immediately without retry
          }
          
          // Verify error was caught
          expect(caughtError).toBe(true);
          
          // Verify the model was called exactly once (no retry for non-timeout errors)
          expect(negativeModel.getCallCount()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
