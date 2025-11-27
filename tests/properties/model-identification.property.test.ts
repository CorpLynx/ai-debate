import * as fc from 'fast-check';
import { StreamingHandler } from '../../src/streaming/StreamingHandler';
import { Position } from '../../src/models/Position';

describe('Model Identification Properties', () => {
  // Feature: interactive-mode, Property 15: Preparation output includes model identification
  // Validates: Requirements 6.4
  it('should include model identification in all preparation output', () => {
    fc.assert(
      fc.property(
        fc.record({
          modelName: fc.string({ minLength: 1, maxLength: 50 }),
          position: fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          chunk: fc.string({ minLength: 1, maxLength: 200 })
        }),
        (testCase) => {
          const handler = new StreamingHandler();
          
          // Capture stdout to verify output
          let capturedOutput = '';
          const originalWrite = process.stdout.write;
          process.stdout.write = ((str: string) => {
            capturedOutput += str;
            return true;
          }) as any;

          // Capture console.log to verify header output
          let capturedLog = '';
          const originalLog = console.log;
          console.log = ((...args: any[]) => {
            capturedLog += args.join(' ') + '\n';
          }) as any;

          try {
            // Display preparation header (should include model identification)
            handler.displayPreparationHeader(testCase.modelName, testCase.position);
            
            // Display chunk
            handler.onChunk(testCase.chunk, testCase.modelName, testCase.position);
            
            // Display completion (should include model identification)
            handler.onComplete(testCase.modelName, testCase.position);

            // Property 1: Header output should include the model name
            expect(capturedLog).toContain(testCase.modelName);

            // Property 2: Header output should include the position label
            const positionLabel = testCase.position === Position.AFFIRMATIVE 
              ? 'AFFIRMATIVE' 
              : 'NEGATIVE';
            expect(capturedLog).toContain(positionLabel);

            // Property 3: Completion output should include the model name
            expect(capturedLog).toContain(testCase.modelName);

            // Property 4: Completion output should include the position label
            expect(capturedLog).toContain(positionLabel);

            // Property 5: The chunk content should be displayed
            expect(capturedOutput).toContain(testCase.chunk);

            return true;
          } finally {
            // Restore original functions
            process.stdout.write = originalWrite;
            console.log = originalLog;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Error output should include model identification
  it('should include model identification in error output', () => {
    fc.assert(
      fc.property(
        fc.record({
          modelName: fc.string({ minLength: 1, maxLength: 50 }),
          position: fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          errorMessage: fc.string({ minLength: 1, maxLength: 100 })
        }),
        (testCase) => {
          const handler = new StreamingHandler();
          
          // Capture console.error to verify error output
          let capturedError = '';
          const originalError = console.error;
          console.error = ((...args: any[]) => {
            capturedError += args.join(' ') + '\n';
          }) as any;

          try {
            const error = new Error(testCase.errorMessage);
            handler.onError(error, testCase.modelName, testCase.position);

            // Property 1: Error output should include the model name
            expect(capturedError).toContain(testCase.modelName);

            // Property 2: Error output should include the position label
            const positionLabel = testCase.position === Position.AFFIRMATIVE 
              ? 'AFFIRMATIVE' 
              : 'NEGATIVE';
            expect(capturedError).toContain(positionLabel);

            // Property 3: Error output should include the error message
            expect(capturedError).toContain(testCase.errorMessage);

            // Property 4: Error output should include an error indicator
            expect(capturedError).toContain('ERROR');

            return true;
          } finally {
            // Restore original function
            console.error = originalError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Model identification should be consistent across all output types
  it('should use consistent model identification format across all output types', () => {
    fc.assert(
      fc.property(
        fc.record({
          modelName: fc.string({ minLength: 1, maxLength: 50 }),
          position: fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE)
        }),
        (testCase) => {
          const handler = new StreamingHandler();
          
          // Capture all output
          let capturedLog = '';
          let capturedError = '';
          
          const originalLog = console.log;
          const originalError = console.error;
          
          console.log = ((...args: any[]) => {
            capturedLog += args.join(' ') + '\n';
          }) as any;
          
          console.error = ((...args: any[]) => {
            capturedError += args.join(' ') + '\n';
          }) as any;

          try {
            // Display header
            handler.displayPreparationHeader(testCase.modelName, testCase.position);
            
            // Display completion
            handler.onComplete(testCase.modelName, testCase.position);
            
            // Display error
            handler.onError(new Error('Test error'), testCase.modelName, testCase.position);

            const positionLabel = testCase.position === Position.AFFIRMATIVE 
              ? 'AFFIRMATIVE' 
              : 'NEGATIVE';

            // Property: All outputs should include both position and model name
            expect(capturedLog).toContain(positionLabel);
            expect(capturedLog).toContain(testCase.modelName);
            expect(capturedError).toContain(positionLabel);
            expect(capturedError).toContain(testCase.modelName);

            return true;
          } finally {
            // Restore original functions
            console.log = originalLog;
            console.error = originalError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Different positions should be visually distinguishable
  it('should make different positions visually distinguishable in output', () => {
    const handler = new StreamingHandler();
    
    // Capture output for both positions
    const outputs: { [key: string]: string } = {
      [Position.AFFIRMATIVE]: '',
      [Position.NEGATIVE]: ''
    };
    
    const originalLog = console.log;
    
    for (const position of [Position.AFFIRMATIVE, Position.NEGATIVE]) {
      console.log = ((...args: any[]) => {
        outputs[position] += args.join(' ') + '\n';
      }) as any;
      
      handler.displayPreparationHeader('TestModel', position);
      
      console.log = originalLog;
    }

    // Property 1: Both outputs should contain the model name
    expect(outputs[Position.AFFIRMATIVE]).toContain('TestModel');
    expect(outputs[Position.NEGATIVE]).toContain('TestModel');

    // Property 2: Outputs should contain different position labels
    expect(outputs[Position.AFFIRMATIVE]).toContain('AFFIRMATIVE');
    expect(outputs[Position.NEGATIVE]).toContain('NEGATIVE');

    // Property 3: Outputs should be different (due to different colors/labels)
    expect(outputs[Position.AFFIRMATIVE]).not.toBe(outputs[Position.NEGATIVE]);
  });

  // Additional test: Chunk display should not interfere with model identification
  it('should maintain model identification context when displaying chunks', () => {
    fc.assert(
      fc.property(
        fc.record({
          modelName: fc.string({ minLength: 1, maxLength: 50 }),
          position: fc.constantFrom(Position.AFFIRMATIVE, Position.NEGATIVE),
          chunks: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 })
        }),
        (testCase) => {
          const handler = new StreamingHandler();
          
          let capturedOutput = '';
          let capturedLog = '';
          
          const originalWrite = process.stdout.write;
          const originalLog = console.log;
          
          process.stdout.write = ((str: string) => {
            capturedOutput += str;
            return true;
          }) as any;
          
          console.log = ((...args: any[]) => {
            capturedLog += args.join(' ') + '\n';
          }) as any;

          try {
            // Display header with model identification
            handler.displayPreparationHeader(testCase.modelName, testCase.position);
            
            // Display multiple chunks
            for (const chunk of testCase.chunks) {
              handler.onChunk(chunk, testCase.modelName, testCase.position);
            }
            
            // Display completion with model identification
            handler.onComplete(testCase.modelName, testCase.position);

            // Property 1: All chunks should be present in output
            for (const chunk of testCase.chunks) {
              expect(capturedOutput).toContain(chunk);
            }

            // Property 2: Model identification should be present in header and completion
            const positionLabel = testCase.position === Position.AFFIRMATIVE 
              ? 'AFFIRMATIVE' 
              : 'NEGATIVE';
            
            expect(capturedLog).toContain(testCase.modelName);
            expect(capturedLog).toContain(positionLabel);

            return true;
          } finally {
            // Restore original functions
            process.stdout.write = originalWrite;
            console.log = originalLog;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
