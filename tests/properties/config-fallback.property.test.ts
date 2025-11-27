import * as fc from 'fast-check';
import { ConfigurationManager } from '../../src/utils/ConfigurationManager';
import { DebateConfig, DEFAULT_CONFIG } from '../../src/models/DebateConfig';

describe('Configuration Fallback Properties', () => {
  const configManager = new ConfigurationManager();

  // Feature: ai-debate-system, Property 21: Invalid configuration falls back to defaults
  // Validates: Requirements 10.4
  it('should use default values for invalid parameters and include parameter names in warnings', () => {
    fc.assert(
      fc.property(
        // Generate various invalid configurations
        fc.record({
          timeLimit: fc.oneof(
            fc.constant(undefined),
            fc.integer({ min: 1, max: 1000 }), // valid
            fc.constant(-1), // invalid
            fc.constant(0), // invalid
            fc.constant(Infinity), // invalid
            fc.constant(NaN), // invalid
            fc.constant('not a number' as any) // invalid
          ),
          wordLimit: fc.oneof(
            fc.constant(undefined),
            fc.integer({ min: 1, max: 1000 }), // valid
            fc.constant(-1), // invalid
            fc.constant(0), // invalid
            fc.constant(1.5), // invalid (not integer)
            fc.constant(Infinity), // invalid
            fc.constant('not a number' as any) // invalid
          ),
          strictMode: fc.oneof(
            fc.constant(undefined),
            fc.boolean(), // valid
            fc.constant('true' as any), // invalid
            fc.constant(1 as any) // invalid
          ),
          showPreparation: fc.oneof(
            fc.constant(undefined),
            fc.boolean(), // valid
            fc.constant('false' as any), // invalid
            fc.constant(0 as any) // invalid
          ),
          numCrossExamQuestions: fc.oneof(
            fc.constant(undefined),
            fc.integer({ min: 0, max: 10 }), // valid
            fc.constant(-1), // invalid
            fc.constant(1.5), // invalid (not integer)
            fc.constant(Infinity), // invalid
            fc.constant('not a number' as any) // invalid
          ),
          preparationTime: fc.oneof(
            fc.constant(undefined),
            fc.integer({ min: 1, max: 600 }), // valid
            fc.constant(-1), // invalid
            fc.constant(0), // invalid
            fc.constant(Infinity), // invalid
            fc.constant(NaN), // invalid
            fc.constant('not a number' as any) // invalid
          )
        }),
        (userConfig) => {
          const result = configManager.mergeAndValidate(userConfig);

          // Check each parameter
          for (const key of Object.keys(userConfig) as Array<keyof DebateConfig>) {
            const value = userConfig[key];
            
            if (value === undefined) {
              // Undefined values should use defaults
              expect(result.config[key]).toBe(DEFAULT_CONFIG[key]);
              continue;
            }

            // Determine if this value is invalid
            let isInvalid = false;
            
            if (key === 'timeLimit' || key === 'preparationTime') {
              isInvalid = typeof value !== 'number' || value <= 0 || !isFinite(value);
            } else if (key === 'wordLimit') {
              isInvalid = typeof value !== 'number' || value <= 0 || !isFinite(value) || !Number.isInteger(value);
            } else if (key === 'strictMode' || key === 'showPreparation') {
              isInvalid = typeof value !== 'boolean';
            } else if (key === 'numCrossExamQuestions') {
              isInvalid = typeof value !== 'number' || value < 0 || !isFinite(value) || !Number.isInteger(value);
            }

            if (isInvalid) {
              // Invalid parameter should fall back to default
              expect(result.config[key]).toBe(DEFAULT_CONFIG[key]);
              
              // Invalid parameter should be in the invalidParams list
              expect(result.invalidParams).toContain(key);
              
              // There should be a warning mentioning this parameter
              const hasWarning = result.warnings.some(w => w.includes(key));
              expect(hasWarning).toBe(true);
            } else {
              // Valid parameter should use the provided value
              expect(result.config[key]).toBe(value);
              
              // Valid parameter should NOT be in invalidParams
              expect(result.invalidParams).not.toContain(key);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Empty config should return defaults with no warnings
  it('should return default config with no warnings for empty input', () => {
    const result = configManager.mergeAndValidate({});
    
    expect(result.config).toEqual(DEFAULT_CONFIG);
    expect(result.warnings).toHaveLength(0);
    expect(result.invalidParams).toHaveLength(0);
  });

  // Additional property: All valid config should have no warnings
  it('should have no warnings when all parameters are valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          timeLimit: fc.integer({ min: 1, max: 1000 }),
          wordLimit: fc.integer({ min: 1, max: 1000 }),
          strictMode: fc.boolean(),
          showPreparation: fc.boolean(),
          numCrossExamQuestions: fc.integer({ min: 0, max: 10 }),
          preparationTime: fc.integer({ min: 1, max: 600 })
        }),
        (validConfig) => {
          const result = configManager.mergeAndValidate(validConfig);
          
          // No warnings for valid config
          expect(result.warnings).toHaveLength(0);
          expect(result.invalidParams).toHaveLength(0);
          
          // Config should match input
          expect(result.config).toEqual(validConfig);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property: Partial valid config should merge with defaults
  it('should merge partial valid config with defaults', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ timeLimit: fc.integer({ min: 1, max: 1000 }) }),
          fc.record({ wordLimit: fc.integer({ min: 1, max: 1000 }) }),
          fc.record({ strictMode: fc.boolean() }),
          fc.record({ showPreparation: fc.boolean() }),
          fc.record({ numCrossExamQuestions: fc.integer({ min: 0, max: 10 }) }),
          fc.record({ preparationTime: fc.integer({ min: 1, max: 600 }) })
        ),
        (partialConfig) => {
          const result = configManager.mergeAndValidate(partialConfig);
          
          // Should have no warnings for valid partial config
          expect(result.warnings).toHaveLength(0);
          expect(result.invalidParams).toHaveLength(0);
          
          // Specified values should be used
          for (const key of Object.keys(partialConfig) as Array<keyof DebateConfig>) {
            const partialValue = (partialConfig as any)[key];
            expect(result.config[key]).toBe(partialValue);
          }
          
          // Unspecified values should use defaults
          for (const key of Object.keys(DEFAULT_CONFIG) as Array<keyof DebateConfig>) {
            if (!(key in partialConfig)) {
              expect(result.config[key]).toBe(DEFAULT_CONFIG[key]);
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
