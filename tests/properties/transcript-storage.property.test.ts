import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Transcript Storage Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();
  const testTranscriptsDir = './test-transcripts';
  const transcriptManager = new TranscriptManagerImpl(testTranscriptsDir);

  // Clean up test transcripts directory before and after tests
  beforeAll(async () => {
    try {
      await fs.rm(testTranscriptsDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, that's okay
    }
  });

  afterAll(async () => {
    try {
      await fs.rm(testTranscriptsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // Feature: ai-debate-system, Property 16: Transcript storage round-trip preserves data
  // Validates: Requirements 8.4
  describe('Property 16: Transcript storage round-trip preserves data', () => {
    it('should preserve all transcript data when saving and loading', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid topic
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          // Generate statements for multiple rounds
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative prep
          fc.string({ minLength: 10, maxLength: 200 }), // negative prep
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative opening
          fc.string({ minLength: 10, maxLength: 200 }), // negative opening
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative rebuttal
          fc.string({ minLength: 10, maxLength: 200 }), // negative rebuttal
          async (
            topic,
            affPrep,
            negPrep,
            affOpening,
            negOpening,
            affRebuttal,
            negRebuttal
          ) => {
            // Create mock AI providers with configured responses
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            affirmativeModel.setResponse(RoundType.OPENING, affOpening);
            affirmativeModel.setResponse(RoundType.REBUTTAL, affRebuttal);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            negativeModel.setResponse(RoundType.OPENING, negOpening);
            negativeModel.setResponse(RoundType.REBUTTAL, negRebuttal);
            
            // Execute debate
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            
            // Generate original transcript
            const originalTranscript = transcriptManager.generateTranscript(debate);
            
            // Save transcript
            const filePath = await transcriptManager.saveTranscript(originalTranscript);
            expect(filePath).toBeTruthy();
            
            // Load transcript
            const loadedTranscript = await transcriptManager.loadTranscript(debate.id);
            
            // Verify debate metadata is preserved
            expect(loadedTranscript.debate.id).toBe(originalTranscript.debate.id);
            expect(loadedTranscript.debate.topic).toBe(originalTranscript.debate.topic);
            expect(loadedTranscript.debate.state).toBe(originalTranscript.debate.state);
            
            // Verify model names are preserved
            expect(loadedTranscript.debate.affirmativeModel.getModelName()).toBe(
              originalTranscript.debate.affirmativeModel.getModelName()
            );
            expect(loadedTranscript.debate.negativeModel.getModelName()).toBe(
              originalTranscript.debate.negativeModel.getModelName()
            );
            
            // Verify config is preserved
            expect(loadedTranscript.debate.config).toEqual(originalTranscript.debate.config);
            
            // Verify timestamps are preserved
            expect(loadedTranscript.debate.createdAt.getTime()).toBe(
              originalTranscript.debate.createdAt.getTime()
            );
            if (originalTranscript.debate.completedAt) {
              expect(loadedTranscript.debate.completedAt?.getTime()).toBe(
                originalTranscript.debate.completedAt.getTime()
              );
            }
            
            // Verify rounds are preserved
            expect(loadedTranscript.debate.rounds.length).toBe(originalTranscript.debate.rounds.length);
            
            for (let i = 0; i < originalTranscript.debate.rounds.length; i++) {
              const originalRound = originalTranscript.debate.rounds[i];
              const loadedRound = loadedTranscript.debate.rounds[i];
              
              expect(loadedRound.type).toBe(originalRound.type);
              expect(loadedRound.timestamp.getTime()).toBe(originalRound.timestamp.getTime());
              
              // Verify affirmative statement
              if (originalRound.affirmativeStatement) {
                expect(loadedRound.affirmativeStatement).toBeDefined();
                expect(loadedRound.affirmativeStatement?.content).toBe(
                  originalRound.affirmativeStatement.content
                );
                expect(loadedRound.affirmativeStatement?.position).toBe(
                  originalRound.affirmativeStatement.position
                );
                expect(loadedRound.affirmativeStatement?.model).toBe(
                  originalRound.affirmativeStatement.model
                );
                expect(loadedRound.affirmativeStatement?.wordCount).toBe(
                  originalRound.affirmativeStatement.wordCount
                );
              }
              
              // Verify negative statement
              if (originalRound.negativeStatement) {
                expect(loadedRound.negativeStatement).toBeDefined();
                expect(loadedRound.negativeStatement?.content).toBe(
                  originalRound.negativeStatement.content
                );
                expect(loadedRound.negativeStatement?.position).toBe(
                  originalRound.negativeStatement.position
                );
                expect(loadedRound.negativeStatement?.model).toBe(
                  originalRound.negativeStatement.model
                );
                expect(loadedRound.negativeStatement?.wordCount).toBe(
                  originalRound.negativeStatement.wordCount
                );
              }
            }
            
            // Verify formatted rounds are preserved
            expect(loadedTranscript.formattedRounds.length).toBe(
              originalTranscript.formattedRounds.length
            );
            
            for (let i = 0; i < originalTranscript.formattedRounds.length; i++) {
              const originalFormatted = originalTranscript.formattedRounds[i];
              const loadedFormatted = loadedTranscript.formattedRounds[i];
              
              expect(loadedFormatted.roundType).toBe(originalFormatted.roundType);
              expect(loadedFormatted.affirmativeContent).toBe(originalFormatted.affirmativeContent);
              expect(loadedFormatted.negativeContent).toBe(originalFormatted.negativeContent);
              expect(loadedFormatted.timestamp.getTime()).toBe(
                originalFormatted.timestamp.getTime()
              );
            }
            
            // Verify summary is preserved
            expect(loadedTranscript.summary.topic).toBe(originalTranscript.summary.topic);
            expect(loadedTranscript.summary.models.affirmative).toBe(
              originalTranscript.summary.models.affirmative
            );
            expect(loadedTranscript.summary.models.negative).toBe(
              originalTranscript.summary.models.negative
            );
            expect(loadedTranscript.summary.totalDuration).toBe(
              originalTranscript.summary.totalDuration
            );
            expect(loadedTranscript.summary.roundCount).toBe(
              originalTranscript.summary.roundCount
            );
            
            // Clean up test file
            await fs.unlink(filePath);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve formatting and attribution for all statements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affStatement, negStatement) => {
            const affirmativeModel = new MockAIProvider('TestModel_Affirmative');
            affirmativeModel.setResponse(RoundType.PREPARATION, affStatement);
            
            const negativeModel = new MockAIProvider('TestModel_Negative');
            negativeModel.setResponse(RoundType.PREPARATION, negStatement);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const originalTranscript = transcriptManager.generateTranscript(debate);
            await transcriptManager.saveTranscript(originalTranscript);
            const loadedTranscript = await transcriptManager.loadTranscript(debate.id);
            
            // Verify all statement content is exactly preserved
            for (let i = 0; i < originalTranscript.formattedRounds.length; i++) {
              const original = originalTranscript.formattedRounds[i];
              const loaded = loadedTranscript.formattedRounds[i];
              
              if (original.affirmativeContent) {
                expect(loaded.affirmativeContent).toBe(original.affirmativeContent);
              }
              
              if (original.negativeContent) {
                expect(loaded.negativeContent).toBe(original.negativeContent);
              }
            }
            
            // Verify attribution (model names) is preserved
            expect(loadedTranscript.summary.models.affirmative).toBe('TestModel_Affirmative');
            expect(loadedTranscript.summary.models.negative).toBe('TestModel_Negative');
            
            // Clean up
            const filePath = path.join(testTranscriptsDir, `${debate.id}.json`);
            await fs.unlink(filePath);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle transcripts with varying numbers of rounds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1, max: 5 }), // Number of rounds to execute
          fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 10, maxLength: 10 }),
          async (topic, numRounds, statements) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            const negativeModel = new MockAIProvider('Model_B');
            
            // Set up responses for all possible rounds
            affirmativeModel.setResponse(RoundType.PREPARATION, statements[0]);
            negativeModel.setResponse(RoundType.PREPARATION, statements[1]);
            affirmativeModel.setResponse(RoundType.OPENING, statements[2]);
            negativeModel.setResponse(RoundType.OPENING, statements[3]);
            affirmativeModel.setResponse(RoundType.REBUTTAL, statements[4]);
            negativeModel.setResponse(RoundType.REBUTTAL, statements[5]);
            affirmativeModel.setResponse(RoundType.CROSS_EXAM, statements[6]);
            negativeModel.setResponse(RoundType.CROSS_EXAM, statements[7]);
            affirmativeModel.setResponse(RoundType.CLOSING, statements[8]);
            negativeModel.setResponse(RoundType.CLOSING, statements[9]);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            // Execute rounds based on numRounds
            if (numRounds >= 1) debate = await orchestrator.executePreparation(debate);
            if (numRounds >= 2) debate = await orchestrator.executeOpeningStatements(debate);
            if (numRounds >= 3) debate = await orchestrator.executeRebuttals(debate);
            if (numRounds >= 4) debate = await orchestrator.executeCrossExamination(debate);
            if (numRounds >= 5) debate = await orchestrator.executeClosingStatements(debate);
            
            const originalTranscript = transcriptManager.generateTranscript(debate);
            await transcriptManager.saveTranscript(originalTranscript);
            const loadedTranscript = await transcriptManager.loadTranscript(debate.id);
            
            // Verify the correct number of rounds is preserved
            expect(loadedTranscript.debate.rounds.length).toBe(originalTranscript.debate.rounds.length);
            expect(loadedTranscript.formattedRounds.length).toBe(originalTranscript.formattedRounds.length);
            
            // Clean up
            const filePath = path.join(testTranscriptsDir, `${debate.id}.json`);
            await fs.unlink(filePath);
          }
        ),
        { numRuns: 50 }
      );
    }, 30000); // 30 second timeout
  });
});
