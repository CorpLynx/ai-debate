import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';
import { Position } from '../../src/models/Position';

describe('Transcript Completeness Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();
  const transcriptManager = new TranscriptManagerImpl();

  // Feature: ai-debate-system, Property 14: Transcript contains all statements in order
  // Validates: Requirements 8.1
  describe('Property 14: Transcript contains all statements in order', () => {
    it('should include all statements from all rounds in chronological order', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid topic
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          // Generate statements for each round
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative prep
          fc.string({ minLength: 10, maxLength: 200 }), // negative prep
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative opening
          fc.string({ minLength: 10, maxLength: 200 }), // negative opening
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative rebuttal
          fc.string({ minLength: 10, maxLength: 200 }), // negative rebuttal
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative cross-exam
          fc.string({ minLength: 10, maxLength: 200 }), // negative cross-exam
          fc.string({ minLength: 10, maxLength: 200 }), // affirmative closing
          fc.string({ minLength: 10, maxLength: 200 }), // negative closing
          async (
            topic,
            affPrep,
            negPrep,
            affOpening,
            negOpening,
            affRebuttal,
            negRebuttal,
            affCrossExam,
            negCrossExam,
            affClosing,
            negClosing
          ) => {
            // Create mock AI providers with configured responses
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            affirmativeModel.setResponse(RoundType.OPENING, affOpening);
            affirmativeModel.setResponse(RoundType.REBUTTAL, affRebuttal);
            affirmativeModel.setResponse(RoundType.CROSS_EXAM, affCrossExam);
            affirmativeModel.setResponse(RoundType.CLOSING, affClosing);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            negativeModel.setResponse(RoundType.OPENING, negOpening);
            negativeModel.setResponse(RoundType.REBUTTAL, negRebuttal);
            negativeModel.setResponse(RoundType.CROSS_EXAM, negCrossExam);
            negativeModel.setResponse(RoundType.CLOSING, negClosing);
            
            // Execute full debate
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            debate = await orchestrator.executeRebuttals(debate);
            debate = await orchestrator.executeCrossExamination(debate);
            debate = await orchestrator.executeClosingStatements(debate);
            
            // Generate transcript
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify all rounds are present
            expect(transcript.formattedRounds.length).toBe(debate.rounds.length);
            
            // Collect all statements from the debate
            const expectedStatements: Array<{ content: string; position: Position; roundType: RoundType }> = [];
            
            for (const round of debate.rounds) {
              if (round.affirmativeStatement) {
                expectedStatements.push({
                  content: round.affirmativeStatement.content,
                  position: round.affirmativeStatement.position,
                  roundType: round.type
                });
              }
              if (round.negativeStatement) {
                expectedStatements.push({
                  content: round.negativeStatement.content,
                  position: round.negativeStatement.position,
                  roundType: round.type
                });
              }
            }
            
            // Collect all statements from the transcript
            const transcriptStatements: Array<{ content: string; position: Position; roundType: RoundType }> = [];
            
            for (const formattedRound of transcript.formattedRounds) {
              if (formattedRound.affirmativeContent) {
                transcriptStatements.push({
                  content: formattedRound.affirmativeContent,
                  position: Position.AFFIRMATIVE,
                  roundType: formattedRound.roundType as RoundType
                });
              }
              if (formattedRound.negativeContent) {
                transcriptStatements.push({
                  content: formattedRound.negativeContent,
                  position: Position.NEGATIVE,
                  roundType: formattedRound.roundType as RoundType
                });
              }
            }
            
            // Verify same number of statements
            expect(transcriptStatements.length).toBe(expectedStatements.length);
            
            // Verify all statements are present with correct content
            for (let i = 0; i < expectedStatements.length; i++) {
              const expected = expectedStatements[i];
              const actual = transcriptStatements[i];
              
              expect(actual.content).toBe(expected.content);
              expect(actual.position).toBe(expected.position);
              expect(actual.roundType).toBe(expected.roundType);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not duplicate any statements', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep, affOpening, negOpening) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            affirmativeModel.setResponse(RoundType.OPENING, affOpening);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            negativeModel.setResponse(RoundType.OPENING, negOpening);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Collect all statement contents
            const allContents: string[] = [];
            
            for (const formattedRound of transcript.formattedRounds) {
              if (formattedRound.affirmativeContent) {
                allContents.push(formattedRound.affirmativeContent);
              }
              if (formattedRound.negativeContent) {
                allContents.push(formattedRound.negativeContent);
              }
            }
            
            // Count occurrences of each unique content
            const contentCounts = new Map<string, number>();
            for (const content of allContents) {
              contentCounts.set(content, (contentCounts.get(content) || 0) + 1);
            }
            
            // Verify no content appears more than once (unless it was genuinely generated twice)
            // Since we're using unique strings for each round, each should appear exactly once
            const uniqueInputs = [affPrep, negPrep, affOpening, negOpening];
            for (const input of uniqueInputs) {
              const count = contentCounts.get(input) || 0;
              expect(count).toBeLessThanOrEqual(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not miss any statements from any round', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.array(fc.string({ minLength: 10, maxLength: 200 }), { minLength: 2, maxLength: 10 }),
          async (topic, statements) => {
            // Use unique statements for each position
            const affirmativeModel = new MockAIProvider('Model_A');
            const negativeModel = new MockAIProvider('Model_B');
            
            // Set up responses for preparation and opening
            affirmativeModel.setResponse(RoundType.PREPARATION, statements[0]);
            negativeModel.setResponse(RoundType.PREPARATION, statements[1]);
            
            if (statements.length > 2) {
              affirmativeModel.setResponse(RoundType.OPENING, statements[2]);
            }
            if (statements.length > 3) {
              negativeModel.setResponse(RoundType.OPENING, statements[3]);
            }
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            if (statements.length > 2) {
              debate = await orchestrator.executeOpeningStatements(debate);
            }
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Count total statements in debate
            let totalDebateStatements = 0;
            for (const round of debate.rounds) {
              if (round.affirmativeStatement) totalDebateStatements++;
              if (round.negativeStatement) totalDebateStatements++;
            }
            
            // Count total statements in transcript
            let totalTranscriptStatements = 0;
            for (const formattedRound of transcript.formattedRounds) {
              if (formattedRound.affirmativeContent) totalTranscriptStatements++;
              if (formattedRound.negativeContent) totalTranscriptStatements++;
            }
            
            // Verify counts match
            expect(totalTranscriptStatements).toBe(totalDebateStatements);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain chronological order based on round timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, affPrep, negPrep, affOpening, negOpening) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            affirmativeModel.setResponse(RoundType.OPENING, affOpening);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            negativeModel.setResponse(RoundType.OPENING, negOpening);
            
            let debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            debate = await orchestrator.executeOpeningStatements(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify rounds are in chronological order
            for (let i = 1; i < transcript.formattedRounds.length; i++) {
              const prevTimestamp = transcript.formattedRounds[i - 1].timestamp.getTime();
              const currTimestamp = transcript.formattedRounds[i].timestamp.getTime();
              
              expect(currTimestamp).toBeGreaterThanOrEqual(prevTimestamp);
            }
            
            // Verify round types follow expected sequence
            const roundTypes = transcript.formattedRounds.map(r => r.roundType);
            expect(roundTypes[0]).toBe(RoundType.PREPARATION);
            if (roundTypes.length > 1) {
              expect(roundTypes[1]).toBe(RoundType.OPENING);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
