import { PersonalityGenerator } from '../../src/utils/PersonalityGenerator';
import { PersonalityError } from '../../src/models/PersonalityError';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('PersonalityGenerator Error Handling', () => {
  let generator: PersonalityGenerator;

  beforeEach(() => {
    generator = new PersonalityGenerator();
  });

  describe('validateProfileOrThrow', () => {
    it('should not throw for valid profile', () => {
      const validProfile: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [DebateTactic.NONE]
      };

      expect(() => generator.validateProfileOrThrow(validProfile)).not.toThrow();
    });

    it('should throw PersonalityError for missing required dimensions', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5
        // Missing researchDepth and rhetoricUsage
      } as Partial<PersonalityProfile>;

      expect(() => generator.validateProfileOrThrow(invalidProfile)).toThrow(PersonalityError);
      
      try {
        generator.validateProfileOrThrow(invalidProfile);
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        expect(personalityError.validationErrors).toContain('researchDepth dimension is required');
        expect(personalityError.validationErrors).toContain('rhetoricUsage dimension is required');
        expect(personalityError.invalidParams).toContain('researchDepth');
        expect(personalityError.invalidParams).toContain('rhetoricUsage');
      }
    });

    it('should throw PersonalityError for out-of-range trait values', () => {
      const invalidProfile = {
        civility: 15, // Out of range
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: -1, // Out of range
        tactics: []
      } as Partial<PersonalityProfile>;

      expect(() => generator.validateProfileOrThrow(invalidProfile)).toThrow(PersonalityError);
      
      try {
        generator.validateProfileOrThrow(invalidProfile);
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        expect(personalityError.validationErrors).toContain('civility must be a number between 0 and 10');
        expect(personalityError.validationErrors).toContain('rhetoricUsage must be a number between 0 and 10');
        expect(personalityError.invalidParams).toContain('civility');
        expect(personalityError.invalidParams).toContain('rhetoricUsage');
      }
    });

    it('should throw PersonalityError for invalid tactics', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: ['invalid_tactic' as any, 'another_invalid' as any]
      } as Partial<PersonalityProfile>;

      expect(() => generator.validateProfileOrThrow(invalidProfile)).toThrow(PersonalityError);
      
      try {
        generator.validateProfileOrThrow(invalidProfile);
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        expect(personalityError.validationErrors.some(e => e.includes('Invalid tactics'))).toBe(true);
        expect(personalityError.invalidParams).toContain('tactics');
      }
    });

    it('should throw PersonalityError for non-array tactics', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: 'not_an_array' as any
      } as Partial<PersonalityProfile>;

      expect(() => generator.validateProfileOrThrow(invalidProfile)).toThrow(PersonalityError);
      
      try {
        generator.validateProfileOrThrow(invalidProfile);
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        expect(personalityError.validationErrors).toContain('tactics must be an array');
        expect(personalityError.invalidParams).toContain('tactics');
      }
    });

    it('should provide clear error message with all validation issues', () => {
      const invalidProfile = {
        civility: 15,
        manner: -5,
        // Missing researchDepth and rhetoricUsage
        tactics: 'invalid' as any
      } as Partial<PersonalityProfile>;

      try {
        generator.validateProfileOrThrow(invalidProfile);
        fail('Should have thrown PersonalityError');
      } catch (error) {
        expect(error).toBeInstanceOf(PersonalityError);
        const personalityError = error as PersonalityError;
        
        // Should have multiple validation errors
        expect(personalityError.validationErrors.length).toBeGreaterThan(3);
        
        // Should include all problematic parameters
        expect(personalityError.invalidParams).toContain('civility');
        expect(personalityError.invalidParams).toContain('manner');
        expect(personalityError.invalidParams).toContain('researchDepth');
        expect(personalityError.invalidParams).toContain('rhetoricUsage');
        expect(personalityError.invalidParams).toContain('tactics');
      }
    });
  });

  describe('generateRandom error handling', () => {
    it('should always generate valid profiles', () => {
      // Generate multiple random profiles to ensure they're all valid
      for (let i = 0; i < 20; i++) {
        const profile = generator.generateRandom();
        
        // Should not throw when validating
        expect(() => generator.validateProfileOrThrow(profile)).not.toThrow();
        
        // Verify all dimensions are present and valid
        expect(profile.civility).toBeGreaterThanOrEqual(0);
        expect(profile.civility).toBeLessThanOrEqual(10);
        expect(profile.manner).toBeGreaterThanOrEqual(0);
        expect(profile.manner).toBeLessThanOrEqual(10);
        expect(profile.researchDepth).toBeGreaterThanOrEqual(0);
        expect(profile.researchDepth).toBeLessThanOrEqual(10);
        expect(profile.rhetoricUsage).toBeGreaterThanOrEqual(0);
        expect(profile.rhetoricUsage).toBeLessThanOrEqual(10);
        expect(Array.isArray(profile.tactics)).toBe(true);
      }
    });
  });

  describe('getDefaultProfile', () => {
    it('should always return a valid profile', () => {
      const profile = generator.getDefaultProfile();
      
      // Should not throw when validating
      expect(() => generator.validateProfileOrThrow(profile)).not.toThrow();
      
      // Verify default values
      expect(profile.civility).toBe(5);
      expect(profile.manner).toBe(5);
      expect(profile.researchDepth).toBe(5);
      expect(profile.rhetoricUsage).toBe(5);
      expect(profile.tactics).toEqual([DebateTactic.NONE]);
    });
  });
});
