import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

describe('Turn-Taking Property Tests', () => {
  // Feature: ai-debate-system, Property 6: Turn-taking within rounds is correct
  // Validates: Requirements 3.3
  describe('Property 6: Turn-taking within rounds is correct', () => {
    it('should prompt affirmative model before negative model in opening statements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            
            // Create mock providers that track when they're called
            const callOrder: string[] = [];
            
            const affirmativeModel = new MockAIProvider(model1Name);
            const originalAffirmativeGenerate = affirmativeModel.generateResponse.bind(affirmativeModel);
            affirmativeModel.generateResponse = async (prompt: string, context: any) => {
              callOrder.push('affirmative');
              return originalAffirmativeGenerate(prompt, context);
            };
            
            const negativeModel = new MockAIProvider(model2Name);
            const originalNegativeGenerate = negativeModel.generateResponse.bind(negativeModel);
            negativeModel.generateResponse = async (prompt: string, context: any) => {
              callOrder.push('negative');
              return originalNegativeGenerate(prompt, context);
            };
            
            // Initialize and progress to opening statements
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
            debate = await orchestrator.executePreparation(debate);
            
            // Clear call order from preparation phase
            callOrder.length = 0;
            
            // Execute opening statements
            debate = await orchestrator.executeOpeningStatements(debate);
            
            // Verify affirmative was called before negative
            expect(callOrder.length).toBe(2);
            expect(callOrder[0]).toBe('affirmative');
            expect(callOrder[1]).toBe('negative');
            
            // Verify both statements are stored
            const openingRound = debate.rounds.find(r => r.type === RoundType.OPENING);
            expect(openingRound).toBeDefined();
            expect(openingRound!.affirmativeStatement).toBeDefined();
            expect(openingRound!.negativeStatement).toBeDefined();
            
            // Verify positions are correct
            expect(openingRound!.affirmativeStatement!.position).toBe(Position.AFFIRMATIVE);
            expect(openingRound!.negativeStatement!.position).toBe(Position.NEGATIVE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure affirmative statement is generated before negative statement is prompted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            
            let affirmativeCompleted = false;
            let negativeStarted = false;
            let isOpeningRound = false;
            
            const affirmativeModel = new MockAIProvider(model1Name);
            const originalAffirmativeGenerate = affirmativeModel.generateResponse.bind(affirmativeModel);
            affirmativeModel.generateResponse = async (prompt: string, context: any) => {
              const result = await originalAffirmativeGenerate(prompt, context);
              if (isOpeningRound && context.roundType === RoundType.OPENING) {
                affirmativeCompleted = true;
              }
              return result;
            };
            
            const negativeModel = new MockAIProvider(model2Name);
            const originalNegativeGenerate = negativeModel.generateResponse.bind(negativeModel);
            negativeModel.generateResponse = async (prompt: string, context: any) => {
              if (isOpeningRound && context.roundType === RoundType.OPENING) {
                negativeStarted = true;
                // At this point, affirmative should have completed
                expect(affirmativeCompleted).toBe(true);
              }
              return originalNegativeGenerate(prompt, context);
            };
            
            // Initialize and progress to opening statements
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
            debate = await orchestrator.executePreparation(debate);
            
            // Mark that we're now in the opening round
            isOpeningRound = true;
            
            // Execute opening statements
            await orchestrator.executeOpeningStatements(debate);
            
            // Verify both flags were set
            expect(affirmativeCompleted).toBe(true);
            expect(negativeStarted).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store both statements in the correct order in the debate round', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            affirmativeResponse: fc.string({ minLength: 10 }),
            negativeResponse: fc.string({ minLength: 10 })
          }),
          async ({ topic, affirmativeResponse, negativeResponse }) => {
            const orchestrator = new DebateOrchestratorImpl();
            
            // Create models with specific responses
            const affirmativeModel = new MockAIProvider('AffirmativeModel', {
              defaultResponse: affirmativeResponse
            });
            const negativeModel = new MockAIProvider('NegativeModel', {
              defaultResponse: negativeResponse
            });
            
            // Initialize and progress to opening statements
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            
            // Find the opening round
            const openingRound = debate.rounds.find(r => r.type === RoundType.OPENING);
            expect(openingRound).toBeDefined();
            
            // Verify both statements exist
            expect(openingRound!.affirmativeStatement).toBeDefined();
            expect(openingRound!.negativeStatement).toBeDefined();
            
            // Verify content matches
            expect(openingRound!.affirmativeStatement!.content).toBe(affirmativeResponse);
            expect(openingRound!.negativeStatement!.content).toBe(negativeResponse);
            
            // Verify affirmative statement was generated before negative
            // (generatedAt timestamp should be earlier or equal)
            expect(openingRound!.affirmativeStatement!.generatedAt.getTime())
              .toBeLessThanOrEqual(openingRound!.negativeStatement!.generatedAt.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: ai-debate-system, Property 11: Cross-examination follows correct turn sequence
  // Validates: Requirements 6.1, 6.2, 6.3, 6.4
  describe('Property 11: Cross-examination follows correct turn sequence', () => {
    it('should follow the sequence: affirmative asks → negative responds → negative asks → affirmative responds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            
            // Track the order of calls during cross-examination
            const callOrder: Array<{ position: string; type: string; prompt: string }> = [];
            
            const affirmativeModel = new MockAIProvider(model1Name);
            const originalAffirmativeGenerate = affirmativeModel.generateResponse.bind(affirmativeModel);
            affirmativeModel.generateResponse = async (prompt: string, context: any) => {
              if (context.roundType === RoundType.CROSS_EXAM) {
                const type = prompt.includes('pose a challenging question') ? 'question' : 'response';
                callOrder.push({ position: 'affirmative', type, prompt });
              }
              return originalAffirmativeGenerate(prompt, context);
            };
            
            const negativeModel = new MockAIProvider(model2Name);
            const originalNegativeGenerate = negativeModel.generateResponse.bind(negativeModel);
            negativeModel.generateResponse = async (prompt: string, context: any) => {
              if (context.roundType === RoundType.CROSS_EXAM) {
                const type = prompt.includes('pose a challenging question') ? 'question' : 'response';
                callOrder.push({ position: 'negative', type, prompt });
              }
              return originalNegativeGenerate(prompt, context);
            };
            
            // Initialize and progress through debate to cross-examination
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            
            // Execute cross-examination
            debate = await orchestrator.executeCrossExamination(debate);
            
            // Verify the exact turn sequence
            expect(callOrder.length).toBe(4);
            
            // Requirement 6.1: Affirmative asks question first
            expect(callOrder[0].position).toBe('affirmative');
            expect(callOrder[0].type).toBe('question');
            
            // Requirement 6.2: Negative responds to affirmative's question
            expect(callOrder[1].position).toBe('negative');
            expect(callOrder[1].type).toBe('response');
            
            // Requirement 6.3: Negative asks question
            expect(callOrder[2].position).toBe('negative');
            expect(callOrder[2].type).toBe('question');
            
            // Requirement 6.4: Affirmative responds to negative's question
            expect(callOrder[3].position).toBe('affirmative');
            expect(callOrder[3].type).toBe('response');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure affirmative question is generated before negative response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            
            let affirmativeQuestionGenerated = false;
            let negativeResponseStarted = false;
            
            const affirmativeModel = new MockAIProvider(model1Name);
            const originalAffirmativeGenerate = affirmativeModel.generateResponse.bind(affirmativeModel);
            affirmativeModel.generateResponse = async (prompt: string, context: any) => {
              const result = await originalAffirmativeGenerate(prompt, context);
              if (context.roundType === RoundType.CROSS_EXAM && prompt.includes('pose a challenging question')) {
                affirmativeQuestionGenerated = true;
              }
              return result;
            };
            
            const negativeModel = new MockAIProvider(model2Name);
            const originalNegativeGenerate = negativeModel.generateResponse.bind(negativeModel);
            negativeModel.generateResponse = async (prompt: string, context: any) => {
              if (context.roundType === RoundType.CROSS_EXAM && prompt.includes('Your opponent has asked you')) {
                negativeResponseStarted = true;
                // Affirmative question must be generated before negative responds
                expect(affirmativeQuestionGenerated).toBe(true);
              }
              return originalNegativeGenerate(prompt, context);
            };
            
            // Initialize and progress through debate
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            
            // Execute cross-examination
            await orchestrator.executeCrossExamination(debate);
            
            // Verify both flags were set
            expect(affirmativeQuestionGenerated).toBe(true);
            expect(negativeResponseStarted).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure negative question is generated before affirmative response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            model1Name: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            model2Name: fc.string({ minLength: 1 }).map(s => `Model2_${s}`)
          }),
          async ({ topic, model1Name, model2Name }) => {
            const orchestrator = new DebateOrchestratorImpl();
            
            let negativeQuestionGenerated = false;
            let affirmativeResponseStarted = false;
            
            const affirmativeModel = new MockAIProvider(model1Name);
            const originalAffirmativeGenerate = affirmativeModel.generateResponse.bind(affirmativeModel);
            affirmativeModel.generateResponse = async (prompt: string, context: any) => {
              if (context.roundType === RoundType.CROSS_EXAM && prompt.includes('Your opponent has asked you')) {
                affirmativeResponseStarted = true;
                // Negative question must be generated before affirmative responds
                expect(negativeQuestionGenerated).toBe(true);
              }
              return originalAffirmativeGenerate(prompt, context);
            };
            
            const negativeModel = new MockAIProvider(model2Name);
            const originalNegativeGenerate = negativeModel.generateResponse.bind(negativeModel);
            negativeModel.generateResponse = async (prompt: string, context: any) => {
              const result = await originalNegativeGenerate(prompt, context);
              if (context.roundType === RoundType.CROSS_EXAM && prompt.includes('pose a challenging question')) {
                negativeQuestionGenerated = true;
              }
              return result;
            };
            
            // Initialize and progress through debate
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            
            // Execute cross-examination
            await orchestrator.executeCrossExamination(debate);
            
            // Verify both flags were set
            expect(negativeQuestionGenerated).toBe(true);
            expect(affirmativeResponseStarted).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should store cross-examination statements in the debate round', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            topic: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
            affirmativeQuestion: fc.string({ minLength: 5 }),
            negativeResponse: fc.string({ minLength: 5 }),
            negativeQuestion: fc.string({ minLength: 5 }),
            affirmativeResponse: fc.string({ minLength: 5 })
          }),
          async ({ topic, affirmativeQuestion, negativeResponse, negativeQuestion, affirmativeResponse }) => {
            const orchestrator = new DebateOrchestratorImpl();
            
            // Create models with specific responses
            let affirmativeCallCount = 0;
            const affirmativeModel = new MockAIProvider('AffirmativeModel');
            const originalAffirmativeGenerate = affirmativeModel.generateResponse.bind(affirmativeModel);
            affirmativeModel.generateResponse = async (prompt: string, context: any) => {
              if (context.roundType === RoundType.CROSS_EXAM) {
                affirmativeCallCount++;
                return affirmativeCallCount === 1 ? affirmativeQuestion : affirmativeResponse;
              }
              return originalAffirmativeGenerate(prompt, context);
            };
            
            let negativeCallCount = 0;
            const negativeModel = new MockAIProvider('NegativeModel');
            const originalNegativeGenerate = negativeModel.generateResponse.bind(negativeModel);
            negativeModel.generateResponse = async (prompt: string, context: any) => {
              if (context.roundType === RoundType.CROSS_EXAM) {
                negativeCallCount++;
                return negativeCallCount === 1 ? negativeResponse : negativeQuestion;
              }
              return originalNegativeGenerate(prompt, context);
            };
            
            // Initialize and progress through debate
            let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            debate = await orchestrator.executeCrossExamination(debate);
            
            // Find the cross-examination round
            const crossExamRound = debate.rounds.find(r => r.type === RoundType.CROSS_EXAM);
            expect(crossExamRound).toBeDefined();
            
            // Verify both statements exist
            expect(crossExamRound!.affirmativeStatement).toBeDefined();
            expect(crossExamRound!.negativeStatement).toBeDefined();
            
            // Verify content includes both question and response for each position
            expect(crossExamRound!.affirmativeStatement!.content).toContain(affirmativeQuestion);
            expect(crossExamRound!.affirmativeStatement!.content).toContain(affirmativeResponse);
            expect(crossExamRound!.negativeStatement!.content).toContain(negativeResponse);
            expect(crossExamRound!.negativeStatement!.content).toContain(negativeQuestion);
            
            // Verify positions are correct
            expect(crossExamRound!.affirmativeStatement!.position).toBe(Position.AFFIRMATIVE);
            expect(crossExamRound!.negativeStatement!.position).toBe(Position.NEGATIVE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
