import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';

describe('Transcript Metadata Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();
  const transcriptManager = new TranscriptManagerImpl();

  // Feature: ai-debate-system, Property 15: Transcript includes all required metadata
  // Validates: Requirements 8.2
  describe('Property 15: Transcript includes all required metadata', () => {
    it('should include debate topic in transcript', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid topic
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify topic is included in summary
            expect(transcript.summary.topic).toBe(topic);
            
            // Verify topic is also accessible through debate object
            expect(transcript.debate.topic).toBe(topic);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include both model names in transcript', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, modelAName, modelBName, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider(modelAName);
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider(modelBName);
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify both model names are included
            expect(transcript.summary.models.affirmative).toBe(modelAName);
            expect(transcript.summary.models.negative).toBe(modelBName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include positions for both models', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify positions are clearly indicated in summary
            expect(transcript.summary.models).toHaveProperty('affirmative');
            expect(transcript.summary.models).toHaveProperty('negative');
            
            // Verify the models object has both positions
            expect(Object.keys(transcript.summary.models)).toContain('affirmative');
            expect(Object.keys(transcript.summary.models)).toContain('negative');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include preparation materials when present', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Find preparation round in transcript
            const prepRound = transcript.formattedRounds.find(
              r => r.roundType === RoundType.PREPARATION
            );
            
            expect(prepRound).toBeDefined();
            expect(prepRound!.affirmativeContent).toBe(affPrep);
            expect(prepRound!.negativeContent).toBe(negPrep);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all statements from all rounds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep, affOpening, negOpening, affRebuttal, negRebuttal) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            affirmativeModel.setResponse(RoundType.OPENING, affOpening);
            affirmativeModel.setResponse(RoundType.REBUTTAL, affRebuttal);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            negativeModel.setResponse(RoundType.OPENING, negOpening);
            negativeModel.setResponse(RoundType.REBUTTAL, negRebuttal);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify all statements are present
            const prepRound = transcript.formattedRounds.find(r => r.roundType === RoundType.PREPARATION);
            const openingRound = transcript.formattedRounds.find(r => r.roundType === RoundType.OPENING);
            const rebuttalRound = transcript.formattedRounds.find(r => r.roundType === RoundType.REBUTTAL);
            
            expect(prepRound?.affirmativeContent).toBe(affPrep);
            expect(prepRound?.negativeContent).toBe(negPrep);
            expect(openingRound?.affirmativeContent).toBe(affOpening);
            expect(openingRound?.negativeContent).toBe(negOpening);
            expect(rebuttalRound?.affirmativeContent).toBe(affRebuttal);
            expect(rebuttalRound?.negativeContent).toBe(negRebuttal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include round count in summary', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify round count matches actual rounds
            expect(transcript.summary.roundCount).toBe(debate.rounds.length);
            expect(transcript.summary.roundCount).toBe(1); // Only preparation executed
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include total duration in summary', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify total duration is present and is a number
            expect(typeof transcript.summary.totalDuration).toBe('number');
            expect(transcript.summary.totalDuration).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all required metadata fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify all required metadata fields are present
            expect(transcript.summary).toHaveProperty('topic');
            expect(transcript.summary).toHaveProperty('models');
            expect(transcript.summary).toHaveProperty('totalDuration');
            expect(transcript.summary).toHaveProperty('roundCount');
            
            // Verify models object has required structure
            expect(transcript.summary.models).toHaveProperty('affirmative');
            expect(transcript.summary.models).toHaveProperty('negative');
            
            // Verify debate object is included
            expect(transcript).toHaveProperty('debate');
            expect(transcript.debate).toBe(debate);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
