import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { DebateState } from '../../src/models/DebateState';
import { RoundType } from '../../src/models/RoundType';
import { Position } from '../../src/models/Position';

describe('Preparation Materials Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();

  // Feature: ai-debate-system, Property 7: Preparation materials are stored and retrievable
  // Validates: Requirements 4.3
  describe('Property 7: Preparation materials are stored and retrievable', () => {
    it('should store and retrieve preparation materials for both models', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid topics
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          // Generate preparation materials for affirmative model
          fc.string({ minLength: 10, maxLength: 500 }),
          // Generate preparation materials for negative model
          fc.string({ minLength: 10, maxLength: 500 }),
          async (topic, affirmativePrep, negativePrep) => {
            // Create mock AI providers with configured responses for preparation
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affirmativePrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negativePrep);
            
            // Initialize debate
            const initialDebate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            // Execute preparation phase
            const debateAfterPrep = await orchestrator.executePreparation(initialDebate);
            
            // Verify state transitioned to PREPARATION
            expect(debateAfterPrep.state).toBe(DebateState.PREPARATION);
            
            // Verify preparation round was added
            expect(debateAfterPrep.rounds.length).toBe(1);
            const prepRound = debateAfterPrep.rounds[0];
            expect(prepRound.type).toBe(RoundType.PREPARATION);
            
            // Verify affirmative preparation materials are stored and retrievable
            expect(prepRound.affirmativeStatement).toBeDefined();
            expect(prepRound.affirmativeStatement!.content).toBe(affirmativePrep);
            expect(prepRound.affirmativeStatement!.position).toBe(Position.AFFIRMATIVE);
            expect(prepRound.affirmativeStatement!.model).toBe('Model_A');
            
            // Verify negative preparation materials are stored and retrievable
            expect(prepRound.negativeStatement).toBeDefined();
            expect(prepRound.negativeStatement!.content).toBe(negativePrep);
            expect(prepRound.negativeStatement!.position).toBe(Position.NEGATIVE);
            expect(prepRound.negativeStatement!.model).toBe('Model_B');
            
            // Verify the stored content exactly matches what was generated
            const retrievedAffirmativePrep = prepRound.affirmativeStatement!.content;
            const retrievedNegativePrep = prepRound.negativeStatement!.content;
            
            expect(retrievedAffirmativePrep).toBe(affirmativePrep);
            expect(retrievedNegativePrep).toBe(negativePrep);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve preparation materials with special characters and formatting', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          // Generate preparation with various characters including newlines, tabs, etc.
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (topic, affirmativePrep, negativePrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affirmativePrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negativePrep);
            
            const initialDebate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            const debateAfterPrep = await orchestrator.executePreparation(initialDebate);
            
            const prepRound = debateAfterPrep.rounds[0];
            
            // Verify exact preservation including length and content
            expect(prepRound.affirmativeStatement!.content).toBe(affirmativePrep);
            expect(prepRound.affirmativeStatement!.content.length).toBe(affirmativePrep.length);
            
            expect(prepRound.negativeStatement!.content).toBe(negativePrep);
            expect(prepRound.negativeStatement!.content.length).toBe(negativePrep.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store preparation materials that can be retrieved multiple times with same result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (topic, affirmativePrep, negativePrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affirmativePrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negativePrep);
            
            const initialDebate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            const debateAfterPrep = await orchestrator.executePreparation(initialDebate);
            
            const prepRound = debateAfterPrep.rounds[0];
            
            // Retrieve multiple times
            const firstRetrieval = prepRound.affirmativeStatement!.content;
            const secondRetrieval = prepRound.affirmativeStatement!.content;
            const thirdRetrieval = prepRound.affirmativeStatement!.content;
            
            // All retrievals should be identical
            expect(firstRetrieval).toBe(affirmativePrep);
            expect(secondRetrieval).toBe(affirmativePrep);
            expect(thirdRetrieval).toBe(affirmativePrep);
            expect(firstRetrieval).toBe(secondRetrieval);
            expect(secondRetrieval).toBe(thirdRetrieval);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
