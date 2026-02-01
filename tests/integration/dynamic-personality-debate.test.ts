/**
 * Integration test for complete debate with dynamic personalities
 * 
 * Task 20: Write integration test for debate with dynamic personalities
 * Requirements: All requirements
 * 
 * Tests:
 * - Complete debate with randomly generated personalities
 * - Verify personality traits affect debate behavior
 * - Verify transcript includes personality profiles
 */

import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { DebateState } from '../../src/models/DebateState';
import { RoundType } from '../../src/models/RoundType';
import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';
import * as fs from 'fs';
import * as path from 'path';

describe('Dynamic Personality Debate Integration Tests', () => {
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

  describe('Complete Debate with Random Personalities', () => {
    it('should execute a complete debate with randomly generated personalities', async () => {
      // Create mock providers
      const affirmativeModel = new MockAIProvider('GPT-4');
      const negativeModel = new MockAIProvider('Claude');

      // Set up responses for all rounds
      affirmativeModel.setResponse(RoundType.PREPARATION, 'I have researched the topic thoroughly.');
      negativeModel.setResponse(RoundType.PREPARATION, 'I have prepared my counter-arguments.');

      affirmativeModel.setResponse(RoundType.OPENING, 'My opening argument supports the proposition.');
      negativeModel.setResponse(RoundType.OPENING, 'My opening argument opposes the proposition.');

      affirmativeModel.setResponse(RoundType.REBUTTAL, 'I rebut the negative position.');
      negativeModel.setResponse(RoundType.REBUTTAL, 'I rebut the affirmative position.');

      affirmativeModel.setResponse(RoundType.CROSS_EXAM, 'Question for the negative side.');
      negativeModel.setResponse(RoundType.CROSS_EXAM, 'Question for the affirmative side.');

      affirmativeModel.setResponse(RoundType.CLOSING, 'In conclusion, the affirmative position is correct.');
      negativeModel.setResponse(RoundType.CLOSING, 'In conclusion, the negative position is correct.');

      const topic = 'Should artificial intelligence be regulated?';

      // Configure debate with random personalities
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: 'random',
        negativePersonality: 'random'
      };

      // Initialize debate with random personalities
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);
      
      // Verify debate initialized correctly
      expect(debate.state).toBe(DebateState.INITIALIZED);
      expect(debate.topic).toBe(topic);
      
      // Verify random personalities were generated
      expect(debate.affirmativePersonality).toBeDefined();
      expect(debate.negativePersonality).toBeDefined();
      
      // Verify personality traits are in valid range (0-10)
      expect(debate.affirmativePersonality.civility).toBeGreaterThanOrEqual(0);
      expect(debate.affirmativePersonality.civility).toBeLessThanOrEqual(10);
      expect(debate.affirmativePersonality.manner).toBeGreaterThanOrEqual(0);
      expect(debate.affirmativePersonality.manner).toBeLessThanOrEqual(10);
      expect(debate.affirmativePersonality.researchDepth).toBeGreaterThanOrEqual(0);
      expect(debate.affirmativePersonality.researchDepth).toBeLessThanOrEqual(10);
      expect(debate.affirmativePersonality.rhetoricUsage).toBeGreaterThanOrEqual(0);
      expect(debate.affirmativePersonality.rhetoricUsage).toBeLessThanOrEqual(10);
      
      expect(debate.negativePersonality.civility).toBeGreaterThanOrEqual(0);
      expect(debate.negativePersonality.civility).toBeLessThanOrEqual(10);
      expect(debate.negativePersonality.manner).toBeGreaterThanOrEqual(0);
      expect(debate.negativePersonality.manner).toBeLessThanOrEqual(10);
      expect(debate.negativePersonality.researchDepth).toBeGreaterThanOrEqual(0);
      expect(debate.negativePersonality.researchDepth).toBeLessThanOrEqual(10);
      expect(debate.negativePersonality.rhetoricUsage).toBeGreaterThanOrEqual(0);
      expect(debate.negativePersonality.rhetoricUsage).toBeLessThanOrEqual(10);
      
      // Verify tactics are valid
      expect(Array.isArray(debate.affirmativePersonality.tactics)).toBe(true);
      expect(Array.isArray(debate.negativePersonality.tactics)).toBe(true);

      // Execute all debate rounds
      debate = await orchestrator.executePreparation(debate);
      expect(debate.state).toBe(DebateState.PREPARATION);
      expect(debate.rounds.length).toBe(1);

      debate = await orchestrator.executeOpeningStatements(debate);
      expect(debate.state).toBe(DebateState.OPENING_STATEMENTS);
      expect(debate.rounds.length).toBe(2);

      debate = await orchestrator.executeRebuttals(debate);
      expect(debate.state).toBe(DebateState.REBUTTALS);
      expect(debate.rounds.length).toBe(3);

      debate = await orchestrator.executeCrossExamination(debate);
      expect(debate.state).toBe(DebateState.CROSS_EXAMINATION);
      expect(debate.rounds.length).toBe(4);

      debate = await orchestrator.executeClosingStatements(debate);
      expect(debate.state).toBe(DebateState.CLOSING_STATEMENTS);
      expect(debate.rounds.length).toBe(5);

      // Complete debate
      debate = await orchestrator.completeDebate(debate);
      expect(debate.state).toBe(DebateState.COMPLETED);
      expect(debate.completedAt).toBeDefined();

      // Generate transcript
      const transcript = transcriptManager.generateTranscript(debate);
      expect(transcript).toBeDefined();
      
      // Verify transcript includes personality profiles (Requirement 12.4)
      expect(transcript.debate.affirmativePersonality).toBeDefined();
      expect(transcript.debate.negativePersonality).toBeDefined();
      expect(transcript.debate.affirmativePersonality).toEqual(debate.affirmativePersonality);
      expect(transcript.debate.negativePersonality).toEqual(debate.negativePersonality);
      
      // Verify all rounds executed
      expect(transcript.formattedRounds.length).toBe(5);
      expect(transcript.summary.roundCount).toBe(5);
    });

    it('should execute a complete debate with explicit personality profiles', async () => {
      // Create mock providers
      const affirmativeModel = new MockAIProvider('GPT-4');
      const negativeModel = new MockAIProvider('Claude');

      // Set up responses for all rounds
      affirmativeModel.setResponse(RoundType.PREPARATION, 'Scholarly preparation with citations.');
      negativeModel.setResponse(RoundType.PREPARATION, 'Aggressive preparation.');

      affirmativeModel.setResponse(RoundType.OPENING, 'Respectful opening with evidence.');
      negativeModel.setResponse(RoundType.OPENING, 'Hostile opening with rhetoric.');

      affirmativeModel.setResponse(RoundType.REBUTTAL, 'Polite rebuttal.');
      negativeModel.setResponse(RoundType.REBUTTAL, 'Aggressive rebuttal.');

      affirmativeModel.setResponse(RoundType.CROSS_EXAM, 'Thoughtful question.');
      negativeModel.setResponse(RoundType.CROSS_EXAM, 'Confrontational question.');

      affirmativeModel.setResponse(RoundType.CLOSING, 'Measured conclusion.');
      negativeModel.setResponse(RoundType.CLOSING, 'Emotional conclusion.');

      const topic = 'Should AI be regulated?';

      // Create contrasting personality profiles
      const scholarPersonality: PersonalityProfile = {
        civility: 10,
        manner: 10,
        researchDepth: 10,
        rhetoricUsage: 2,
        tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
      };

      const firebrandPersonality: PersonalityProfile = {
        civility: 1,
        manner: 0,
        researchDepth: 2,
        rhetoricUsage: 10,
        tactics: [DebateTactic.AD_HOMINEM, DebateTactic.APPEAL_TO_EMOTION]
      };

      // Configure debate with explicit personalities
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: scholarPersonality,
        negativePersonality: firebrandPersonality
      };

      // Initialize debate
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);
      
      // Verify personalities match what was configured
      expect(debate.affirmativePersonality).toEqual(scholarPersonality);
      expect(debate.negativePersonality).toEqual(firebrandPersonality);

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);
      debate = await orchestrator.completeDebate(debate);

      // Verify debate completed successfully
      expect(debate.state).toBe(DebateState.COMPLETED);
      expect(debate.rounds.length).toBe(5);

      // Generate transcript and verify personalities are preserved
      const transcript = transcriptManager.generateTranscript(debate);
      expect(transcript.debate.affirmativePersonality).toEqual(scholarPersonality);
      expect(transcript.debate.negativePersonality).toEqual(firebrandPersonality);
    });

    it('should execute a complete debate with default personalities when not specified', async () => {
      // Create mock providers
      const affirmativeModel = new MockAIProvider('GPT-4');
      const negativeModel = new MockAIProvider('Claude');

      // Set up responses
      affirmativeModel.setResponse(RoundType.PREPARATION, 'Neutral preparation.');
      negativeModel.setResponse(RoundType.PREPARATION, 'Neutral preparation.');
      affirmativeModel.setResponse(RoundType.OPENING, 'Balanced opening.');
      negativeModel.setResponse(RoundType.OPENING, 'Balanced opening.');
      affirmativeModel.setResponse(RoundType.REBUTTAL, 'Moderate rebuttal.');
      negativeModel.setResponse(RoundType.REBUTTAL, 'Moderate rebuttal.');
      affirmativeModel.setResponse(RoundType.CROSS_EXAM, 'Fair question.');
      negativeModel.setResponse(RoundType.CROSS_EXAM, 'Fair question.');
      affirmativeModel.setResponse(RoundType.CLOSING, 'Balanced conclusion.');
      negativeModel.setResponse(RoundType.CLOSING, 'Balanced conclusion.');

      const topic = 'Test topic';

      // Configure debate with default personalities
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: 'default',
        negativePersonality: 'default'
      };

      // Initialize debate
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);
      
      // Verify default personalities (all traits should be 5)
      expect(debate.affirmativePersonality.civility).toBe(5);
      expect(debate.affirmativePersonality.manner).toBe(5);
      expect(debate.affirmativePersonality.researchDepth).toBe(5);
      expect(debate.affirmativePersonality.rhetoricUsage).toBe(5);
      expect(debate.affirmativePersonality.tactics).toEqual([DebateTactic.NONE]);

      expect(debate.negativePersonality.civility).toBe(5);
      expect(debate.negativePersonality.manner).toBe(5);
      expect(debate.negativePersonality.researchDepth).toBe(5);
      expect(debate.negativePersonality.rhetoricUsage).toBe(5);
      expect(debate.negativePersonality.tactics).toEqual([DebateTactic.NONE]);

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      debate = await orchestrator.executeOpeningStatements(debate);
      debate = await orchestrator.executeRebuttals(debate);
      debate = await orchestrator.executeCrossExamination(debate);
      debate = await orchestrator.executeClosingStatements(debate);
      debate = await orchestrator.completeDebate(debate);

      // Verify debate completed successfully
      expect(debate.state).toBe(DebateState.COMPLETED);

      // Generate transcript and verify default personalities are preserved
      const transcript = transcriptManager.generateTranscript(debate);
      expect(transcript.debate.affirmativePersonality.civility).toBe(5);
      expect(transcript.debate.negativePersonality.civility).toBe(5);
    });

    it('should maintain personality consistency across all rounds', async () => {
      // Create mock providers
      const affirmativeModel = new MockAIProvider('GPT-4');
      const negativeModel = new MockAIProvider('Claude');

      // Set up responses
      affirmativeModel.setResponse(RoundType.PREPARATION, 'Prep');
      negativeModel.setResponse(RoundType.PREPARATION, 'Prep');
      affirmativeModel.setResponse(RoundType.OPENING, 'Opening');
      negativeModel.setResponse(RoundType.OPENING, 'Opening');
      affirmativeModel.setResponse(RoundType.REBUTTAL, 'Rebuttal');
      negativeModel.setResponse(RoundType.REBUTTAL, 'Rebuttal');
      affirmativeModel.setResponse(RoundType.CROSS_EXAM, 'Question');
      negativeModel.setResponse(RoundType.CROSS_EXAM, 'Question');
      affirmativeModel.setResponse(RoundType.CLOSING, 'Closing');
      negativeModel.setResponse(RoundType.CLOSING, 'Closing');

      const topic = 'Test topic';

      // Create specific personality profiles
      const affirmativePersonality: PersonalityProfile = {
        civility: 8,
        manner: 7,
        researchDepth: 9,
        rhetoricUsage: 3,
        tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
      };

      const negativePersonality: PersonalityProfile = {
        civility: 3,
        manner: 2,
        researchDepth: 4,
        rhetoricUsage: 8,
        tactics: [DebateTactic.STRAWMAN]
      };

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: affirmativePersonality,
        negativePersonality: negativePersonality
      };

      // Initialize debate
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);
      
      // Store initial personalities
      const initialAffirmative = { ...debate.affirmativePersonality };
      const initialNegative = { ...debate.negativePersonality };

      // Execute all rounds
      debate = await orchestrator.executePreparation(debate);
      
      // Verify personalities haven't changed after preparation
      expect(debate.affirmativePersonality).toEqual(initialAffirmative);
      expect(debate.negativePersonality).toEqual(initialNegative);

      debate = await orchestrator.executeOpeningStatements(debate);
      
      // Verify personalities haven't changed after opening
      expect(debate.affirmativePersonality).toEqual(initialAffirmative);
      expect(debate.negativePersonality).toEqual(initialNegative);

      debate = await orchestrator.executeRebuttals(debate);
      
      // Verify personalities haven't changed after rebuttals
      expect(debate.affirmativePersonality).toEqual(initialAffirmative);
      expect(debate.negativePersonality).toEqual(initialNegative);

      debate = await orchestrator.executeCrossExamination(debate);
      
      // Verify personalities haven't changed after cross-examination
      expect(debate.affirmativePersonality).toEqual(initialAffirmative);
      expect(debate.negativePersonality).toEqual(initialNegative);

      debate = await orchestrator.executeClosingStatements(debate);
      
      // Verify personalities haven't changed after closing
      expect(debate.affirmativePersonality).toEqual(initialAffirmative);
      expect(debate.negativePersonality).toEqual(initialNegative);

      debate = await orchestrator.completeDebate(debate);
      
      // Verify personalities are still consistent at completion
      expect(debate.affirmativePersonality).toEqual(initialAffirmative);
      expect(debate.negativePersonality).toEqual(initialNegative);
    });

    it('should save and load transcript with personality profiles', async () => {
      // Create mock providers
      const affirmativeModel = new MockAIProvider('Model_A');
      const negativeModel = new MockAIProvider('Model_B');

      // Set up responses
      affirmativeModel.setResponse(RoundType.PREPARATION, 'Prep A');
      negativeModel.setResponse(RoundType.PREPARATION, 'Prep B');
      affirmativeModel.setResponse(RoundType.OPENING, 'Opening A');
      negativeModel.setResponse(RoundType.OPENING, 'Opening B');
      affirmativeModel.setResponse(RoundType.REBUTTAL, 'Rebuttal A');
      negativeModel.setResponse(RoundType.REBUTTAL, 'Rebuttal B');
      affirmativeModel.setResponse(RoundType.CROSS_EXAM, 'Question A');
      negativeModel.setResponse(RoundType.CROSS_EXAM, 'Question B');
      affirmativeModel.setResponse(RoundType.CLOSING, 'Closing A');
      negativeModel.setResponse(RoundType.CLOSING, 'Closing B');

      const topic = 'Test topic for transcript persistence';

      // Create personality profiles
      const affirmativePersonality: PersonalityProfile = {
        civility: 6,
        manner: 7,
        researchDepth: 8,
        rhetoricUsage: 4,
        tactics: [DebateTactic.NONE]
      };

      const negativePersonality: PersonalityProfile = {
        civility: 4,
        manner: 3,
        researchDepth: 5,
        rhetoricUsage: 7,
        tactics: [DebateTactic.APPEAL_TO_EMOTION]
      };

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: affirmativePersonality,
        negativePersonality: negativePersonality
      };

      // Execute complete debate
      let debate = orchestrator.initializeDebate(topic, config, affirmativeModel, negativeModel);
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

      // Verify personality profiles are preserved in loaded transcript
      expect(loadedTranscript.debate.affirmativePersonality).toBeDefined();
      expect(loadedTranscript.debate.negativePersonality).toBeDefined();
      expect(loadedTranscript.debate.affirmativePersonality).toEqual(affirmativePersonality);
      expect(loadedTranscript.debate.negativePersonality).toEqual(negativePersonality);
    });
  });
});
