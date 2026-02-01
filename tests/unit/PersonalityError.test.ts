import { PersonalityError } from '../../src/models/PersonalityError';

describe('PersonalityError', () => {
  describe('constructor', () => {
    it('should create a PersonalityError with message', () => {
      const error = new PersonalityError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PersonalityError);
      expect(error.name).toBe('PersonalityError');
      expect(error.message).toBe('Test error');
      expect(error.invalidParams).toEqual([]);
      expect(error.validationErrors).toEqual([]);
    });

    it('should create a PersonalityError with invalid params and validation errors', () => {
      const error = new PersonalityError(
        'Invalid profile',
        ['civility', 'manner'],
        ['civility must be between 0 and 10', 'manner is required']
      );
      
      expect(error.message).toBe('Invalid profile');
      expect(error.invalidParams).toEqual(['civility', 'manner']);
      expect(error.validationErrors).toEqual([
        'civility must be between 0 and 10',
        'manner is required'
      ]);
    });
  });

  describe('fromValidation', () => {
    it('should create a PersonalityError from validation results', () => {
      const errors = ['civility must be a number between 0 and 10', 'tactics must be an array'];
      const invalidParams = ['civility', 'tactics'];
      
      const error = PersonalityError.fromValidation(errors, invalidParams);
      
      expect(error).toBeInstanceOf(PersonalityError);
      expect(error.message).toBe('Invalid personality profile: civility must be a number between 0 and 10; tactics must be an array');
      expect(error.invalidParams).toEqual(invalidParams);
      expect(error.validationErrors).toEqual(errors);
    });

    it('should handle empty validation results', () => {
      const error = PersonalityError.fromValidation([], []);
      
      expect(error.message).toBe('Invalid personality profile: ');
      expect(error.invalidParams).toEqual([]);
      expect(error.validationErrors).toEqual([]);
    });
  });

  describe('toUserFriendlyMessage', () => {
    it('should format a user-friendly error message', () => {
      const error = new PersonalityError(
        'Invalid personality profile',
        ['civility', 'tactics'],
        ['civility must be between 0 and 10', 'tactics must be an array']
      );
      
      const message = error.toUserFriendlyMessage();
      
      expect(message).toContain('Personality Profile Error');
      expect(message).toContain('Invalid personality profile');
      expect(message).toContain('Issues found:');
      expect(message).toContain('1. civility must be between 0 and 10');
      expect(message).toContain('2. tactics must be an array');
      expect(message).toContain('Invalid parameters: civility, tactics');
      expect(message).toContain('How to fix:');
      expect(message).toContain('Ensure all trait values');
    });

    it('should format message without validation errors', () => {
      const error = new PersonalityError('Something went wrong');
      
      const message = error.toUserFriendlyMessage();
      
      expect(message).toContain('Personality Profile Error');
      expect(message).toContain('Something went wrong');
      expect(message).toContain('How to fix:');
      expect(message).not.toContain('Issues found:');
      expect(message).not.toContain('Invalid parameters:');
    });

    it('should format message with validation errors but no invalid params', () => {
      const error = new PersonalityError(
        'Invalid profile',
        [],
        ['civility is required', 'manner is required']
      );
      
      const message = error.toUserFriendlyMessage();
      
      expect(message).toContain('Issues found:');
      expect(message).toContain('1. civility is required');
      expect(message).toContain('2. manner is required');
      expect(message).not.toContain('Invalid parameters:');
    });
  });
});
