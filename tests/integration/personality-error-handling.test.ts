import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { PersonalityError } from '../../src/models/PersonalityError';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

/**
 * Integration tests for personality error handling across the system.
 * 
 * Requirements:
 * - 3.4: Handle invalid personality profiles gracefully with clear error messages
 */
describe('Personality Error Handling Integration', () => {
  let orchestrator: DebateOrchestratorImpl;
  let affirmativeModel: MockAIProvider;
  let negativeModel: MockAIProvider;

  beforeEach(() => {
    orchestrator = new DebateOrchestratorImpl();
    affirmativeModel = new MockAIProvider('Mock Affirmative');
    negativeModel = new MockAIProvider('Mock Negative');
  });

  describe('End-to-end error handling', () => {
    it('should provide actionable error messages for common mistakes', () => {
      // Common mistake: trait value out of range
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: {
          civility: 11, // Should be 0-10
          manner: 5,
          researchDepth: 5,
          rhetoricUsage: 5,
          tactics: []
        } as PersonalityProfile
      };

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
        fail('Should have thrown PersonalityError');
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        
        // Error message should be clear and actionable
        const userMessage = personalityError.toUserFriendlyMessage();
        expect(userMessage).toContain('Personality Profile Error');
        expect(userMessage).toContain('How to fix');
        expect(userMessage).toContain('between 0 and 10');
        
        // Should identify the specific problem
        expect(personalityError.invalidParams).toContain('civility');
        expect(personalityError.validationErrors.some(e => e.includes('civility'))).toBe(true);
      }
    });

    it('should handle multiple validation errors at once', () => {
      // Multiple mistakes in one profile
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        negativePersonality: {
          civility: -1, // Out of range
          manner: 15, // Out of range
          researchDepth: 5,
          // Missing rhetoricUsage
          tactics: 'not_an_array' as any // Wrong type
        } as any
      };

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
        fail('Should have thrown PersonalityError');
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        
        // Should report all errors
        expect(personalityError.validationErrors.length).toBeGreaterThan(3);
        expect(personalityError.invalidParams.length).toBeGreaterThan(3);
        
        // Should mention it's the negative personality
        expect(personalityError.message).toContain('negative');
        
        // User-friendly message should list all issues
        const userMessage = personalityError.toUserFriendlyMessage();
        expect(userMessage).toContain('Issues found:');
        expect(userMessage).toContain('1.');
        expect(userMessage).toContain('2.');
        expect(userMessage).toContain('3.');
      }
    });

    it('should allow recovery by using default personality', () => {
      // First attempt with invalid profile
      const invalidConfig: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: {
          civility: 100,
          manner: 5,
          researchDepth: 5,
          rhetoricUsage: 5,
          tactics: []
        } as PersonalityProfile
      };

      expect(() => {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          invalidConfig,
          affirmativeModel,
          negativeModel
        );
      }).toThrow(PersonalityError);

      // Recovery: use default personality
      const validConfig: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: 'default',
        negativePersonality: 'default'
      };

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        validConfig,
        affirmativeModel,
        negativeModel
      );

      expect(debate).toBeDefined();
      expect(debate.affirmativePersonality.civility).toBe(5);
      expect(debate.negativePersonality.civility).toBe(5);
    });

    it('should validate explicit profiles before use', () => {
      // Valid profile should work
      const validProfile: PersonalityProfile = {
        civility: 8,
        manner: 7,
        researchDepth: 9,
        rhetoricUsage: 3,
        tactics: [DebateTactic.APPEAL_TO_AUTHORITY, DebateTactic.APPEAL_TO_EMOTION]
      };

      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: validProfile,
        negativePersonality: validProfile
      };

      const debate = orchestrator.initializeDebate(
        'Should AI be regulated?',
        config,
        affirmativeModel,
        negativeModel
      );

      expect(debate).toBeDefined();
      expect(debate.affirmativePersonality).toEqual(validProfile);
      expect(debate.negativePersonality).toEqual(validProfile);
    });

    it('should provide helpful guidance in error messages', () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: {
          civility: 5,
          manner: 5,
          researchDepth: 5,
          rhetoricUsage: 5,
          tactics: ['fake_tactic' as any, 'another_fake' as any]
        } as PersonalityProfile
      };

      try {
        orchestrator.initializeDebate(
          'Should AI be regulated?',
          config,
          affirmativeModel,
          negativeModel
        );
        fail('Should have thrown PersonalityError');
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        
        const userMessage = personalityError.toUserFriendlyMessage();
        
        // Should provide guidance on how to fix
        expect(userMessage).toContain('How to fix:');
        expect(userMessage).toContain('valid DebateTactic values');
        
        // Should list what went wrong
        expect(userMessage).toContain('Issues found:');
        expect(personalityError.validationErrors.some(e => e.includes('Invalid tactics'))).toBe(true);
      }
    });
  });

  describe('Error message clarity', () => {
    it('should distinguish between affirmative and negative personality errors', () => {
      const invalidProfile: PersonalityProfile = {
        civility: 20,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      } as PersonalityProfile;

      // Test affirmative
      const affConfig: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: invalidProfile
      };

      try {
        orchestrator.initializeDebate('Topic', affConfig, affirmativeModel, negativeModel);
        fail('Should have thrown');
      } catch (error) {
        expect((error as PersonalityError).message).toContain('affirmative');
        expect((error as PersonalityError).message).not.toContain('negative');
      }

      // Test negative
      const negConfig: DebateConfig = {
        ...DEFAULT_CONFIG,
        negativePersonality: invalidProfile
      };

      try {
        orchestrator.initializeDebate('Topic', negConfig, affirmativeModel, negativeModel);
        fail('Should have thrown');
      } catch (error) {
        expect((error as PersonalityError).message).toContain('negative');
        expect((error as PersonalityError).message).not.toContain('affirmative');
      }
    });

    it('should provide specific parameter names in error messages', () => {
      const config: DebateConfig = {
        ...DEFAULT_CONFIG,
        affirmativePersonality: {
          civility: 5,
          manner: 5,
          // Missing researchDepth and rhetoricUsage
          tactics: []
        } as any
      };

      try {
        orchestrator.initializeDebate('Topic', config, affirmativeModel, negativeModel);
        fail('Should have thrown');
      } catch (error) {
        const personalityError = error as PersonalityError;
        expect(personalityError.invalidParams).toContain('researchDepth');
        expect(personalityError.invalidParams).toContain('rhetoricUsage');
        
        const userMessage = personalityError.toUserFriendlyMessage();
        expect(userMessage).toContain('Invalid parameters: ');
        expect(userMessage).toContain('researchDepth');
        expect(userMessage).toContain('rhetoricUsage');
      }
    });
  });
});
