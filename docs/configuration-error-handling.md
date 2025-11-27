# Configuration Error Handling

This document describes the error handling implementation for configuration operations in the AI Debate System.

## Overview

The configuration system handles errors gracefully by:
1. Using default values when configuration files are missing
2. Displaying warnings for invalid configuration formats
3. Falling back to defaults for invalid individual parameters
4. Combining warnings from multiple sources

## Implementation

### ConfigurationManager

The `ConfigurationManager` class provides comprehensive error handling for configuration operations:

#### loadFromFile()

Returns an object containing:
- `config`: Partial configuration loaded from file
- `warnings`: Array of warning messages for any issues encountered

**Error Handling:**
- **Missing file**: Returns empty config with no warnings (expected behavior)
- **Invalid JSON**: Returns empty config with warning about JSON format
- **File read errors**: Returns empty config with warning about the specific error

#### loadAndMerge()

Combines configuration from multiple sources (CLI, environment, file) and validates all parameters.

Returns a `ConfigurationResult` containing:
- `config`: Merged and validated configuration
- `warnings`: Combined warnings from file loading and validation
- `invalidParams`: List of parameter names that were invalid

**Error Handling:**
- **Missing parameters**: Uses defaults without warnings
- **Invalid parameters**: Uses defaults and adds warnings
- **Multiple errors**: Combines all warnings into a single array

### Warning Display

Warnings are displayed to users in two places:

1. **Interactive Mode** (`InteractiveCLI.ts`):
   ```typescript
   if (result.warnings.length > 0) {
     console.log(chalk.yellow('\n⚠️  Configuration Warnings:'));
     for (const warning of result.warnings) {
       console.log(chalk.yellow(`   ${warning}`));
     }
   }
   ```

2. **CLI Mode** (`cli/index.ts`):
   ```typescript
   if (result.warnings.length > 0) {
     console.log('\n⚠️  Configuration Warnings:');
     result.warnings.forEach(warning => console.log(`   ${warning}`));
   }
   ```

## Error Scenarios

### 1. Missing Configuration File

**Behavior**: Uses all default values, no warnings displayed

**Example**:
```typescript
const result = configManager.loadAndMerge({}, '/nonexistent/.debaterc');
// result.config === DEFAULT_CONFIG
// result.warnings === []
```

### 2. Invalid JSON Format

**Behavior**: Uses all default values, displays warning about JSON format

**Example**:
```json
{ invalid json }
```

**Warning**: `Configuration file at /path/.debaterc contains invalid JSON format. Using default values.`

### 3. Missing Individual Parameters

**Behavior**: Uses defaults for missing parameters, no warnings

**Example**:
```json
{
  "timeLimit": 120
  // Other parameters missing
}
```

**Result**: `timeLimit` is 120, all other parameters use defaults

### 4. Invalid Individual Parameters

**Behavior**: Uses defaults for invalid parameters, displays warnings

**Example**:
```json
{
  "timeLimit": -50,
  "wordLimit": 300,
  "strictMode": "not a boolean"
}
```

**Warnings**:
- `Invalid value for timeLimit, using default: 120`
- `Invalid value for strictMode, using default: false`

**Result**: `wordLimit` is 300, `timeLimit` and `strictMode` use defaults

## Validation Rules

Parameters are validated according to these rules:

- **timeLimit**: Must be a positive number
- **wordLimit**: Must be a positive integer
- **strictMode**: Must be a boolean
- **showPreparation**: Must be a boolean
- **numCrossExamQuestions**: Must be a non-negative integer
- **preparationTime**: Must be a positive number

## Testing

The error handling implementation is tested at multiple levels:

1. **Unit Tests** (`tests/unit/ConfigurationManager.file.test.ts`):
   - File loading with various error conditions
   - Individual parameter validation
   - Warning generation

2. **Property Tests** (`tests/properties/config-fallback.property.test.ts`):
   - Random invalid configurations
   - Fallback behavior verification
   - Warning consistency

3. **Integration Tests** (`tests/integration/configuration-error-handling.test.ts`):
   - End-to-end error handling scenarios
   - Combined error conditions
   - Requirement validation

## Requirements Satisfied

This implementation satisfies **Requirement 7.3**:
> WHEN a parameter is missing from the global configuration THEN the Debate System SHALL use a hardcoded default value

The system:
- ✅ Handles missing configuration files (uses defaults)
- ✅ Handles invalid configuration format (parse errors)
- ✅ Handles missing individual parameters (uses defaults)
- ✅ Displays warnings for configuration issues
