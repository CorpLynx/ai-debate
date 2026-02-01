import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { TranscriptManagerImpl } from '../../src/transcript/TranscriptManager';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { RoundType } from '../../src/models/RoundType';
import { PersonalityGenerator } from '../../src/utils/PersonalityGenerator';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Personality Transcript Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();
  const transcriptManager = new TranscriptManagerImpl();
  const personalityGenerator = new PersonalityGenerator();

  // **Feature: ai-debate-advanced, Property 28: Personality profiles in transcript**
  // **Validates: Requirements 12.4**
  describe('Property 28: Personality profiles in transcript', () => {
    it('should include affirmative personality profile in transcript', async () => {
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
            
            // Generate random personality for affirmative
            const affirmativePersonality = personalityGenerator.generateRandom();
            
            const config = {
              ...DEFAULT_CONFIG,
              affirmativePersonality,
              negativePersonality: personalityGenerator.getDefaultProfile()
            };
            
            let debate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify affirmative personality is in transcript
            expect(transcript.debate.affirmativePersonality).toBeDefined();
            expect(transcript.debate.affirmativePersonality.civility).toBe(affirmativePersonality.civility);
            expect(transcript.debate.affirmativePersonality.manner).toBe(affirmativePersonality.manner);
            expect(transcript.debate.affirmativePersonality.researchDepth).toBe(affirmativePersonality.researchDepth);
            expect(transcript.debate.affirmativePersonality.rhetoricUsage).toBe(affirmativePersonality.rhetoricUsage);
            expect(transcript.debate.affirmativePersonality.tactics).toEqual(affirmativePersonality.tactics);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include negative personality profile in transcript', async () => {
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
            
            // Generate random personality for negative
            const negativePersonality = personalityGenerator.generateRandom();
            
            const config = {
              ...DEFAULT_CONFIG,
              affirmativePersonality: personalityGenerator.getDefaultProfile(),
              negativePersonality
            };
            
            let debate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify negative personality is in transcript
            expect(transcript.debate.negativePersonality).toBeDefined();
            expect(transcript.debate.negativePersonality.civility).toBe(negativePersonality.civility);
            expect(transcript.debate.negativePersonality.manner).toBe(negativePersonality.manner);
            expect(transcript.debate.negativePersonality.researchDepth).toBe(negativePersonality.researchDepth);
            expect(transcript.debate.negativePersonality.rhetoricUsage).toBe(negativePersonality.rhetoricUsage);
            expect(transcript.debate.negativePersonality.tactics).toEqual(negativePersonality.tactics);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include both personality profiles in transcript', async () => {
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
            
            // Generate random personalities for both
            const affirmativePersonality = personalityGenerator.generateRandom();
            const negativePersonality = personalityGenerator.generateRandom();
            
            const config = {
              ...DEFAULT_CONFIG,
              affirmativePersonality,
              negativePersonality
            };
            
            let debate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify both personalities are in transcript
            expect(transcript.debate.affirmativePersonality).toBeDefined();
            expect(transcript.debate.negativePersonality).toBeDefined();
            
            // Verify they match the original personalities
            expect(transcript.debate.affirmativePersonality.civility).toBe(affirmativePersonality.civility);
            expect(transcript.debate.negativePersonality.civility).toBe(negativePersonality.civility);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve personality profiles through save/load cycle', async () => {
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
            
            // Generate random personalities
            const affirmativePersonality = personalityGenerator.generateRandom();
            const negativePersonality = personalityGenerator.generateRandom();
            
            const config = {
              ...DEFAULT_CONFIG,
              affirmativePersonality,
              negativePersonality
            };
            
            let debate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Save transcript
            const testTranscriptsDir = './test-transcripts';
            const testTranscriptManager = new TranscriptManagerImpl(testTranscriptsDir);
            await testTranscriptManager.saveTranscript(transcript);
            
            // Load transcript
            const loadedTranscript = await testTranscriptManager.loadTranscript(debate.id);
            
            // Verify personalities are preserved
            expect(loadedTranscript.debate.affirmativePersonality).toBeDefined();
            expect(loadedTranscript.debate.negativePersonality).toBeDefined();
            
            expect(loadedTranscript.debate.affirmativePersonality.civility).toBe(affirmativePersonality.civility);
            expect(loadedTranscript.debate.affirmativePersonality.manner).toBe(affirmativePersonality.manner);
            expect(loadedTranscript.debate.affirmativePersonality.researchDepth).toBe(affirmativePersonality.researchDepth);
            expect(loadedTranscript.debate.affirmativePersonality.rhetoricUsage).toBe(affirmativePersonality.rhetoricUsage);
            expect(loadedTranscript.debate.affirmativePersonality.tactics).toEqual(affirmativePersonality.tactics);
            
            expect(loadedTranscript.debate.negativePersonality.civility).toBe(negativePersonality.civility);
            expect(loadedTranscript.debate.negativePersonality.manner).toBe(negativePersonality.manner);
            expect(loadedTranscript.debate.negativePersonality.researchDepth).toBe(negativePersonality.researchDepth);
            expect(loadedTranscript.debate.negativePersonality.rhetoricUsage).toBe(negativePersonality.rhetoricUsage);
            expect(loadedTranscript.debate.negativePersonality.tactics).toEqual(negativePersonality.tactics);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all personality trait dimensions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          fc.array(fc.constantFrom(...Object.values(DebateTactic)), { minLength: 0, maxLength: 3 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, civility, manner, researchDepth, rhetoricUsage, tactics, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            // Create specific personality profile
            const affirmativePersonality: PersonalityProfile = {
              civility,
              manner,
              researchDepth,
              rhetoricUsage,
              tactics
            };
            
            const config = {
              ...DEFAULT_CONFIG,
              affirmativePersonality,
              negativePersonality: personalityGenerator.getDefaultProfile()
            };
            
            let debate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify all trait dimensions are preserved
            expect(transcript.debate.affirmativePersonality.civility).toBe(civility);
            expect(transcript.debate.affirmativePersonality.manner).toBe(manner);
            expect(transcript.debate.affirmativePersonality.researchDepth).toBe(researchDepth);
            expect(transcript.debate.affirmativePersonality.rhetoricUsage).toBe(rhetoricUsage);
            expect(transcript.debate.affirmativePersonality.tactics).toEqual(tactics);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve custom instructions in personality profiles', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, customInstructions, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            // Create personality with custom instructions
            const affirmativePersonality: PersonalityProfile = {
              ...personalityGenerator.generateRandom(),
              customInstructions
            };
            
            const config = {
              ...DEFAULT_CONFIG,
              affirmativePersonality,
              negativePersonality: personalityGenerator.getDefaultProfile()
            };
            
            let debate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify custom instructions are preserved
            expect(transcript.debate.affirmativePersonality.customInstructions).toBe(customInstructions);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve personality name if provided', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          fc.string({ minLength: 10, maxLength: 200 }),
          async (topic, personalityName, affPrep, negPrep) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            affirmativeModel.setResponse(RoundType.PREPARATION, affPrep);
            
            const negativeModel = new MockAIProvider('Model_B');
            negativeModel.setResponse(RoundType.PREPARATION, negPrep);
            
            // Create personality with name
            const affirmativePersonality: PersonalityProfile = {
              ...personalityGenerator.generateRandom(),
              name: personalityName
            };
            
            const config = {
              ...DEFAULT_CONFIG,
              affirmativePersonality,
              negativePersonality: personalityGenerator.getDefaultProfile()
            };
            
            let debate = orchestrator.initializeDebate(
              topic,
              config,
              affirmativeModel,
              negativeModel
            );
            
            debate = await orchestrator.executePreparation(debate);
            
            const transcript = transcriptManager.generateTranscript(debate);
            
            // Verify personality name is preserved
            expect(transcript.debate.affirmativePersonality.name).toBe(personalityName);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
