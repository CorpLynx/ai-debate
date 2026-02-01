# Personality Error Handling

This document describes the error handling system for personality profiles in the AI Debate System.

## Overview

The personality error handling system provides clear, actionable error messages when invalid personality profiles are provided. It validates personality profiles at multiple points in the system and ensures that users receive helpful guidance on how to fix issues.

## PersonalityError Class

The `PersonalityError` class is a custom error type that extends the standard JavaScript `Error` class. It provides structured information about validation failures.

### Properties

- `message: string` - A human-readable error message
- `invalidParams: string[]` - List of parameter names that failed validation
- `validationErrors: string[]` - Detailed error messages for each validation failure

### Methods

#### `fromValidation(errors: string[], invalidParams: string[]): PersonalityError`

Creates a PersonalityError from validation results.

```typescript
const errors = ['civility must be between 0 and 10'];
const invalidParams = ['civility'];
const error = PersonalityError.fromValidation(errors, invalidParams);
```

#### `toUserFriendlyMessage(): string`

Generates a user-friendly error message with actionable guidance.

```typescript
const error = new PersonalityError('Invalid profile', ['civility'], ['civility must be between 0 and 10']);
console.log(error.toUserFriendlyMessage());
```

Output:
```
Personality Profile Error: Invalid profile

Issues found:
  1. civility must be between 0 and 10

Invalid parameters: civility

How to fix:
  • Ensure all trait values (civility, manner, researchDepth, rhetoricUsage) are numbers between 0 and 10
  • Ensure tactics is an array of valid DebateTactic values
  • All required dimensions must be present
```

## Validation Points

### 1. PersonalityGenerator.validateProfileOrThrow()

Validates a personality profile and throws a `PersonalityError` if invalid.

```typescript
const generator = new PersonalityGenerator();

try {
  generator.validateProfileOrThrow(profile);
  // Profile is valid
} catch (error) {
  if (error instanceof PersonalityError) {
    console.error(error.toUserFriendlyMessage());
  }
}
```

### 2. DebateOrchestrator.initializeDebate()

Validates personality profiles when initializing a debate. Distinguishes between affirmative and negative personality errors.

```typescript
const orchestrator = new DebateOrchestratorImpl();

try {
  const debate = orchestrator.initializeDebate(
    topic,
    config,
    affirmativeModel,
    negativeModel
  );
} catch (error) {
  if (error instanceof PersonalityError) {
    // Error message will indicate whether it's affirmative or negative
    console.error(error.message);
    console.error(error.toUserFriendlyMessage());
  }
}
```

## Common Validation Errors

### Out-of-Range Trait Values

Trait values must be between 0 and 10 (inclusive).

**Invalid:**
```typescript
{
  civility: 15,  // Too high
  manner: -1,    // Too low
  researchDepth: 5,
  rhetoricUsage: 5,
  tactics: []
}
```

**Valid:**
```typescript
{
  civility: 10,  // Maximum
  manner: 0,     // Minimum
  researchDepth: 5,
  rhetoricUsage: 5,
  tactics: []
}
```

### Missing Required Dimensions

All four trait dimensions must be present.

**Invalid:**
```typescript
{
  civility: 5,
  manner: 5
  // Missing researchDepth and rhetoricUsage
}
```

**Valid:**
```typescript
{
  civility: 5,
  manner: 5,
  researchDepth: 5,
  rhetoricUsage: 5,
  tactics: []
}
```

### Invalid Tactics

Tactics must be an array of valid `DebateTactic` enum values.

**Invalid:**
```typescript
{
  civility: 5,
  manner: 5,
  researchDepth: 5,
  rhetoricUsage: 5,
  tactics: ['invalid_tactic', 'another_invalid']  // Not valid DebateTactic values
}
```

**Valid:**
```typescript
import { DebateTactic } from './models/DebateTactic';

{
  civility: 5,
  manner: 5,
  researchDepth: 5,
  rhetoricUsage: 5,
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY, DebateTactic.GISH_GALLOP]
}
```

### Non-Array Tactics

The `tactics` field must be an array.

**Invalid:**
```typescript
{
  civility: 5,
  manner: 5,
  researchDepth: 5,
  rhetoricUsage: 5,
  tactics: 'not_an_array'  // Must be an array
}
```

**Valid:**
```typescript
{
  civility: 5,
  manner: 5,
  researchDepth: 5,
  rhetoricUsage: 5,
  tactics: []  // Empty array is valid
}
```

## Error Recovery

When a personality profile is invalid, you can recover by:

1. **Using the default personality:**
```typescript
const config = {
  ...DEFAULT_CONFIG,
  affirmativePersonality: 'default',
  negativePersonality: 'default'
};
```

2. **Using random generation:**
```typescript
const config = {
  ...DEFAULT_CONFIG,
  affirmativePersonality: 'random',
  negativePersonality: 'random'
};
```

3. **Fixing the invalid profile:**
```typescript
// Fix the validation errors
const validProfile = {
  civility: 8,      // Changed from 15 to 8
  manner: 7,
  researchDepth: 9,
  rhetoricUsage: 3,
  tactics: [DebateTactic.APPEAL_TO_AUTHORITY]
};

const config = {
  ...DEFAULT_CONFIG,
  affirmativePersonality: validProfile
};
```

## Best Practices

1. **Always validate explicit profiles:** When accepting personality profiles from user input or configuration files, validate them before use.

2. **Provide context in error messages:** When catching PersonalityError, add context about where the error occurred (e.g., "affirmative personality" vs "negative personality").

3. **Use toUserFriendlyMessage() for user-facing errors:** This method provides clear, actionable guidance.

4. **Log detailed errors for debugging:** The `validationErrors` and `invalidParams` arrays provide detailed information for debugging.

5. **Offer recovery options:** When validation fails, suggest using 'default' or 'random' as alternatives.

## Example: Complete Error Handling

```typescript
import { DebateOrchestratorImpl } from './orchestrator/DebateOrchestrator';
import { PersonalityError } from './models/PersonalityError';
import { DEFAULT_CONFIG } from './models/DebateConfig';

const orchestrator = new DebateOrchestratorImpl();

try {
  const debate = orchestrator.initializeDebate(
    'Should AI be regulated?',
    config,
    affirmativeModel,
    negativeModel
  );
  
  // Debate initialized successfully
  console.log('Debate started with personalities:');
  console.log('Affirmative:', debate.affirmativePersonality);
  console.log('Negative:', debate.negativePersonality);
  
} catch (error) {
  if (error instanceof PersonalityError) {
    // Handle personality validation error
    console.error('Failed to initialize debate due to invalid personality profile:');
    console.error(error.toUserFriendlyMessage());
    
    // Offer recovery
    console.log('\nRetrying with default personalities...');
    const fallbackConfig = {
      ...config,
      affirmativePersonality: 'default',
      negativePersonality: 'default'
    };
    
    const debate = orchestrator.initializeDebate(
      'Should AI be regulated?',
      fallbackConfig,
      affirmativeModel,
      negativeModel
    );
    
    console.log('Debate started successfully with default personalities');
  } else {
    // Handle other errors
    throw error;
  }
}
```

## Requirements Satisfied

This error handling system satisfies **Requirement 3.4**:
- Handles invalid personality profiles gracefully
- Provides clear error messages
- Identifies specific validation issues
- Offers actionable guidance for fixing errors
