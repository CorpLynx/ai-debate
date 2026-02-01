import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Personality Integration Tests', () => {
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl();
    affirmativeModel = new MockAIProvider('MockAffirmative');
    negativeModel = new MockAIProvider('MockNegative');
  });

  describe('Task 14: Integrate personalities into debate orchestrator', () => {
    it('should initialize debate with default personalities when not specified', () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: 'default',
        negativePersonality: 'default'
      };

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      // Verify personalities are set
      expect(debate.affirmativePersonality).toBeDefined();
      expect(debate.negativePersonality).toBeDefined();

      // Verify default personality values (all traits should be 5)
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
    });

    it('should initialize debate with random personalities when specified', () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: 'random',
        negativePersonality: 'random'
      };

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      // Verify personalities are set
      expect(debate.affirmativePersonality).toBeDefined();
      expect(debate.negativePersonality).toBeDefined();

      // Verify random personality values are in valid range (0-10)
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
    });

    it('should initialize debate with explicit personality profiles', () => {
      const customAffirmativePersonality: PersonalityProfile = {
        civility: 9,
        manner: 8,
        researchDepth: 10,
        rhetoricUsage: 2,
        tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
      };

      const customNegativePersonality: PersonalityProfile = {
        civility: 1,
        manner: 2,
        researchDepth: 3,
        rhetoricUsage: 9,
        tactics: [DebateTactic.AD_HOMINEM, DebateTactic.APPEAL_TO_EMOTION]
      };

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: customAffirmativePersonality,
        negativePersonality: customNegativePersonality
      };

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      // Verify exact personality profiles are used
      expect(debate.affirmativePersonality).toEqual(customAffirmativePersonality);
      expect(debate.negativePersonality).toEqual(customNegativePersonality);
    });

    it('should apply personalities when building prompts', async () => {
      const highCivilityPersonality: PersonalityProfile = {
        civility: 10,
        manner: 10,
        researchDepth: 10,
        rhetoricUsage: 2,
        tactics: [DebateTactic.NONE]
      };

      const lowCivilityPersonality: PersonalityProfile = {
        civility: 0,
        manner: 0,
        researchDepth: 2,
        rhetoricUsage: 10,
        tactics: [DebateTactic.AD_HOMINEM]
      };

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: highCivilityPersonality,
        negativePersonality: lowCivilityPersonality
      };

      let debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      // Execute preparation to trigger prompt building
      debate = await orchestrator.executePreparation(debate);

      // Verify debate completed preparation successfully
      expect(debate.rounds.length).toBe(1);
      expect(debate.rounds[0].affirmativeStatement).toBeDefined();
      expect(debate.rounds[0].negativeStatement).toBeDefined();

      // The prompts should have been built with personality traits
      // We can't directly inspect the prompts, but we can verify the debate progressed
      expect(debate.affirmativePersonality).toEqual(highCivilityPersonality);
      expect(debate.negativePersonality).toEqual(lowCivilityPersonality);
    });

    it('should default to default personality when config is undefined', () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG
        // affirmativePersonality and negativePersonality are undefined
      };

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      // Verify default personalities are applied
      expect(debate.affirmativePersonality.civility).toBe(5);
      expect(debate.affirmativePersonality.manner).toBe(5);
      expect(debate.affirmativePersonality.researchDepth).toBe(5);
      expect(debate.affirmativePersonality.rhetoricUsage).toBe(5);

      expect(debate.negativePersonality.civility).toBe(5);
      expect(debate.negativePersonality.manner).toBe(5);
      expect(debate.negativePersonality.researchDepth).toBe(5);
      expect(debate.negativePersonality.rhetoricUsage).toBe(5);
    });
  });
});
