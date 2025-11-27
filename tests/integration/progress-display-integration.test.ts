import { StreamingHandler } from '../../src/streaming/StreamingHandler';
import { Position } from '../../src/models/Position';
import { UIConfig } from '../../src/models/UIConfig';

describe('Progress Display Integration', () => {
  let originalStdoutWrite: typeof process.stdout.write;
  let outputBuffer: string[] = [];
  let handlers: StreamingHandler[] = [];

  beforeEach(() => {
    outputBuffer = [];
    originalStdoutWrite = process.stdout.write;
    // Capture stdout
    process.stdout.write = ((chunk: any) => {
      outputBuffer.push(chunk.toString());
      return true;
    }) as any;
  });

  afterEach(() => {
    // Cleanup all handlers
    handlers.forEach(h => h.cleanup());
    handlers = [];
    process.stdout.write = originalStdoutWrite;
  });

  describe('Progress Bar Mode', () => {
    it('should initialize progress bars for both models', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: true,
        enableHyperlinks: false
      };

      const handler = new StreamingHandler(config);
      handlers.push(handler);
      handler.displayPhaseHeader();
      handler.initializePreparationProgress('Model-A', 'Model-B');

      // Should have created progress bars
      const output = outputBuffer.join('');
      expect(output).toContain('Preparation Phase');
    });

    it('should update progress on chunk received', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: true,
        enableHyperlinks: false
      };

      const handler = new StreamingHandler(config);
      handlers.push(handler);
      handler.initializePreparationProgress('Model-A', 'Model-B');

      // Simulate receiving chunks
      handler.onChunk('test chunk 1', 'Model-A', Position.AFFIRMATIVE);
      handler.onChunk('test chunk 2', 'Model-A', Position.AFFIRMATIVE);

      // Progress should be updated (not displaying raw chunks)
      const output = outputBuffer.join('');
      expect(output).not.toContain('test chunk 1');
      expect(output).not.toContain('test chunk 2');
    });

    it('should complete progress bars and display summary', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: true,
        enableHyperlinks: false
      };

      const handler = new StreamingHandler(config);
      handlers.push(handler);
      handler.initializePreparationProgress('Model-A', 'Model-B');

      // Complete both models
      handler.onComplete('Model-A', Position.AFFIRMATIVE);
      handler.onComplete('Model-B', Position.NEGATIVE);

      // Display summary
      handler.displayCompletionSummary();

      const output = outputBuffer.join('');
      expect(output).toContain('Preparation Complete');
    });

    it('should cleanup resources', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: true,
        enableHyperlinks: false
      };

      const handler = new StreamingHandler(config);
      handlers.push(handler);
      handler.initializePreparationProgress('Model-A', 'Model-B');

      // Should not throw
      expect(() => handler.cleanup()).not.toThrow();
    });
  });

  describe('Raw Output Mode', () => {
    it('should display raw chunks when progress bars disabled', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: false
      };

      const handler = new StreamingHandler(config);
      handler.displayPhaseHeader();

      // Simulate receiving chunks
      handler.onChunk('test chunk 1', 'Model-A', Position.AFFIRMATIVE);
      handler.onChunk('test chunk 2', 'Model-A', Position.AFFIRMATIVE);

      // Should display raw chunks
      const output = outputBuffer.join('');
      expect(output).toContain('test chunk 1');
      expect(output).toContain('test chunk 2');
    });

    it('should display preparation headers in raw mode', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: false
      };

      const handler = new StreamingHandler(config);
      handler.displayPreparationHeader('Model-A', Position.AFFIRMATIVE);

      const output = outputBuffer.join('');
      expect(output).toContain('AFFIRMATIVE');
      expect(output).toContain('Model-A');
      expect(output).toContain('Researching topic');
    });

    it('should display completion messages in raw mode', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: false
      };

      const handler = new StreamingHandler(config);
      handler.onComplete('Model-A', Position.AFFIRMATIVE);

      const output = outputBuffer.join('');
      expect(output).toContain('Preparation complete');
    });
  });
});
