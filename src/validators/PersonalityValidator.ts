import { ValidationResult } from '../models/ValidationResult';
import { PersonalityProfile, CivilityLevel, MannerLevel, ResearchLevel, RhetoricLevel } from '../models/PersonalityProfile';
import { DebateTactic } from '../models/DebateTactic';

export class PersonalityValidator {
  /**
   * Validates a personality profile.
   * 
   * @param profile - The personality profile to validate
   * @returns ValidationResult indicating whether the profile is valid
   */
  validateProfile(profile: Partial<PersonalityProfile>): ValidationResult {
    const errors: string[] = [];
    const invalidParams: string[] = [];

    // Validate required dimensions are present
    if (profile.civility === undefined) {
      errors.push('civility dimension is required');
      invalidParams.push('civility');
    }

    if (profile.manner === undefined) {
      errors.push('manner dimension is required');
      invalidParams.push('manner');
    }

    if (profile.researchDepth === undefined) {
      errors.push('researchDepth dimension is required');
      invalidParams.push('researchDepth');
    }

    if (profile.rhetoricUsage === undefined) {
      errors.push('rhetoricUsage dimension is required');
      invalidParams.push('rhetoricUsage');
    }

    if (profile.tactics === undefined) {
      errors.push('tactics array is required');
      invalidParams.push('tactics');
    }

    // Validate trait values are in 0-10 range
    if (profile.civility !== undefined) {
      if (!this.isValidTraitValue(profile.civility)) {
        errors.push('civility must be a number between 0 and 10');
        invalidParams.push('civility');
      }
    }

    if (profile.manner !== undefined) {
      if (!this.isValidTraitValue(profile.manner)) {
        errors.push('manner must be a number between 0 and 10');
        invalidParams.push('manner');
      }
    }

    if (profile.researchDepth !== undefined) {
      if (!this.isValidTraitValue(profile.researchDepth)) {
        errors.push('researchDepth must be a number between 0 and 10');
        invalidParams.push('researchDepth');
      }
    }

    if (profile.rhetoricUsage !== undefined) {
      if (!this.isValidTraitValue(profile.rhetoricUsage)) {
        errors.push('rhetoricUsage must be a number between 0 and 10');
        invalidParams.push('rhetoricUsage');
      }
    }

    // Validate tactics are from valid DebateTactic enum
    if (profile.tactics !== undefined) {
      if (!Array.isArray(profile.tactics)) {
        errors.push('tactics must be an array');
        invalidParams.push('tactics');
      } else {
        const validTactics = Object.values(DebateTactic);
        const invalidTactics = profile.tactics.filter(
          tactic => !validTactics.includes(tactic)
        );
        
        if (invalidTactics.length > 0) {
          errors.push(`Invalid tactics: ${invalidTactics.join(', ')}. Valid tactics are: ${validTactics.join(', ')}`);
          invalidParams.push('tactics');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      invalidParams
    };
  }

  /**
   * Validates that a trait value is a number between 0 and 10 (inclusive).
   * 
   * @param value - The trait value to validate
   * @returns true if the value is valid, false otherwise
   */
  private isValidTraitValue(value: number): boolean {
    return typeof value === 'number' && 
           value >= 0 && 
           value <= 10 && 
           isFinite(value);
  }
}
