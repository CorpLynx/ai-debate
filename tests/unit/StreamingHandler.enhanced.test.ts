import { StreamingHandler } from '../../src/streaming/StreamingHandler';
import { Position } from '../../src/models/Position';
import { UIConfig } from '../../src/models/UIConfig';

describe('StreamingHandler Enhanced Features', () => {
  let originalStdoutWrite: typeof process.stdout.write;
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;
  let outputBuffer: string[] = [];

  beforeEach(() => {
    outputBuffer = [];
    
    // Capture stdout
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = ((chunk: any) => {
      outputBuffer.push(chunk.toString());
      return true;
    }) as any;

    // Capture console methods
    originalConsoleLog = console.log;
    console.log = jest.fn((...args) => {
      outputBuffer.push(args.join(' ') + '\n');
    });

    originalConsoleWarn = console.warn;
    console.warn = jest.fn((...args) => {
      outputBuffer.push(args.join(' ') + '\n');
    });

    originalConsoleError = console.error;
    console.error = jest.fn((...args) => {
      outputBuffer.push(args.join(' ') + '\n');
    });
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('Concurrent Stream Labeling (Requirement 8.2)', () => {
    it('should display clear labels for concurrent streams', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Display stream label
      handler.displayStreamLabel('Model-A', Position.AFFIRMATIVE);
      
      const output = outputBuffer.join('');
      
      // Should contain position label
      expect(output).toContain('AFFIRMATIVE');
      // Should contain model name
      expect(output).toContain('Model-A');
      // Should have visual separator
      expect(output).toMatch(/[┌─]/);
    });

    it('should display stream end markers', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Display stream end
      handler.displayStreamEnd('Model-B', Position.NEGATIVE);
      
      const output = outputBuffer.join('');
      
      // Should contain position label
      expect(output).toContain('NEGATIVE');
      // Should contain model name
      expect(output).toContain('Model-B');
      // Should have completion indicator
      expect(output).toContain('✓');
      // Should have visual separator
      expect(output).toMatch(/[└─]/);
    });
  });

  describe('Stream Completion Indicator (Requirement 8.3)', () => {
    it('should add completion indicator when stream completes', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Complete a stream
      handler.onComplete('Model-A', Position.AFFIRMATIVE);
      
      const output = outputBuffer.join('');
      
      // Should contain completion indicator
      expect(output).toContain('✓');
      // Should contain completion message
      expect(output).toContain('complete');
    });
  });

  describe('Interruption Feedback (Requirement 8.4)', () => {
    it('should display clear feedback on stream interruption', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Trigger interruption
      handler.onInterruption('Model-A', Position.AFFIRMATIVE, 'Network timeout', 'Partial content here');
      
      const output = outputBuffer.join('');
      
      // Should contain interruption indicator
      expect(output).toContain('interrupted');
      // Should contain warning symbol
      expect(output).toContain('⚠');
      // Should contain reason
      expect(output).toContain('Network timeout');
      // Should contain partial content info
      expect(output).toContain('Partial content received');
    });

    it('should display timeout with interruption indicator', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Trigger timeout
      handler.onTimeout('Model-B', Position.NEGATIVE, 'Some partial content');
      
      const output = outputBuffer.join('');
      
      // Should contain timeout indicator
      expect(output).toContain('⏱');
      // Should contain time limit message
      expect(output).toContain('time limit');
    });

    it('should display error with interruption indicator', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Trigger error
      handler.onError(new Error('Test error'), 'Model-A', Position.AFFIRMATIVE, 'Partial content');
      
      const output = outputBuffer.join('');
      
      // Should contain interruption indicator
      expect(output).toContain('interrupted');
      // Should contain error symbol
      expect(output).toContain('✗');
      // Should contain error message
      expect(output).toContain('Test error');
    });

    it('should display retry with visual feedback', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Trigger retry
      handler.onRetry('Model-A', Position.AFFIRMATIVE, 2);
      
      const output = outputBuffer.join('');
      
      // Should contain retry indicator
      expect(output).toContain('↻');
      // Should contain attempt number
      expect(output).toContain('Attempt 2');
    });
  });

  describe('Preparation Format Distinction (Requirement 8.5)', () => {
    it('should format preparation materials distinctly', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Format preparation content
      const content = 'Line 1\nLine 2\nLine 3';
      const formatted = handler.formatPreparationContent(content, 'Model-A', Position.AFFIRMATIVE);
      
      // Should contain PREPARATION label
      expect(formatted).toContain('PREPARATION');
      // Should contain model name
      expect(formatted).toContain('Model-A');
      // Should contain position
      expect(formatted).toContain('AFFIRMATIVE');
      // Should have box drawing characters
      expect(formatted).toMatch(/[┌└─│]/);
      // Should contain the content
      expect(formatted).toContain('Line 1');
      expect(formatted).toContain('Line 2');
      expect(formatted).toContain('Line 3');
    });

    it('should display preparation header with distinct formatting', () => {
      const config: UIConfig = {
        enableRichFormatting: true,
        enableAnimations: true,
        enableColors: true,
        colorScheme: 'default',
        showPreparationProgress: false,
        enableHyperlinks: true
      };

      const handler = new StreamingHandler(config);
      
      // Display preparation header
      handler.displayPreparationHeader('Model-A', Position.AFFIRMATIVE);
      
      const output = outputBuffer.join('');
      
      // Should contain model name
      expect(output).toContain('Model-A');
      // Should contain position
      expect(output).toContain('AFFIRMATIVE');
      // Should have separator lines
      expect(output).toContain('─');
      // Should contain research message
      expect(output).toContain('Researching');
    });
  });
});
