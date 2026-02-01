import { PersonalityGenerator } from '../../src/utils/PersonalityGenerator';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

/**
 * Unit tests for PersonalityGenerator
 * Requirements: 3.4, 4.1
 */
describe('PersonalityGenerator', () => {
  let generator: PersonalityGenerator;

  beforeEach(() => {
    generator = new PersonalityGenerator();
  });

  describe('generateRandom', () => {
    it('should generate a valid personality profile', () => {
      const profile = generator.generateRandom();

      expect(profile).toBeDefined();
      expect(profile.civility).toBeDefined();
      expect(profile.manner).toBeDefined();
      expect(profile.researchDepth).toBeDefined();
      expect(profile.rhetoricUsage).toBeDefined();
      expect(profile.tactics).toBeDefined();
    });

    it('should generate trait values within valid range (0-10)', () => {
      const profile = generator.generateRandom();

      expect(profile.civility).toBeGreaterThanOrEqual(0);
      expect(profile.civility).toBeLessThanOrEqual(10);
      expect(profile.manner).toBeGreaterThanOrEqual(0);
      expect(profile.manner).toBeLessThanOrEqual(10);
      expect(profile.researchDepth).toBeGreaterThanOrEqual(0);
      expect(profile.researchDepth).toBeLessThanOrEqual(10);
      expect(profile.rhetoricUsage).toBeGreaterThanOrEqual(0);
      expect(profile.rhetoricUsage).toBeLessThanOrEqual(10);
    });

    it('should generate tactics as an array', () => {
      const profile = generator.generateRandom();

      expect(Array.isArray(profile.tactics)).toBe(true);
    });

    it('should generate only valid DebateTactic values', () => {
      const profile = generator.generateRandom();
      const validTactics = Object.values(DebateTactic);

      profile.tactics.forEach(tactic => {
        expect(validTactics).toContain(tactic);
      });
    });

    it('should generate profiles that pass validation', () => {
      const profile = generator.generateRandom();
      const validation = generator.validateProfile(profile);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should generate diverse profiles across multiple calls', () => {
      const profiles: PersonalityProfile[] = [];
      
      // Generate 10 profiles
      for (let i = 0; i < 10; i++) {
        profiles.push(generator.generateRandom());
      }

      // Check that not all profiles are identical
      const allIdentical = profiles.every(p => 
        p.civility === profiles[0].civility &&
        p.manner === profiles[0].manner &&
        p.researchDepth === profiles[0].researchDepth &&
        p.rhetoricUsage === profiles[0].rhetoricUsage
      );

      expect(allIdentical).toBe(false);
    });

    it('should generate integer trait values', () => {
      const profile = generator.generateRandom();

      expect(Number.isInteger(profile.civility)).toBe(true);
      expect(Number.isInteger(profile.manner)).toBe(true);
      expect(Number.isInteger(profile.researchDepth)).toBe(true);
      expect(Number.isInteger(profile.rhetoricUsage)).toBe(true);
    });
  });

  describe('validateProfile', () => {
    it('should accept a valid profile', () => {
      const validProfile: PersonalityProfile = {
        civility: 5,
        manner: 7,
        researchDepth: 3,
        rhetoricUsage: 8,
        tactics: [DebateTactic.APPEAL_TO_EMOTION]
      };

      const result = generator.validateProfile(validProfile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept profile with empty tactics array', () => {
      const validProfile: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(validProfile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept profile with NONE tactic', () => {
      const validProfile: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [DebateTactic.NONE]
      };

      const result = generator.validateProfile(validProfile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept profile with multiple tactics', () => {
      const validProfile: PersonalityProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: [DebateTactic.GISH_GALLOP, DebateTactic.STRAWMAN, DebateTactic.AD_HOMINEM]
      };

      const result = generator.validateProfile(validProfile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept profile with boundary trait values (0 and 10)', () => {
      const validProfile: PersonalityProfile = {
        civility: 0,
        manner: 10,
        researchDepth: 0,
        rhetoricUsage: 10,
        tactics: []
      };

      const result = generator.validateProfile(validProfile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject profile with missing civility', () => {
      const invalidProfile = {
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      } as any;

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('civility'))).toBe(true);
    });

    it('should reject profile with missing manner', () => {
      const invalidProfile = {
        civility: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      } as any;

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('manner'))).toBe(true);
    });

    it('should reject profile with missing researchDepth', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5,
        rhetoricUsage: 5,
        tactics: []
      } as any;

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('researchDepth'))).toBe(true);
    });

    it('should reject profile with missing rhetoricUsage', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        tactics: []
      } as any;

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('rhetoricUsage'))).toBe(true);
    });

    it('should reject profile with missing tactics', () => {
      const invalidProfile = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5
      } as any;

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('tactics'))).toBe(true);
    });

    it('should reject profile with civility below 0', () => {
      const invalidProfile: any = {
        civility: -1,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('civility') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with civility above 10', () => {
      const invalidProfile: any = {
        civility: 11,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('civility') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with manner below 0', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: -5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('manner') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with manner above 10', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: 15,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('manner') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with researchDepth below 0', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: 5,
        researchDepth: -3,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('researchDepth') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with researchDepth above 10', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: 5,
        researchDepth: 20,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('researchDepth') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with rhetoricUsage below 0', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: -10,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('rhetoricUsage') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with rhetoricUsage above 10', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 100,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('rhetoricUsage') && e.includes('0 and 10'))).toBe(true);
    });

    it('should reject profile with invalid tactic', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: ['invalid_tactic']
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('tactics') || e.includes('Invalid'))).toBe(true);
    });

    it('should reject profile with non-array tactics', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: 'not_an_array'
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('tactics') && e.includes('array'))).toBe(true);
    });

    it('should reject profile with NaN trait value', () => {
      const invalidProfile: any = {
        civility: NaN,
        manner: 5,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject profile with Infinity trait value', () => {
      const invalidProfile: any = {
        civility: 5,
        manner: Infinity,
        researchDepth: 5,
        rhetoricUsage: 5,
        tactics: []
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report multiple validation errors for profile with multiple issues', () => {
      const invalidProfile: any = {
        civility: -5,
        manner: 15,
        // missing researchDepth
        rhetoricUsage: NaN,
        tactics: 'not_an_array'
      };

      const result = generator.validateProfile(invalidProfile);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('getDefaultProfile', () => {
    it('should return a profile with all traits set to 5', () => {
      const profile = generator.getDefaultProfile();

      expect(profile.civility).toBe(5);
      expect(profile.manner).toBe(5);
      expect(profile.researchDepth).toBe(5);
      expect(profile.rhetoricUsage).toBe(5);
    });

    it('should return a profile with NONE tactic', () => {
      const profile = generator.getDefaultProfile();

      expect(profile.tactics).toEqual([DebateTactic.NONE]);
    });

    it('should return a valid profile', () => {
      const profile = generator.getDefaultProfile();
      const validation = generator.validateProfile(profile);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return the same profile on multiple calls', () => {
      const profile1 = generator.getDefaultProfile();
      const profile2 = generator.getDefaultProfile();

      expect(profile1.civility).toBe(profile2.civility);
      expect(profile1.manner).toBe(profile2.manner);
      expect(profile1.researchDepth).toBe(profile2.researchDepth);
      expect(profile1.rhetoricUsage).toBe(profile2.rhetoricUsage);
      expect(profile1.tactics).toEqual(profile2.tactics);
    });

    it('should include all required dimensions', () => {
      const profile = generator.getDefaultProfile();

      expect(profile.civility).toBeDefined();
      expect(profile.manner).toBeDefined();
      expect(profile.researchDepth).toBeDefined();
      expect(profile.rhetoricUsage).toBeDefined();
      expect(profile.tactics).toBeDefined();
    });
  });
});
