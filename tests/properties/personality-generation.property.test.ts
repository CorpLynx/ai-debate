import * as fc from 'fast-check';
import { PersonalityGenerator } from '../../src/utils/PersonalityGenerator';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Personality Generation Properties', () => {
  const generator = new PersonalityGenerator();

  // **Feature: ai-debate-advanced, Property 14: Random personality generation produces valid profiles**
  // **Validates: Requirements 4.1, 4.2, 4.4**
  describe('Property 14: Random personality generation produces valid profiles', () => {
    it('should generate profiles that pass validation', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.generateRandom();
          const validation = generator.validateProfile(profile);
          
          return validation.isValid && validation.errors.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should include all required dimensions', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.generateRandom();
          
          return (
            profile.civility !== undefined &&
            profile.manner !== undefined &&
            profile.researchDepth !== undefined &&
            profile.rhetoricUsage !== undefined &&
            profile.tactics !== undefined
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should generate trait values in valid range (0-10)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.generateRandom();
          
          return (
            profile.civility >= 0 && profile.civility <= 10 &&
            profile.manner >= 0 && profile.manner <= 10 &&
            profile.researchDepth >= 0 && profile.researchDepth <= 10 &&
            profile.rhetoricUsage >= 0 && profile.rhetoricUsage <= 10
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should generate tactics array with valid DebateTactic values', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.generateRandom();
          const validTactics = Object.values(DebateTactic);
          
          return (
            Array.isArray(profile.tactics) &&
            profile.tactics.every(tactic => validTactics.includes(tactic))
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should generate trait values that are finite numbers', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.generateRandom();
          
          return (
            typeof profile.civility === 'number' && isFinite(profile.civility) &&
            typeof profile.manner === 'number' && isFinite(profile.manner) &&
            typeof profile.researchDepth === 'number' && isFinite(profile.researchDepth) &&
            typeof profile.rhetoricUsage === 'number' && isFinite(profile.rhetoricUsage)
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should generate diverse profiles (not all the same)', () => {
      // Generate multiple profiles and check they're not all identical
      const profiles = Array.from({ length: 20 }, () => generator.generateRandom());
      
      // Check that not all profiles have the same civility value
      const civilityValues = new Set(profiles.map(p => p.civility));
      const mannerValues = new Set(profiles.map(p => p.manner));
      const researchValues = new Set(profiles.map(p => p.researchDepth));
      const rhetoricValues = new Set(profiles.map(p => p.rhetoricUsage));
      
      // At least one dimension should have multiple different values
      expect(
        civilityValues.size > 1 ||
        mannerValues.size > 1 ||
        researchValues.size > 1 ||
        rhetoricValues.size > 1
      ).toBe(true);
    });
  });

  // **Feature: ai-debate-advanced, Property 12: Default personality when none specified**
  // **Validates: Requirements 3.3**
  describe('Property 12: Default personality when none specified', () => {
    it('should return a neutral profile with all traits at moderate values (5)', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.getDefaultProfile();
          
          return (
            profile.civility === 5 &&
            profile.manner === 5 &&
            profile.researchDepth === 5 &&
            profile.rhetoricUsage === 5
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should return a profile with NONE tactic', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.getDefaultProfile();
          
          return (
            Array.isArray(profile.tactics) &&
            profile.tactics.length === 1 &&
            profile.tactics[0] === DebateTactic.NONE
          );
        }),
        { numRuns: 100 }
      );
    });

    it('should return a valid profile that passes validation', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.getDefaultProfile();
          const validation = generator.validateProfile(profile);
          
          return validation.isValid && validation.errors.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should return the same profile every time (deterministic)', () => {
      const profile1 = generator.getDefaultProfile();
      const profile2 = generator.getDefaultProfile();
      
      expect(profile1.civility).toBe(profile2.civility);
      expect(profile1.manner).toBe(profile2.manner);
      expect(profile1.researchDepth).toBe(profile2.researchDepth);
      expect(profile1.rhetoricUsage).toBe(profile2.rhetoricUsage);
      expect(profile1.tactics).toEqual(profile2.tactics);
    });

    it('should include all required dimensions', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const profile = generator.getDefaultProfile();
          
          return (
            profile.civility !== undefined &&
            profile.manner !== undefined &&
            profile.researchDepth !== undefined &&
            profile.rhetoricUsage !== undefined &&
            profile.tactics !== undefined
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
