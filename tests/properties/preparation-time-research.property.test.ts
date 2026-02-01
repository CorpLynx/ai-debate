import * as fc from 'fast-check';
import { calculateEffectivePreparationTime, DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import { PromptBuilder } from '../../src/prompts/PromptBuilder';

describe('Research Depth Preparation Time Properties', () => {
  // **Feature: ai-debate-advanced, Property 19: Research depth affects prompt and preparation time**
  // **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  describe('Property 19: Research depth affects prompt and preparation time', () => {
    // Arbitrary for research depth values (0-10)
    const researchDepthArb = fc.integer({ min: 0, max: 10 });
    const baseTimeArb = fc.integer({ min: 60, max: 600 }); // 1-10 minutes

    it('should increase preparation time for high research depth (8-10)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 10 }), // High research depth
          baseTimeArb,
          (researchDepth, baseTime) => {
            const adjustedTime = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            
            // High research depth should increase time (1.5x base)
            return adjustedTime > baseTime;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should decrease preparation time for low research depth (0-2)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 }), // Low research depth
          baseTimeArb,
          (researchDepth, baseTime) => {
            const adjustedTime = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            
            // Low research depth should decrease time (0.8x base)
            return adjustedTime < baseTime;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain base preparation time for moderate research depth (3-7)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 7 }), // Moderate research depth
          baseTimeArb,
          (researchDepth, baseTime) => {
            const adjustedTime = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            
            // Moderate research depth should maintain base time
            return adjustedTime === baseTime;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return positive preparation time', () => {
      fc.assert(
        fc.property(
          researchDepthArb,
          baseTimeArb,
          (researchDepth, baseTime) => {
            const adjustedTime = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            
            return adjustedTime > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return finite preparation time', () => {
      fc.assert(
        fc.property(
          researchDepthArb,
          baseTimeArb,
          (researchDepth, baseTime) => {
            const adjustedTime = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            
            return isFinite(adjustedTime);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should scale preparation time proportionally to research depth', () => {
      fc.assert(
        fc.property(
          baseTimeArb,
          (baseTime) => {
            const lowTime = PromptBuilder.calculatePreparationTime(baseTime, 1);
            const moderateTime = PromptBuilder.calculatePreparationTime(baseTime, 5);
            const highTime = PromptBuilder.calculatePreparationTime(baseTime, 9);
            
            // Low < Moderate < High
            return lowTime < moderateTime && moderateTime < highTime;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use maximum time when debaters have different research depths', () => {
      fc.assert(
        fc.property(
          researchDepthArb,
          researchDepthArb,
          (affirmativeDepth, negativeDepth) => {
            const config = { ...DEFAULT_CONFIG, preparationTime: 180 };
            const effectiveTime = calculateEffectivePreparationTime(
              config,
              affirmativeDepth,
              negativeDepth
            );
            
            const affirmativeTime = PromptBuilder.calculatePreparationTime(180, affirmativeDepth);
            const negativeTime = PromptBuilder.calculatePreparationTime(180, negativeDepth);
            const expectedMax = Math.max(affirmativeTime, negativeTime);
            
            return effectiveTime === expectedMax;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of both debaters with same research depth', () => {
      fc.assert(
        fc.property(
          researchDepthArb,
          (researchDepth) => {
            const config = { ...DEFAULT_CONFIG, preparationTime: 180 };
            const effectiveTime = calculateEffectivePreparationTime(
              config,
              researchDepth,
              researchDepth
            );
            
            const expectedTime = PromptBuilder.calculatePreparationTime(180, researchDepth);
            
            return effectiveTime === expectedTime;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include research instructions in prompt for high research depth', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 10 }), // High research depth
          (researchDepth) => {
            const promptBuilder = new PromptBuilder();
            const instructions = promptBuilder.getResearchInstructions(researchDepth);
            
            // High research should mention citations, sources, data, evidence
            const hasResearchKeywords = 
              instructions.toLowerCase().includes('cite') ||
              instructions.toLowerCase().includes('source') ||
              instructions.toLowerCase().includes('data') ||
              instructions.toLowerCase().includes('evidence');
            
            return hasResearchKeywords && instructions.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include different instructions for low research depth', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 }), // Low research depth
          (researchDepth) => {
            const promptBuilder = new PromptBuilder();
            const instructions = promptBuilder.getResearchInstructions(researchDepth);
            
            // Low research should mention general claims, common knowledge
            const hasLowResearchKeywords = 
              instructions.toLowerCase().includes('general') ||
              instructions.toLowerCase().includes('common');
            
            return hasLowResearchKeywords && instructions.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return integer preparation times (no fractional seconds)', () => {
      fc.assert(
        fc.property(
          researchDepthArb,
          baseTimeArb,
          (researchDepth, baseTime) => {
            const adjustedTime = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            
            return Number.isInteger(adjustedTime);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be deterministic (same inputs produce same outputs)', () => {
      fc.assert(
        fc.property(
          researchDepthArb,
          baseTimeArb,
          (researchDepth, baseTime) => {
            const time1 = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            const time2 = PromptBuilder.calculatePreparationTime(baseTime, researchDepth);
            
            return time1 === time2;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle boundary values correctly', () => {
      const baseTime = 180;
      
      // Test exact boundaries
      const depth0 = PromptBuilder.calculatePreparationTime(baseTime, 0);
      const depth2 = PromptBuilder.calculatePreparationTime(baseTime, 2);
      const depth3 = PromptBuilder.calculatePreparationTime(baseTime, 3);
      const depth7 = PromptBuilder.calculatePreparationTime(baseTime, 7);
      const depth8 = PromptBuilder.calculatePreparationTime(baseTime, 8);
      const depth10 = PromptBuilder.calculatePreparationTime(baseTime, 10);
      
      // Low range (0-2) should be less than base
      expect(depth0).toBeLessThan(baseTime);
      expect(depth2).toBeLessThan(baseTime);
      
      // Moderate range (3-7) should equal base
      expect(depth3).toBe(baseTime);
      expect(depth7).toBe(baseTime);
      
      // High range (8-10) should be greater than base
      expect(depth8).toBeGreaterThan(baseTime);
      expect(depth10).toBeGreaterThan(baseTime);
    });

    it('should use default preparation time when not specified in config', () => {
      const config = { ...DEFAULT_CONFIG };
      delete config.preparationTime;
      
      const effectiveTime = calculateEffectivePreparationTime(config, 5, 5);
      
      // Should use DEFAULT_CONFIG.preparationTime (180 seconds)
      expect(effectiveTime).toBe(180);
    });
  });
});
