import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { DebateState } from '../../src/models/DebateState';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { Debate } from '../../src/models/Debate';

describe('State Machine Property Tests', () => {
  // Feature: ai-debate-system, Property 5: Debate state machine follows correct sequence
  // Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.6, 3.7
  describe('Property 5: Debate state machine follows correct sequence', () => {
    it('should follow the exact sequence: INITIALIZED → PREPARATION → OPENING_STATEMENTS → REBUTTALS → CROSS_EXAMINATION → CLOSING_STATEMENTS → COMPLETED', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            const model1 = new MockAIProvider(model1Name);
            const model2 = new MockAIProvider(model2Name);
            
            // Initialize debate - should be in INITIALIZED state
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, model1, model2);
            expect(debate.state).toBe(DebateState.INITIALIZED);
            
            // Execute preparation - should transition to PREPARATION
            debate = await orchestrator.executePreparation(debate);
            expect(debate.state).toBe(DebateState.PREPARATION);
            
            // Execute opening statements - should transition to OPENING_STATEMENTS
            debate = await orchestrator.executeOpeningStatements(debate);
            expect(debate.state).toBe(DebateState.OPENING_STATEMENTS);
            
            // Execute rebuttals - should transition to REBUTTALS
            debate = await orchestrator.executeRebuttals(debate);
            expect(debate.state).toBe(DebateState.REBUTTALS);
            
            // Execute cross-examination - should transition to CROSS_EXAMINATION
            debate = await orchestrator.executeCrossExamination(debate);
            expect(debate.state).toBe(DebateState.CROSS_EXAMINATION);
            
            // Execute closing statements - should transition to CLOSING_STATEMENTS
            debate = await orchestrator.executeClosingStatements(debate);
            expect(debate.state).toBe(DebateState.CLOSING_STATEMENTS);
            
            // Complete debate - should transition to COMPLETED
            debate = await orchestrator.completeDebate(debate);
            expect(debate.state).toBe(DebateState.COMPLETED);
            expect(debate.completedAt).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent skipping states in the sequence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            const model1 = new MockAIProvider(model1Name);
            const model2 = new MockAIProvider(model2Name);
            
            const debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, model1, model2);
            
            // Try to skip directly to OPENING_STATEMENTS without PREPARATION
            await expect(orchestrator.executeOpeningStatements(debate)).rejects.toThrow(/Invalid state transition/);
            
            // Try to skip directly to REBUTTALS
            await expect(orchestrator.executeRebuttals(debate)).rejects.toThrow(/Invalid state transition/);
            
            // Try to skip directly to CROSS_EXAMINATION
            await expect(orchestrator.executeCrossExamination(debate)).rejects.toThrow(/Invalid state transition/);
            
            // Try to skip directly to CLOSING_STATEMENTS
            await expect(orchestrator.executeClosingStatements(debate)).rejects.toThrow(/Invalid state transition/);
            
            // Try to skip directly to COMPLETED
            await expect(orchestrator.completeDebate(debate)).rejects.toThrow(/Invalid state transition/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent going backwards in the state sequence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            const model1 = new MockAIProvider(model1Name);
            const model2 = new MockAIProvider(model2Name);
            
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, model1, model2);
            
            // Progress to OPENING_STATEMENTS
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            
            // Try to go back to PREPARATION
            await expect(orchestrator.executePreparation(debate)).rejects.toThrow(/Invalid state transition/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent repeating the same state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            const model1 = new MockAIProvider(model1Name);
            const model2 = new MockAIProvider(model2Name);
            
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, model1, model2);
            
            // Execute preparation once
            debate = await orchestrator.executePreparation(debate);
            
            // Try to execute preparation again
            await expect(orchestrator.executePreparation(debate)).rejects.toThrow(/Invalid state transition/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not allow any transitions from COMPLETED state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            const model1 = new MockAIProvider(model1Name);
            const model2 = new MockAIProvider(model2Name);
            
            // Progress through all states to COMPLETED
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, model1, model2);
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            debate = await orchestrator.executeCrossExamination(debate);
            debate = await orchestrator.executeClosingStatements(debate);
            debate = await orchestrator.completeDebate(debate);
            
            // Try to execute any state transition from COMPLETED
            await expect(orchestrator.executePreparation(debate)).rejects.toThrow(/Invalid state transition/);
            await expect(orchestrator.executeOpeningStatements(debate)).rejects.toThrow(/Invalid state transition/);
            await expect(orchestrator.executeRebuttals(debate)).rejects.toThrow(/Invalid state transition/);
            await expect(orchestrator.executeCrossExamination(debate)).rejects.toThrow(/Invalid state transition/);
            await expect(orchestrator.executeClosingStatements(debate)).rejects.toThrow(/Invalid state transition/);
            await expect(orchestrator.completeDebate(debate)).rejects.toThrow(/Invalid state transition/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
