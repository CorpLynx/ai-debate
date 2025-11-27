import * as fc from 'fast-check';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { selectModels, assignPositions, selectAndAssignModels } from '../../src/utils/ModelSelection';
import { AIModelProvider } from '../../src/providers/AIModelProvider';

describe('Model Selection Property Tests', () => {
  // Feature: ai-debate-system, Property 3: Model selection produces distinct models
  // Validates: Requirements 2.1
  describe('Property 3: Model selection produces distinct models', () => {
    it('should always select two distinct models from available providers', () => {
      fc.assert(
        fc.property(
          // Generate an array of at least 2 models with unique names
          fc.integer({ min: 2, max: 10 }).chain(count =>
            fc.tuple(
              ...Array.from({ length: count }, (_, i) =>
                fc.record({
                  name: fc.constant(`Model_${i}`),
                  defaultResponse: fc.string()
                })
              )
            ).map(configs =>
              configs.map(config => new MockAIProvider(config.name, { defaultResponse: config.defaultResponse }))
            )
          ),
          (availableModels: AIModelProvider[]) => {
            const [model1, model2] = selectModels(availableModels);
            
            // The two selected models must be distinct (different instances)
            expect(model1).not.toBe(model2);
            
            // The two selected models must have different names
            expect(model1.getModelName()).not.toBe(model2.getModelName());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw an error when fewer than 2 models are available', () => {
      fc.assert(
        fc.property(
          // Generate 0 or 1 models
          fc.integer({ min: 0, max: 1 }).chain(count =>
            fc.tuple(
              ...Array.from({ length: count }, (_, i) =>
                fc.record({
                  name: fc.constant(`Model_${i}`)
                })
              )
            ).map(configs =>
              configs.map(config => new MockAIProvider(config.name))
            )
          ),
          (availableModels: AIModelProvider[]) => {
            expect(() => selectModels(availableModels)).toThrow(/Insufficient models available/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: ai-debate-system, Property 4: Position assignment is complete and exclusive
  // Validates: Requirements 2.2
  describe('Property 4: Position assignment is complete and exclusive', () => {
    it('should assign exactly one model to affirmative and one to negative', () => {
      fc.assert(
        fc.property(
          // Generate two models with distinct names
          fc.record({
            name1: fc.string({ minLength: 1 }).map(s => `Model1_${s}`),
            name2: fc.string({ minLength: 1 }).map(s => `Model2_${s}`),
            response1: fc.string(),
            response2: fc.string()
          }),
          ({ name1, name2, response1, response2 }) => {
            const model1 = new MockAIProvider(name1, { defaultResponse: response1 });
            const model2 = new MockAIProvider(name2, { defaultResponse: response2 });
            
            const assignment = assignPositions(model1, model2);
            
            // Both positions must be assigned
            expect(assignment.affirmativeModel).toBeDefined();
            expect(assignment.negativeModel).toBeDefined();
            
            // The two assigned models must be distinct
            expect(assignment.affirmativeModel).not.toBe(assignment.negativeModel);
            expect(assignment.affirmativeModel.getModelName()).not.toBe(assignment.negativeModel.getModelName());
            
            // Each input model must be assigned to exactly one position
            const affirmativeName = assignment.affirmativeModel.getModelName();
            const negativeName = assignment.negativeModel.getModelName();
            
            // Both models must be one of the input models
            expect([name1, name2]).toContain(affirmativeName);
            expect([name1, name2]).toContain(negativeName);
            
            // No model should be assigned to both positions
            expect(affirmativeName).not.toBe(negativeName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should assign each input model to exactly one position', () => {
      fc.assert(
        fc.property(
          fc.record({
            name1: fc.string({ minLength: 1 }).map(s => `ModelA_${s}`),
            name2: fc.string({ minLength: 1 }).map(s => `ModelB_${s}`)
          }),
          ({ name1, name2 }) => {
            const model1 = new MockAIProvider(name1);
            const model2 = new MockAIProvider(name2);
            
            const assignment = assignPositions(model1, model2);
            
            const affirmativeName = assignment.affirmativeModel.getModelName();
            const negativeName = assignment.negativeModel.getModelName();
            
            // The set of assigned models should equal the set of input models
            const inputNames = new Set([name1, name2]);
            const assignedNames = new Set([affirmativeName, negativeName]);
            
            expect(assignedNames).toEqual(inputNames);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
