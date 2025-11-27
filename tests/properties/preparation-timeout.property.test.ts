import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { DebateState } from '../../src/models/DebateState';
import { RoundType } from '../../src/models/RoundType';

describe('Preparation Timeout Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();

  // Feature: interactive-mode, Property 16: Preparation timeout stops generation
  // Validates: Requirements 6.6
  describe('Property 16: Preparation timeout stops generation', () => {
    it('should stop generation when preparation time limit is reached', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid topics
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          // Generate short preparation time limits (in seconds)
          fc.integer({ min: 1, max: 3 }),
          // Generate delays that would exceed the limit
          fc.integer({ min: 5000, max: 10000 }), // Delay in milliseconds (much longer than limit)
          async (topic, preparationTimeSeconds, generationDelayMs) => {
            // Create config with specific preparation time
            const config: DebateConfig = {
              ...DEFAULT_CONFIG,
              preparationTime: preparationTimeSeconds
            };

            // Create mock providers with delays that exceed the time limit
            const affirmativeModel = new MockAIProvider('Model_A', {
              defaultResponse: 'This is a very long preparation that would take too long to complete',
              delayMs: generationDelayMs
            });
            
            const negativeModel = new MockAIProvider('Model_B', {
              defaultResponse: 'This is another very long preparation that would take too long to complete',
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
            
            // Execute preparation phase (should timeout)
            const debateAfterPrep = await orchestrator.executePreparation(initialDebate);
            
            // Record end time
            const endTime = Date.now();
            const actualDurationMs = endTime - startTime;
            const actualDurationSeconds = actualDurationMs / 1000;
            
            // Property 1: Generation should stop when timeout is reached
            // The actual duration should be close to the configured limit (with tolerance)
            const toleranceSeconds = Math.max(preparationTimeSeconds * 0.3, 2);
            const maxAllowedSeconds = preparationTimeSeconds + toleranceSeconds;
            
            expect(actualDurationSeconds).toBeLessThanOrEqual(maxAllowedSeconds);
            
            // Property 2: Debate should still transition to PREPARATION state even with timeout
            expect(debateAfterPrep.state).toBe(DebateState.PREPARATION);
            
            // Property 3: Preparation round should exist even if generation was stopped
            expect(debateAfterPrep.rounds.length).toBe(1);
            expect(debateAfterPrep.rounds[0].type).toBe(RoundType.PREPARATION);
            
            // Property 4: Statements should exist (even if empty or partial)
            expect(debateAfterPrep.rounds[0].affirmativeStatement).toBeDefined();
            expect(debateAfterPrep.rounds[0].negativeStatement).toBeDefined();
            
            // Property 5: The generation should have been stopped before completing
            // (the delay is much longer than the timeout, so if it completed, we'd see the full delay)
            const expectedMinDurationIfCompleted = generationDelayMs / 1000;
            expect(actualDurationSeconds).toBeLessThan(expectedMinDurationIfCompleted);
          }
        ),
        { numRuns: 20 } // Reduced runs due to timeout testing
      );
    }, 120000); // 120 second timeout

    it('should proceed to next phase after timeout with partial content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1, max: 2 }), // Very short timeout
          async (topic, preparationTimeSeconds) => {
            const config: DebateConfig = {
              ...DEFAULT_CONFIG,
              preparationTime: preparationTimeSeconds
            };

            // Create providers with long delays
            const affirmativeModel = new MockAIProvider('Model_A', {
              defaultResponse: 'Long preparation content',
              delayMs: 10000 // 10 seconds - much longer than timeout
            });
            
            const negativeModel = new MockAIProvider('Model_B', {
              defaultResponse: 'Long preparation content',
              delayMs: 10000
            });
            
            const initialDebate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            // Execute preparation (should timeout)
            const debateAfterPrep = await orchestrator.executePreparation(initialDebate);
            
            // Should proceed to next phase successfully
            expect(debateAfterPrep.state).toBe(DebateState.PREPARATION);
            expect(debateAfterPrep.rounds.length).toBe(1);
            
            // Should have preparation round even with timeout
            const prepRound = debateAfterPrep.rounds[0];
            expect(prepRound.type).toBe(RoundType.PREPARATION);
            expect(prepRound.affirmativeStatement).toBeDefined();
            expect(prepRound.negativeStatement).toBeDefined();
          }
        ),
        { numRuns: 20 }
      );
    }, 120000);

    it('should handle timeout consistently across multiple debates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1, max: 3 }),
          async (topic, preparationTimeSeconds) => {
            const config: DebateConfig = {
              ...DEFAULT_CONFIG,
              preparationTime: preparationTimeSeconds
            };

            // Run the same debate setup twice
            const durations: number[] = [];
            
            for (let i = 0; i < 2; i++) {
              const affirmativeModel = new MockAIProvider('Model_A', {
                defaultResponse: 'Preparation content',
                delayMs: 8000 // Exceeds timeout
              });
              
              const negativeModel = new MockAIProvider('Model_B', {
                defaultResponse: 'Preparation content',
                delayMs: 8000
              });
              
              const debate = orchestrator.initializeDebate(
                topic,
                config,
                affirmativeModel,
                negativeModel
              );
              
              const start = Date.now();
              await orchestrator.executePreparation(debate);
              const duration = (Date.now() - start) / 1000;
              
              durations.push(duration);
            }
            
            // Both runs should timeout at approximately the same time
            const tolerance = Math.max(preparationTimeSeconds * 0.3, 2);
            const maxAllowed = preparationTimeSeconds + tolerance;
            
            expect(durations[0]).toBeLessThanOrEqual(maxAllowed);
            expect(durations[1]).toBeLessThanOrEqual(maxAllowed);
            
            // The two durations should be similar (within tolerance of each other)
            const difference = Math.abs(durations[0] - durations[1]);
            expect(difference).toBeLessThan(tolerance);
          }
        ),
        { numRuns: 10 } // Fewer runs since this runs multiple debates
      );
    }, 120000);

    it('should display timeout message when limit is reached', async () => {
      // Capture console.warn output
      const originalWarn = console.warn;
      const warnMessages: string[] = [];
      console.warn = (message: string) => {
        warnMessages.push(message);
      };

      try {
        const config: DebateConfig = {
          ...DEFAULT_CONFIG,
          preparationTime: 1 // 1 second
        };

        const affirmativeModel = new MockAIProvider('Model_A', {
          defaultResponse: 'Preparation content',
          delayMs: 5000 // 5 seconds - exceeds timeout
        });
        
        const negativeModel = new MockAIProvider('Model_B', {
          defaultResponse: 'Preparation content',
          delayMs: 5000
        });
        
        const debate = orchestrator.initializeDebate(
          'Test topic',
          config,
          affirmativeModel,
          negativeModel
        );
        
        await orchestrator.executePreparation(debate);
        
        // Should have displayed timeout message
        const timeoutMessage = warnMessages.find(msg => 
          msg.includes('Preparation time limit') && msg.includes('reached')
        );
        
        expect(timeoutMessage).toBeDefined();
        expect(timeoutMessage).toContain('1 seconds');
        expect(timeoutMessage).toContain('Proceeding to next phase');
      } finally {
        // Restore console.warn
        console.warn = originalWarn;
      }
    }, 30000);
  });
});
