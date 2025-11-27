/**
 * Property-based tests for error logging
 * Feature: ai-debate-system, Property 17: Model failures trigger error logging
 * Validates: Requirements 9.1
 */

import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';

describe('Property 17: Model failures trigger error logging', () => {
  /**
   * For any model generation failure, the system should produce an error log entry
   * and return an error notification.
   */
  it('should log errors with context when model generation fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.constantFrom(
          RoundType.PREPARATION,
          RoundType.OPENING,
          RoundType.REBUTTAL,
          RoundType.CROSS_EXAM,
          RoundType.CLOSING
        ),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (topic, roundType, errorMessage) => {
          // Create orchestrator
          const orchestrator = new DebateOrchestratorImpl();
          
          // Create mock providers - one will fail
          const affirmativeModel = new MockAIProvider('AffirmativeModel');
          const negativeModel = new MockAIProvider('NegativeModel', {
            shouldFail: true,
            failureMessage: errorMessage
          });
          
          // Create config
          const config: DebateConfig = {
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
          
          // Try to execute the round that will fail
          let caughtError = false;
          
          try {
            switch (roundType) {
              case RoundType.PREPARATION:
                await orchestrator.executePreparation(debate);
                break;
              case RoundType.OPENING:
                // Need to go through preparation first
                const afterPrep = await orchestrator.executePreparation(debate);
                await orchestrator.executeOpeningStatements(afterPrep);
                break;
              case RoundType.REBUTTAL:
                // Need to go through preparation and opening first
                const afterPrep2 = await orchestrator.executePreparation(debate);
                const afterOpening = await orchestrator.executeOpeningStatements(afterPrep2);
                await orchestrator.executeRebuttals(afterOpening);
                break;
              case RoundType.CROSS_EXAM:
                // Need to go through preparation, opening, and rebuttals first
                const afterPrep3 = await orchestrator.executePreparation(debate);
                const afterOpening2 = await orchestrator.executeOpeningStatements(afterPrep3);
                const afterRebuttals = await orchestrator.executeRebuttals(afterOpening2);
                await orchestrator.executeCrossExamination(afterRebuttals);
                break;
              case RoundType.CLOSING:
                // Need to go through all previous rounds first
                const afterPrep4 = await orchestrator.executePreparation(debate);
                const afterOpening3 = await orchestrator.executeOpeningStatements(afterPrep4);
                const afterRebuttals2 = await orchestrator.executeRebuttals(afterOpening3);
                const afterCross = await orchestrator.executeCrossExamination(afterRebuttals2);
                await orchestrator.executeClosingStatements(afterCross);
                break;
            }
          } catch (error) {
            caughtError = true;
            // Error should be thrown
          }
          
          // Verify error was caught
          expect(caughtError).toBe(true);
          
          // Verify error was logged (errors array should exist and have at least one entry)
          expect(debate.errors).toBeDefined();
          expect(debate.errors!.length).toBeGreaterThan(0);
          
          // Verify the error log contains the expected information
          // Find the error with the model name (the first one logged by generateWithErrorHandling)
          const modelError = debate.errors!.find(e => e.model === 'NegativeModel');
          expect(modelError).toBeDefined();
          expect(modelError!.message).toBe(errorMessage);
          expect(modelError!.state).toBeDefined();
          expect(modelError!.timestamp).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});
