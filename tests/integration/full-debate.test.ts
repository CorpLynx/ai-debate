/**
 * Integration tests for full debate flow
 * 
 * Task 28: Write integration tests for full debate flow
 * Requirements: All requirements
 * 
 * Tests complete debate from initialization to transcript generation
 * Uses mock providers to simulate full debate
 * Verifies all rounds execute in correct order
 */

import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateState } from '../../src/models/DebateState';
import { RoundType } from '../../src/models/RoundType';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import * as fs from 'fs';
import * as path from 'path';

describe('Full Debate Flow Integration Tests', () => {
  let orchestrator: DebateOrchestratorImpl;
  let transcriptManager: TranscriptManagerImpl;
  const testTranscriptsDir = path.join(__dirname, '../../transcripts');

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl(testTranscriptsDir);
    transcriptManager = new TranscriptManagerImpl(testTranscriptsDir);
  });

  afterEach(() => {
    // Clean up test transcripts
    if (fs.existsSync(testTranscriptsDir)) {
      const files = fs.readdirSync(testTranscriptsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            fs.unlinkSync(path.join(testTranscriptsDir, file));
          } catch (error) {
            // Ignore cleanup errors
          }
        }
      });
    }
  });

  describe('Complete Debate Flow', () => {
    it('should execute a complete debate from initialization to transcript generation', async () => {
      // Create mock providers with specific responses
      const affirmativeModel = new MockAIProvider('GPT-4');
      const negativeModel = new MockAIProvider('Claude');

      // Set up responses for all rounds
      affirmativeModel.setResponse(RoundType.PREPARATION, 'I have researched the topic and prepared my arguments in favor.');
      negativeModel.setResponse(RoundType.PREPARATION, 'I have researched the topic and prepared my arguments against.');

      affirmativeModel.setResponse(RoundType.OPENING, 'As the affirmative, I believe this proposition is correct because...');
      negativeModel.setResponse(RoundType.OPENING, 'As the negative, I believe this proposition is incorrect because...');

      affirmativeModel.setResponse(RoundType.REBUTTAL, 'I must address the negative\'s points and reinforce my position.');
      negativeModel.setResponse(RoundType.REBUTTAL, 'I must address the affirmative\'s points and reinforce my position.');

      affirmativeModel.setResponse(RoundType.CROSS_EXAM, 'Question: Can you explain how your position addresses...');
      negativeModel.setResponse(RoundType.CROSS_EXAM, 'Question: How does your position account for...');

      affirmativeModel.setResponse(RoundType.CLOSING, 'In conclusion, the affirmative position is clearly supported by the evidence.');
      negativeModel.setResponse(RoundType.CLOSING, 'In conclusion, the negative position is clearly supported by the evidence.');

      const topic = 'Should artificial intelligence be regulated?';

      // Initialize debate
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);
      expect(debate.state).toBe(DebateState.INITIALIZED);
      expect(debate.topic).toBe(topic);
      expect(debate.rounds.length).toBe(0);

      // Execute preparation phase
      debate = await orchestrator.executePreparation(debate);
      expect(debate.state).toBe(DebateState.PREPARATION);
      expect(debate.rounds.length).toBe(1);
      expect(debate.rounds[0].type).toBe(RoundType.PREPARATION);
      expect(debate.rounds[0].affirmativeStatement).toBeDefined();
      expect(debate.rounds[0].negativeStatement).toBeDefined();

      // Execute opening statements
      debate = await orchestrator.executeOpeningStatements(debate);
      expect(debate.state).toBe(DebateState.OPENING_STATEMENTS);
      expect(debate.rounds.length).toBe(2);
      expect(debate.rounds[1].type).toBe(RoundType.OPENING);
      expect(debate.rounds[1].affirmativeStatement).toBeDefined();
      expect(debate.rounds[1].negativeStatement).toBeDefined();

      // Execute rebuttals
      debate = await orchestrator.executeRebuttals(debate);
      expect(debate.state).toBe(DebateState.REBUTTALS);
      expect(debate.rounds.length).toBe(3);
      expect(debate.rounds[2].type).toBe(RoundType.REBUTTAL);
      expect(debate.rounds[2].affirmativeStatement).toBeDefined();
      expect(debate.rounds[2].negativeStatement).toBeDefined();

      // Execute cross-examination
      debate = await orchestrator.executeCrossExamination(debate);
      expect(debate.state).toBe(DebateState.CROSS_EXAMINATION);
      expect(debate.rounds.length).toBe(4);
      expect(debate.rounds[3].type).toBe(RoundType.CROSS_EXAM);
      expect(debate.rounds[3].affirmativeStatement).toBeDefined();
      expect(debate.rounds[3].negativeStatement).toBeDefined();

      // Execute closing statements
      debate = await orchestrator.executeClosingStatements(debate);
      expect(debate.state).toBe(DebateState.CLOSING_STATEMENTS);
      expect(debate.rounds.length).toBe(5);
      expect(debate.rounds[4].type).toBe(RoundType.CLOSING);
      expect(debate.rounds[4].affirmativeStatement).toBeDefined();
      expect(debate.rounds[4].negativeStatement).toBeDefined();

      // Complete debate
      debate = await orchestrator.completeDebate(debate);
      expect(debate.state).toBe(DebateState.COMPLETED);
      expect(debate.completedAt).toBeDefined();

      // Generate transcript
      const transcript = transcriptManager.generateTranscript(debate);
      expect(transcript).toBeDefined();
      expect(transcript.debate.id).toBe(debate.id);
      expect(transcript.debate.topic).toBe(topic);
      expect(transcript.formattedRounds.length).toBe(5);
      expect(transcript.summary.topic).toBe(topic);
      expect(transcript.summary.models.affirmative).toBe('GPT-4');
      expect(transcript.summary.models.negative).toBe('Claude');
      expect(transcript.summary.roundCount).toBe(5);
    });

    it('should execute rounds in the correct order', async () => {
      const affirmativeModel = new MockAIProvider('Model_A');
      const negativeModel = new MockAIProvider('Model_B');

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      const expectedOrder = [
        RoundType.PREPARATION,
        RoundType.OPENING,
        RoundType.REBUTTAL,
        RoundType.CROSS_EXAM,
        RoundType.CLOSING
      ];

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);

      // Verify order
      expect(debate.rounds.length).toBe(5);
      debate.rounds.forEach((round, index) => {
        expect(round.type).toBe(expectedOrder[index]);
      });
    });

    it('should generate a complete transcript with all statements', async () => {
      const affirmativeModel = new MockAIProvider('Model_A');
      const negativeModel = new MockAIProvider('Model_B');

      // Set unique responses for each round to verify they're all captured
      affirmativeModel.setResponse(RoundType.PREPARATION, 'Prep A');
      negativeModel.setResponse(RoundType.PREPARATION, 'Prep B');
      affirmativeModel.setResponse(RoundType.OPENING, 'Opening A');
      negativeModel.setResponse(RoundType.OPENING, 'Opening B');
      affirmativeModel.setResponse(RoundType.REBUTTAL, 'Rebuttal A');
      negativeModel.setResponse(RoundType.REBUTTAL, 'Rebuttal B');
      affirmativeModel.setResponse(RoundType.CROSS_EXAM, 'CrossExam A');
      negativeModel.setResponse(RoundType.CROSS_EXAM, 'CrossExam B');
      affirmativeModel.setResponse(RoundType.CLOSING, 'Closing A');
      negativeModel.setResponse(RoundType.CLOSING, 'Closing B');

      const topic = 'Test topic';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);
      debate = await orchestrator.completeDebate(debate);

      // Generate transcript
      const transcript = transcriptManager.generateTranscript(debate);

      // Verify all statements are present
      expect(transcript.formattedRounds.length).toBe(5);
      
      // Check preparation
      expect(transcript.formattedRounds[0].affirmativeContent).toContain('Prep A');
      expect(transcript.formattedRounds[0].negativeContent).toContain('Prep B');
      
      // Check opening
      expect(transcript.formattedRounds[1].affirmativeContent).toContain('Opening A');
      expect(transcript.formattedRounds[1].negativeContent).toContain('Opening B');
      
      // Check rebuttal
      expect(transcript.formattedRounds[2].affirmativeContent).toContain('Rebuttal A');
      expect(transcript.formattedRounds[2].negativeContent).toContain('Rebuttal B');
      
      // Check cross-examination
      expect(transcript.formattedRounds[3].affirmativeContent).toContain('CrossExam A');
      expect(transcript.formattedRounds[3].negativeContent).toContain('CrossExam B');
      
      // Check closing
      expect(transcript.formattedRounds[4].affirmativeContent).toContain('Closing A');
      expect(transcript.formattedRounds[4].negativeContent).toContain('Closing B');
    });

    it('should save and load transcript correctly', async () => {
      const affirmativeModel = new MockAIProvider('Model_A');
      const negativeModel = new MockAIProvider('Model_B');

      const topic = 'Test topic for transcript save/load';
      let debate = orchestrator.initializeDebate(topic, DEFAULT_CONFIG, affirmativeModel, negativeModel);

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);
      debate = await orchestrator.completeDebate(debate);

      // Generate and save transcript
      const originalTranscript = transcriptManager.generateTranscript(debate);
      const filePath = await transcriptManager.saveTranscript(originalTranscript);
      expect(fs.existsSync(filePath)).toBe(true);

      // Load transcript
      const loadedTranscript = await transcriptManager.loadTranscript(debate.id);

      // Verify loaded transcript matches original
      expect(loadedTranscript.debate.id).toBe(originalTranscript.debate.id);
      expect(loadedTranscript.debate.topic).toBe(originalTranscript.debate.topic);
      expect(loadedTranscript.formattedRounds.length).toBe(originalTranscript.formattedRounds.length);
      expect(loadedTranscript.summary.topic).toBe(originalTranscript.summary.topic);
    });
  });
});

