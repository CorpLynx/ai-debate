import * as fc from 'fast-check';
import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateContext } from '../../src/models/DebateContext';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

describe('Streaming Display Properties', () => {
  // Feature: interactive-mode, Property 14: Streaming displays content incrementally
  // Validates: Requirements 6.2
  it('should display content incrementally as chunks arrive rather than waiting for completion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          response: fc.string({ minLength: 20, maxLength: 200 }).filter(s => {
            // Filter for responses that have at least 2 words (will produce multiple chunks)
            const words = s.trim().split(/\s+/).filter(w => w.length > 0);
            return words.length >= 2;
          }),
          position: fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          roundType: fc.constantFrom(
            RoundType.PREPARATION,
            RoundType.OPENING,
            RoundType.REBUTTAL,
            RoundType.CLOSING
          ),
          topic: fc.string({ minLength: 10, maxLength: 100 })
        }),
        async (testCase) => {
          // Create a mock provider with the test response
          const provider = new MockAIProvider('TestModel', {
            defaultResponse: testCase.response,
            delayMs: 10 // Small delay to simulate streaming
          });

          // Create debate context
          const context: DebateContext = {
            topic: testCase.topic,
            position: testCase.position,
            roundType: testCase.roundType,
            previousStatements: [],
            preparationMaterial: undefined
          };

          // Track chunks as they arrive
          const chunks: string[] = [];
          const chunkTimestamps: number[] = [];
          let completionTime: number | null = null;

          const onChunk = (chunk: string) => {
            chunks.push(chunk);
            chunkTimestamps.push(Date.now());
          };

          const startTime = Date.now();

          // Generate streaming response
          const fullResponse = await provider.generateResponseStream(
            'Test prompt',
            context,
            onChunk
          );

          completionTime = Date.now();

          // Property 1: Chunks should be received incrementally (multiple chunks)
          expect(chunks.length).toBeGreaterThan(1);

          // Property 2: Each chunk should be non-empty
          for (const chunk of chunks) {
            expect(chunk.length).toBeGreaterThan(0);
          }

          // Property 3: Concatenating all chunks should equal the full response
          const reconstructed = chunks.join('');
          expect(reconstructed).toBe(fullResponse);

          // Property 4: Chunks should arrive over time (not all at once)
          // At least some chunks should have different timestamps
          const uniqueTimestamps = new Set(chunkTimestamps);
          expect(uniqueTimestamps.size).toBeGreaterThan(1);

          // Property 5: First chunk should arrive before completion
          expect(chunkTimestamps[0]).toBeLessThan(completionTime);

          // Property 6: Chunks should arrive in order (timestamps should be non-decreasing)
          for (let i = 1; i < chunkTimestamps.length; i++) {
            expect(chunkTimestamps[i]).toBeGreaterThanOrEqual(chunkTimestamps[i - 1]);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Streaming should work with empty responses
  it('should handle empty responses gracefully', async () => {
    const provider = new MockAIProvider('TestModel');
    // Set an empty response for this specific prompt
    provider.setResponse('Test prompt', '');

    const context: DebateContext = {
      topic: 'Test topic',
      position: Position.AFFIRMATIVE,
      roundType: RoundType.PREPARATION,
      previousStatements: [],
      preparationMaterial: undefined
    };

    const chunks: string[] = [];
    const onChunk = (chunk: string) => {
      chunks.push(chunk);
    };

    const fullResponse = await provider.generateResponseStream(
      'Test prompt',
      context,
      onChunk
    );

    // Empty response should result in empty full response
    expect(fullResponse).toBe('');
    // No chunks should be emitted for empty responses
    expect(chunks.length).toBe(0);
  });

  // Additional test: Streaming should handle single-word responses
  it('should handle single-word responses', async () => {
    const provider = new MockAIProvider('TestModel', {
      defaultResponse: 'Hello'
    });

    const context: DebateContext = {
      topic: 'Test topic',
      position: Position.AFFIRMATIVE,
      roundType: RoundType.PREPARATION,
      previousStatements: [],
      preparationMaterial: undefined
    };

    const chunks: string[] = [];
    const onChunk = (chunk: string) => {
      chunks.push(chunk);
    };

    const fullResponse = await provider.generateResponseStream(
      'Test prompt',
      context,
      onChunk
    );

    // Should receive at least one chunk
    expect(chunks.length).toBeGreaterThan(0);
    
    // Concatenated chunks should equal full response
    expect(chunks.join('')).toBe(fullResponse);
    expect(fullResponse).toBe('Hello');
  });

  // Additional test: Streaming should preserve content integrity
  it('should preserve content integrity across all chunk sizes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
        async (response) => {
          const provider = new MockAIProvider('TestModel', {
            defaultResponse: response
          });

          const context: DebateContext = {
            topic: 'Test topic',
            position: Position.AFFIRMATIVE,
            roundType: RoundType.PREPARATION,
            previousStatements: [],
            preparationMaterial: undefined
          };

          const chunks: string[] = [];
          const onChunk = (chunk: string) => {
            chunks.push(chunk);
          };

          const fullResponse = await provider.generateResponseStream(
            'Test prompt',
            context,
            onChunk
          );

          // Verify content integrity - response should be preserved exactly
          expect(chunks.join('')).toBe(fullResponse);
          expect(fullResponse).toBe(response);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Callback should be called for each chunk
  it('should call the callback function for each chunk', async () => {
    const provider = new MockAIProvider('TestModel', {
      defaultResponse: 'This is a test response with multiple words'
    });

    const context: DebateContext = {
      topic: 'Test topic',
      position: Position.AFFIRMATIVE,
      roundType: RoundType.PREPARATION,
      previousStatements: [],
      preparationMaterial: undefined
    };

    let callbackCount = 0;
    const onChunk = (chunk: string) => {
      callbackCount++;
      expect(typeof chunk).toBe('string');
      expect(chunk.length).toBeGreaterThan(0);
    };

    await provider.generateResponseStream(
      'Test prompt',
      context,
      onChunk
    );

    // Callback should have been called multiple times
    expect(callbackCount).toBeGreaterThan(1);
  });

  // Additional test: Streaming should support different providers
  it('should work consistently across different provider configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          modelName: fc.string({ minLength: 1, maxLength: 20 }),
          response: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
          delayMs: fc.integer({ min: 0, max: 50 })
        }),
        async (config) => {
          const provider = new MockAIProvider(config.modelName, {
            defaultResponse: config.response,
            delayMs: config.delayMs
          });

          const context: DebateContext = {
            topic: 'Test topic',
            position: Position.AFFIRMATIVE,
            roundType: RoundType.PREPARATION,
            previousStatements: [],
            preparationMaterial: undefined
          };

          const chunks: string[] = [];
          const onChunk = (chunk: string) => {
            chunks.push(chunk);
          };

          const fullResponse = await provider.generateResponseStream(
            'Test prompt',
            context,
            onChunk
          );

          // Verify streaming worked correctly
          expect(chunks.length).toBeGreaterThan(0);
          expect(chunks.join('')).toBe(fullResponse);
          expect(fullResponse).toBe(config.response);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: supportsStreaming should return true for providers with streaming
  it('should indicate streaming support correctly', () => {
    const provider = new MockAIProvider('TestModel');
    expect(provider.supportsStreaming()).toBe(true);
  });
});
