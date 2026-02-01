import * as fc from 'fast-check';
import { PersonalityValidator } from '../../src/validators/PersonalityValidator';
import { PersonalityProfile } from '../../src/models/PersonalityProfile';
import { DebateTactic } from '../../src/models/DebateTactic';

describe('Personality Validation Properties', () => {
  const validator = new PersonalityValidator();

  // Arbitrary for valid trait values (0-10)
  const validTraitArb = fc.double({ min: 0, max: 10, noNaN: true });

  // Arbitrary for invalid trait values (outside 0-10 range or special values)
  const invalidTraitArb = fc.oneof(
    fc.double({ min: -1000, max: -0.01, noNaN: true }), // negative
    fc.double({ min: 10.01, max: 1000, noNaN: true }),  // > 10
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity)
  );

  // Arbitrary for valid tactics
  const validTacticsArb = fc.array(
    fc.constantFrom(...Object.values(DebateTactic)),
    { minLength: 0, maxLength: 5 }
  );

  // Arbitrary for invalid tactics (strings that aren't valid DebateTactic values)
  const invalidTacticArb = fc.string().filter(
    s => !Object.values(DebateTactic).includes(s as DebateTactic)
  );

  // Arbitrary for valid personality profiles
  const validProfileArb = fc.record({
    civility: validTraitArb,
    manner: validTraitArb,
    researchDepth: validTraitArb,
    rhetoricUsage: validTraitArb,
    tactics: validTacticsArb,
    name: fc.option(fc.string(), { nil: undefined }),
    customInstructions: fc.option(fc.string(), { nil: undefined })
  });

  // **Feature: ai-debate-advanced, Property 13: Invalid personality profiles rejected**
  // **Validates: Requirements 3.4**
  describe('Property 13: Invalid personality profiles rejected', () => {
    it('should accept valid personality profiles', () => {
      fc.assert(
        fc.property(validProfileArb, (profile) => {
          const result = validator.validateProfile(profile);
          return result.isValid && result.errors.length === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should reject profiles with missing required dimensions', () => {
      fc.assert(
        fc.property(
          fc.record({
            civility: fc.option(validTraitArb, { nil: undefined }),
            manner: fc.option(validTraitArb, { nil: undefined }),
            researchDepth: fc.option(validTraitArb, { nil: undefined }),
            rhetoricUsage: fc.option(validTraitArb, { nil: undefined }),
            tactics: fc.option(validTacticsArb, { nil: undefined })
          }).filter(profile => 
            // At least one required field is missing
            profile.civility === undefined ||
            profile.manner === undefined ||
            profile.researchDepth === undefined ||
            profile.rhetoricUsage === undefined ||
            profile.tactics === undefined
          ),
          (incompleteProfile) => {
            const result = validator.validateProfile(incompleteProfile);
            return !result.isValid && result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject profiles with out-of-range trait values', () => {
      fc.assert(
        fc.property(
          fc.record({
            civility: validTraitArb,
            manner: validTraitArb,
            researchDepth: validTraitArb,
            rhetoricUsage: validTraitArb,
            tactics: validTacticsArb
          }),
          invalidTraitArb,
          fc.constantFrom('civility', 'manner', 'researchDepth', 'rhetoricUsage'),
          (validProfile, invalidValue, traitToInvalidate) => {
            // Create a profile with one invalid trait
            const invalidProfile = {
              ...validProfile,
              [traitToInvalidate]: invalidValue
            };

            const result = validator.validateProfile(invalidProfile);
            return !result.isValid && 
                   result.errors.length > 0 &&
                   result.invalidParams?.includes(traitToInvalidate);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject profiles with invalid tactics', () => {
      fc.assert(
        fc.property(
          fc.record({
            civility: validTraitArb,
            manner: validTraitArb,
            researchDepth: validTraitArb,
            rhetoricUsage: validTraitArb,
            tactics: validTacticsArb
          }),
          fc.array(invalidTacticArb, { minLength: 1, maxLength: 3 }),
          (validProfile, invalidTactics) => {
            // Mix valid and invalid tactics
            const invalidProfile = {
              ...validProfile,
              tactics: [...validProfile.tactics, ...invalidTactics] as DebateTactic[]
            };

            const result = validator.validateProfile(invalidProfile);
            return !result.isValid && 
                   result.errors.length > 0 &&
                   result.invalidParams?.includes('tactics');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject profiles where tactics is not an array', () => {
      fc.assert(
        fc.property(
          fc.record({
            civility: validTraitArb,
            manner: validTraitArb,
            researchDepth: validTraitArb,
            rhetoricUsage: validTraitArb
          }),
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.constant(null),
            fc.constant({}),
            fc.constant(true)
          ),
          (validTraits, nonArrayValue) => {
            const invalidProfile = {
              ...validTraits,
              tactics: nonArrayValue as any
            };

            const result = validator.validateProfile(invalidProfile);
            return !result.isValid && 
                   result.errors.length > 0 &&
                   result.invalidParams?.includes('tactics');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide specific error messages for each validation failure', () => {
      fc.assert(
        fc.property(validProfileArb, (profile) => {
          // Test missing civility
          const { civility, ...withoutCivility } = profile;
          const result1 = validator.validateProfile(withoutCivility);
          const hasCivilityError = result1.errors.some(e => e.includes('civility'));

          // Test invalid civility
          const withInvalidCivility = { ...profile, civility: -5 };
          const result2 = validator.validateProfile(withInvalidCivility);
          const hasRangeError = result2.errors.some(e => e.includes('between 0 and 10'));

          return hasCivilityError && hasRangeError;
        }),
        { numRuns: 100 }
      );
    });
  });
});
