import { PersonalityProfile } from '../models/PersonalityProfile';
import { DebateTactic } from '../models/DebateTactic';
import { ValidationResult } from '../models/ValidationResult';
import { PersonalityValidator } from '../validators/PersonalityValidator';
import { PersonalityError } from '../models/PersonalityError';

/**
 * PersonalityGenerator creates and manages personality profiles for debaters.
 * It can generate random profiles with coherent trait combinations.
 */
export class PersonalityGenerator {
  private validator: PersonalityValidator;

  constructor() {
    this.validator = new PersonalityValidator();
  }

  /**
   * Generates a random personality profile with valid trait values.
   * All dimensions (civility, manner, researchDepth, rhetoricUsage) are included.
   * The generated profile is guaranteed to pass validation.
   * 
   * @returns A valid random PersonalityProfile
   * @throws PersonalityError if the generated profile is invalid (should never happen)
   */
  generateRandom(): PersonalityProfile {
    try {
      const profile: PersonalityProfile = {
        civility: this.randomTraitValue(),
        manner: this.randomTraitValue(),
        researchDepth: this.randomTraitValue(),
        rhetoricUsage: this.randomTraitValue(),
        tactics: this.randomTactics()
      };

      // Validate the generated profile to ensure it's valid
      const validation = this.validator.validateProfile(profile);
      if (!validation.isValid) {
        // This should never happen with our random generation logic
        throw PersonalityError.fromValidation(validation.errors, validation.invalidParams || []);
      }

      return profile;
    } catch (error) {
      if (error instanceof PersonalityError) {
        throw error;
      }
      // Wrap unexpected errors
      throw new PersonalityError(
        `Failed to generate random personality profile: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Validates a personality profile.
   * 
   * @param profile - The personality profile to validate
   * @returns ValidationResult indicating whether the profile is valid
   */
  validateProfile(profile: PersonalityProfile): ValidationResult {
    return this.validator.validateProfile(profile);
  }

  /**
   * Validates a personality profile and throws a PersonalityError if invalid.
   * Provides clear, actionable error messages for invalid profiles.
   * 
   * @param profile - The personality profile to validate
   * @throws PersonalityError if the profile is invalid
   * 
   * Requirements:
   * - 3.4: Handle invalid personality profiles gracefully with clear error messages
   */
  validateProfileOrThrow(profile: Partial<PersonalityProfile>): asserts profile is PersonalityProfile {
    const validation = this.validator.validateProfile(profile);
    
    if (!validation.isValid) {
      throw PersonalityError.fromValidation(validation.errors, validation.invalidParams || []);
    }
  }

  /**
   * Returns a default neutral personality profile.
   * All traits are set to moderate values (5).
   * 
   * @returns A neutral default PersonalityProfile
   */
  getDefaultProfile(): PersonalityProfile {
    return {
      civility: 5,
      manner: 5,
      researchDepth: 5,
      rhetoricUsage: 5,
      tactics: [DebateTactic.NONE]
    };
  }

  /**
   * Generates a random trait value between 0 and 10 (inclusive).
   * 
   * @returns A random number between 0 and 10
   */
  private randomTraitValue(): number {
    return Math.floor(Math.random() * 11); // 0-10 inclusive
  }

  /**
   * Generates a random array of debate tactics.
   * Can return an empty array, a single tactic, or multiple tactics.
   * 
   * @returns An array of DebateTactic values
   */
  private randomTactics(): DebateTactic[] {
    const allTactics = Object.values(DebateTactic);
    
    // Randomly decide how many tactics to include (0-3)
    const tacticCount = Math.floor(Math.random() * 4);
    
    if (tacticCount === 0) {
      // Return NONE or empty array
      return Math.random() < 0.5 ? [DebateTactic.NONE] : [];
    }

    // Select random tactics
    const selectedTactics: DebateTactic[] = [];
    const availableTactics = [...allTactics];
    
    for (let i = 0; i < tacticCount && availableTactics.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableTactics.length);
      selectedTactics.push(availableTactics[randomIndex]);
      availableTactics.splice(randomIndex, 1);
    }

    return selectedTactics;
  }
}
