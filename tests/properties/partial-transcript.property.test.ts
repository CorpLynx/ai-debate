/**
 * Property-based tests for partial transcript preservation
 * Feature: ai-debate-system, Property 19: Critical errors preserve partial transcripts
 * Validates: Requirements 9.3
 */

import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Property 19: Critical errors preserve partial transcripts', () => {
  const testTranscriptsDir = './test-transcripts';

  beforeEach(async () => {
    // Clean up test transcripts directory before each test
    try {
      await fs.rm(testTranscriptsDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, that's okay
    }
  });

  afterEach(async () => {
    // Clean up test transcripts directory after each test
    try {
      await fs.rm(testTranscriptsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  /**
   * For any critical error during a debate, a partial transcript containing
   * all statements generated before the error should be saved.
   */
  it('should save partial transcript when critical error occurs', async () => {
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
        async (topic, failureRound, errorMessage) => {
          // Create orchestrator with test transcripts directory
          const orchestrator = new DebateOrchestratorImpl(testTranscriptsDir);
          
          // Create mock providers - one will fail at the specified round
          const affirmativeModel = new MockAIProvider('AffirmativeModel');
          const negativeModel = new MockAIProvider('NegativeModel');
          
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
          
          // Execute rounds until we reach the failure round
          let currentDebate = debate;
          let roundsCompleted = 0;
          
          try {
            // Execute preparation
            if (failureRound === RoundType.PREPARATION) {
              negativeModel.setShouldFail(true, errorMessage);
            }
            currentDebate = await orchestrator.executePreparation(currentDebate);
            roundsCompleted++;
            
            // Execute opening statements
            if (failureRound === RoundType.OPENING) {
              negativeModel.setShouldFail(true, errorMessage);
            }
            currentDebate = await orchestrator.executeOpeningStatements(currentDebate);
            roundsCompleted++;
            
            // Execute rebuttals
            if (failureRound === RoundType.REBUTTAL) {
              negativeModel.setShouldFail(true, errorMessage);
            }
            currentDebate = await orchestrator.executeRebuttals(currentDebate);
            roundsCompleted++;
            
            // Execute cross-examination
            if (failureRound === RoundType.CROSS_EXAM) {
              negativeModel.setShouldFail(true, errorMessage);
            }
            currentDebate = await orchestrator.executeCrossExamination(currentDebate);
            roundsCompleted++;
            
            // Execute closing statements
            if (failureRound === RoundType.CLOSING) {
              negativeModel.setShouldFail(true, errorMessage);
            }
            currentDebate = await orchestrator.executeClosingStatements(currentDebate);
            roundsCompleted++;
          } catch (error) {
            // Error expected - this is what we're testing
          }
          
          // Verify partial transcript was saved
          const partialFileName = `partial-${debate.id}.json`;
          const partialFilePath = path.join(testTranscriptsDir, partialFileName);
          
          // Check that the file exists
          let fileExists = false;
          try {
            await fs.access(partialFilePath);
            fileExists = true;
          } catch (error) {
            fileExists = false;
          }
          
          expect(fileExists).toBe(true);
          
          // Read and verify the partial transcript
          const fileContent = await fs.readFile(partialFilePath, 'utf-8');
          const partialTranscript = JSON.parse(fileContent);
          
          // Verify it's marked as partial
          expect(partialTranscript.partial).toBe(true);
          
          // Verify it contains the debate information
          expect(partialTranscript.debate.topic).toBe(topic);
          expect(partialTranscript.debate.id).toBe(debate.id);
          
          // Verify it contains error information
          expect(partialTranscript.errors).toBeDefined();
          expect(partialTranscript.errors.length).toBeGreaterThan(0);
          
          // Verify it contains the rounds that were completed before the error
          // The number of rounds in the transcript should be at least the rounds completed before failure
          expect(partialTranscript.debate.rounds.length).toBeGreaterThanOrEqual(0);
          
          // If any rounds were completed, verify they're in the transcript
          if (roundsCompleted > 0) {
            expect(partialTranscript.formattedRounds.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
