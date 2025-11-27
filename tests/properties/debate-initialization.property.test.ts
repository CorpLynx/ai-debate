import * as fc from 'fast-check';
import { DebateOrchestratorImpl } from '../../src/orchestrator/DebateOrchestrator';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';

describe('Debate Initialization Property Tests', () => {
  const orchestrator = new DebateOrchestratorImpl();

  // Feature: ai-debate-system, Property 2: Topic storage round-trip
  // Validates: Requirements 1.2
  describe('Property 2: Topic storage round-trip', () => {
    it('should preserve the exact topic string when storing and retrieving from debate session', () => {
      fc.assert(
        fc.property(
          // Generate valid topics (non-empty, contains at least one non-whitespace character)
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            // Create mock AI providers
            const affirmativeModel = new MockAIProvider('Model_A');
            const negativeModel = new MockAIProvider('Model_B');
            
            // Initialize debate with the topic
            const debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            // Retrieve the topic from the debate session
            const retrievedTopic = debate.topic;
            
            // The retrieved topic must be exactly the same as the original
            expect(retrievedTopic).toBe(topic);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve topic with special characters and whitespace', () => {
      fc.assert(
        fc.property(
          // Generate topics with various special characters and whitespace patterns
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (topic) => {
            const affirmativeModel = new MockAIProvider('Model_A');
            const negativeModel = new MockAIProvider('Model_B');
            
            const debate = orchestrator.initializeDebate(
              topic,
              DEFAULT_CONFIG,
              affirmativeModel,
              negativeModel
            );
            
            // Topic should be preserved exactly, including leading/trailing whitespace
            expect(debate.topic).toBe(topic);
            expect(debate.topic.length).toBe(topic.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
