import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { PersonalityError } from '../../src/models/PersonalityError';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('DebateOrchestrator Personality Error Handling', () => {
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl();
    affirmativeModel = new MockAIProvider('Mock Affirmative');
    negativeModel = new MockAIProvider('Mock Negative');
  });

  describe('initializeDebate with invalid personality profiles', () => {
    it('should throw PersonalityError for invalid affirmative personality', () => {
      const invalidProfile = {
        civility: 15, // Out of range
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      } as PersonalityProfile;

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: invalidProfile
      };

      expect(() => {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      }).toThrow(PersonalityError);

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        expect(personalityError.message).toContain('affirmative');
        expect(personalityError.message).toContain('Invalid');
      }
    });

    it('should throw PersonalityError for invalid negative personality', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: ['invalid_tactic' as any]
      } as PersonalityProfile;

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        negativePersonality: invalidProfile
      };

      expect(() => {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      }).toThrow(PersonalityError);

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        expect(personalityError.message).toContain('negative');
        expect(personalityError.message).toContain('Invalid');
      }
    });

    it('should throw PersonalityError for missing required dimensions', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5
        // Missing researchDepth and rhetoricUsage
      } as Partial<PersonalityProfile>;

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: invalidProfile as PersonalityProfile
      };

      expect(() => {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      }).toThrow(PersonalityError);

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        expect(personalityError.validationErrors.some(e => e.includes('researchDepth'))).toBe(true);
        expect(personalityError.validationErrors.some(e => e.includes('rhetoricUsage'))).toBe(true);
      }
    });

    it('should succeed with valid explicit personality profiles', () => {
      const validProfile: PersonalityProfile = {
        civility: 8,
        manner: 7,
        researchDepth: 9,
        rhetoricUsage: 3,
        tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
      };

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: validProfile,
        negativePersonality: validProfile
      };

      expect(() => {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      }).not.toThrow();

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      expect(debate.affirmativePersonality).toEqual(validProfile);
      expect(debate.negativePersonality).toEqual(validProfile);
    });

    it('should succeed with "random" personality configuration', () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: 'random',
        negativePersonality: 'random'
      };

      expect(() => {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      }).not.toThrow();

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      // Should have generated valid random profiles
      expect(debate.affirmativePersonality).toBeDefined();
      expect(debate.negativePersonality).toBeDefined();
      expect(debate.affirmativePersonality.civility).toBeGreaterThanOrEqual(0);
      expect(debate.affirmativePersonality.civility).toBeLessThanOrEqual(10);
    });

    it('should succeed with "default" personality configuration', () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: 'default',
        negativePersonality: 'default'
      };

      expect(() => {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
      }).not.toThrow();

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      // Should have default profiles with moderate values
      expect(debate.affirmativePersonality.civility).toBe(5);
      expect(debate.affirmativePersonality.manner).toBe(5);
      expect(debate.negativePersonality.civility).toBe(5);
      expect(debate.negativePersonality.manner).toBe(5);
    });

    it('should provide clear error message distinguishing affirmative vs negative', () => {
      const invalidAffirmative = {
        civility: 15,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      } as PersonalityProfile;

      const invalidNegative = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: ['bad_tactic' as any]
      } as PersonalityProfile;

      // Test affirmative error
      const configAff: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: invalidAffirmative
      };

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          configAff,
          affirmativeModel,
          negativeModel
        );
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        expect((error as PersonalityError).message).toContain('affirmative');
        expect((error as PersonalityError).message).not.toContain('negative');
      }

      // Test negative error
      const configNeg: DebateConfig = {
        ...DEFAULT_CONFIG,
        negativePersonality: invalidNegative
      };

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          configNeg,
          affirmativeModel,
          negativeModel
        );
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        expect((error as PersonalityError).message).toContain('negative');
        expect((error as PersonalityError).message).not.toContain('affirmative');
      }
    });
  });
});
