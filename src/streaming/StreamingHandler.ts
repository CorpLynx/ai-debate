import { Position } from '../models/Position';
import { ProgressDisplay } from '../utils/ProgressDisplay';
import { ProgressBar } from '../models/ProgressBar';
import { UIConfig, DEFAULT_UI_CONFIG } from '../models/UIConfig';
import { ColorScheme, DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../models/ColorScheme';
import { ElementType, getColorForElement } from '../utils/ColorSchemeValidator';

/**
 * Handles streaming output from AI models during preparation phase.
 * Provides real-time display of content as it's generated with model identification.
 * Supports both raw output and animated progress bars based on configuration.
 * 
 * Requirements:
 * - 9.1: Use colors from a consistent palette
 * - 9.4: Use muted colors for metadata and secondary information
 */
export class StreamingHandler {
  private colorScheme: ColorScheme;

  private progressDisplay: ProgressDisplay;
  private progressBars: Map<string, ProgressBar> = new Map();
  private uiConfig: UIConfig;
  private progressUpdateInterval?: NodeJS.Timeout;
  private chunkCounts: Map<string, number> = new Map();

  constructor(uiConfig: UIConfig = DEFAULT_UI_CONFIG, colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME) {
    this.uiConfig = uiConfig;
    this.colorScheme = colorScheme;
    this.progressDisplay = new ProgressDisplay();
  }

  /**
   * Initializes progress bars for both models during preparation phase.
   * Requirements: 11.1, 11.3
   * 
   * @param affirmativeModel - Name of the affirmative model
   * @param negativeModel - Name of the negative model
   */
  initializePreparationProgress(affirmativeModel: string, negativeModel: string): void {
    if (!this.uiConfig.showPreparationProgress) {
      return;
    }

    // Create progress bars for both models
    const affirmativeBar = this.progressDisplay.createProgressBar(
      `${affirmativeModel} (Affirmative)`,
      Position.AFFIRMATIVE
    );
    const negativeBar = this.progressDisplay.createProgressBar(
      `${negativeModel} (Negative)`,
      Position.NEGATIVE
    );

    this.progressBars.set('affirmative', affirmativeBar);
    this.progressBars.set('negative', negativeBar);

    // Start phrase cycling for both bars (Requirement 11.2)
    this.progressDisplay.startPhraseCycling(affirmativeBar, 2000);
    this.progressDisplay.startPhraseCycling(negativeBar, 2000);

    // Initialize chunk counters
    this.chunkCounts.set('affirmative', 0);
    this.chunkCounts.set('negative', 0);

    // Start periodic progress updates
    this.startProgressUpdates();
  }

  /**
   * Starts periodic progress bar updates and display refresh.
   * Requirements: 11.1, 11.2
   */
  private startProgressUpdates(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }

    // Clear screen and display initial progress
    this.displayProgressBars();

    // Update display every 100ms for smooth animation
    this.progressUpdateInterval = setInterval(() => {
      this.displayProgressBars();
    }, 100);
  }

  /**
   * Displays concurrent progress bars for both models.
   * Requirements: 11.3
   */
  private displayProgressBars(): void {
    const bars = Array.from(this.progressBars.values());
    if (bars.length === 0) return;

    // Move cursor up to overwrite previous progress display
    const lineCount = bars.length + 2; // bars + spacing
    process.stdout.write(`\x1b[${lineCount}A`);
    
    // Clear lines
    for (let i = 0; i < lineCount; i++) {
      process.stdout.write('\x1b[2K'); // Clear line
      if (i < lineCount - 1) {
        process.stdout.write('\n');
      }
    }
    
    // Move cursor back up
    process.stdout.write(`\x1b[${lineCount}A`);

    // Display progress bars
    console.log(''); // Spacing
    console.log(this.progressDisplay.displayConcurrentProgress(bars));
    console.log(''); // Spacing
  }

  /**
   * Called when a chunk of content is received from the model.
   * Updates progress bar or displays chunk based on configuration.
   * Requirements: 3.2, 8.2, 11.1, 11.5
   * 
   * @param chunk - The content chunk to display
   * @param model - The model name generating the content
   * @param position - The debate position (affirmative or negative)
   */
  onChunk(chunk: string, model: string, position: Position): void {
    const key = position === Position.AFFIRMATIVE ? 'affirmative' : 'negative';
    
    if (this.uiConfig.showPreparationProgress) {
      // Update progress based on chunk count (Requirement 11.5)
      // DO NOT display the chunk - only update progress bar
      const currentCount = this.chunkCounts.get(key) || 0;
      this.chunkCounts.set(key, currentCount + 1);
      
      // Estimate progress (chunks are unpredictable, so we use a logarithmic scale)
      // This provides smooth progress that slows down as it approaches 100%
      const bar = this.progressBars.get(key);
      if (bar) {
        const estimatedProgress = Math.min(95, Math.log(currentCount + 1) * 20);
        this.progressDisplay.updateProgress(bar, estimatedProgress);
      }
      // Note: chunk is NOT displayed when progress bars are enabled
    } else {
      // Display chunk with streaming indicator (Requirement 8.2)
      // Add subtle indicator showing which model is currently speaking
      process.stdout.write(chunk);
    }
  }

  /**
   * Called when a model completes its response generation.
   * Displays completion message with model identification and timing.
   * Requirements: 3.3, 8.3, 11.4
   * 
   * @param model - The model name that completed
   * @param position - The debate position (affirmative or negative)
   */
  onComplete(model: string, position: Position): void {
    const key = position === Position.AFFIRMATIVE ? 'affirmative' : 'negative';
    const bar = this.progressBars.get(key);

    if (this.uiConfig.showPreparationProgress && bar) {
      // Complete the progress bar (Requirement 11.4)
      this.progressDisplay.completeProgress(bar);
      
      // Display final progress state
      this.displayProgressBars();
      
      // Check if both models are complete
      const allComplete = Array.from(this.progressBars.values()).every(b => b.percentage === 100);
      if (allComplete) {
        this.stopProgressUpdates();
      }
    } else {
      // Raw output mode - display completion message with subtle indicator (Requirement 8.3)
      const color = position === Position.AFFIRMATIVE 
        ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
        : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
      
      const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
      
      const positionLabel = position === Position.AFFIRMATIVE 
        ? 'AFFIRMATIVE' 
        : 'NEGATIVE';

      // Add newlines and completion message with checkmark indicator
      process.stdout.write('\n\n');
      console.log(
        `${mutedColor}[${color}${positionLabel}${ANSI_RESET}${mutedColor} - ${model}] ` +
        `Preparation complete ✓${ANSI_RESET}`
      );
      console.log(''); // Extra line for spacing
    }
  }

  /**
   * Stops progress updates and cleans up resources.
   */
  private stopProgressUpdates(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = undefined;
    }
  }

  /**
   * Displays completion summary with timing information for both models.
   * Requirements: 3.3, 9.1, 9.4
   */
  displayCompletionSummary(): void {
    if (!this.uiConfig.showPreparationProgress) {
      return;
    }

    const affirmativeBar = this.progressBars.get('affirmative');
    const negativeBar = this.progressBars.get('negative');

    const boldColor = getColorForElement(ElementType.BOLD, this.colorScheme);
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    const affirmativeColor = getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme);
    const negativeColor = getColorForElement(ElementType.NEGATIVE, this.colorScheme);

    console.log(''); // Spacing
    console.log(`${boldColor}Preparation Complete${ANSI_RESET}`);
    
    if (affirmativeBar) {
      const elapsed = this.progressDisplay.formatElapsedTime(affirmativeBar);
      console.log(
        `${mutedColor}${affirmativeColor}Affirmative${ANSI_RESET}${mutedColor}: ` +
        `${affirmativeBar.label} completed in ${elapsed}${ANSI_RESET}`
      );
    }
    
    if (negativeBar) {
      const elapsed = this.progressDisplay.formatElapsedTime(negativeBar);
      console.log(
        `${mutedColor}${negativeColor}Negative${ANSI_RESET}${mutedColor}: ` +
        `${negativeBar.label} completed in ${elapsed}${ANSI_RESET}`
      );
    }
    
    console.log(''); // Spacing
  }

  /**
   * Cleans up progress display resources.
   */
  cleanup(): void {
    this.stopProgressUpdates();
    this.progressDisplay.clearAll();
    this.progressBars.clear();
    this.chunkCounts.clear();
  }

  /**
   * Called when an error occurs during streaming.
   * Displays error message with model identification.
   * Requirements: 8.4, 9.1
   * 
   * @param error - The error that occurred
   * @param model - The model name that encountered the error
   * @param position - The debate position (affirmative or negative)
   * @param partialContent - Optional partial content that was received before the error
   */
  onError(error: Error, model: string, position: Position, partialContent?: string): void {
    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const errorColor = getColorForElement(ElementType.ERROR, this.colorScheme);
    const boldColor = getColorForElement(ElementType.BOLD, this.colorScheme);
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Display error with visual formatting and interruption indicator (Requirement 8.4)
    console.error(''); // Newline before error
    console.error(
      `${errorColor}${boldColor}[ERROR]${ANSI_RESET} ` +
      `${mutedColor}[${color}${positionLabel}${ANSI_RESET}${mutedColor} - ${model}]${ANSI_RESET} ` +
      `${errorColor}Stream interrupted ✗${ANSI_RESET}`
    );
    console.error(`${errorColor}${error.message}${ANSI_RESET}`);
    
    // Display partial content information if available
    if (partialContent && partialContent.length > 0) {
      const wordCount = partialContent.split(/\s+/).filter(w => w.length > 0).length;
      console.error(
        `${mutedColor}Partial content received: ${wordCount} words${ANSI_RESET}`
      );
    }
    
    console.error(''); // Newline after error
  }

  /**
   * Displays a timeout message during streaming.
   * Requirements: 8.4, 9.1, 9.4
   * 
   * @param model - The model name that timed out
   * @param position - The debate position (affirmative or negative)
   * @param partialContent - The partial content received before timeout
   */
  onTimeout(model: string, position: Position, partialContent: string): void {
    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    const wordCount = partialContent.split(/\s+/).filter(w => w.length > 0).length;

    // Display timeout with interruption indicator (Requirement 8.4)
    console.warn(''); // Newline before warning
    console.warn(
      `${mutedColor}[${color}${positionLabel}${ANSI_RESET}${mutedColor} - ${model}] ` +
      `Preparation time limit reached ⏱ Using partial content (${wordCount} words)${ANSI_RESET}`
    );
    console.warn(''); // Newline after warning
  }

  /**
   * Displays a retry message for streaming operations.
   * Requirements: 8.4, 9.1, 9.4
   * 
   * @param model - The model name being retried
   * @param position - The debate position (affirmative or negative)
   * @param attemptNumber - The current attempt number
   */
  onRetry(model: string, position: Position, attemptNumber: number): void {
    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Display retry with visual feedback (Requirement 8.4)
    console.warn(''); // Newline before warning
    console.warn(
      `${mutedColor}[${color}${positionLabel}${ANSI_RESET}${mutedColor} - ${model}] ` +
      `Retrying... ↻ (Attempt ${attemptNumber})${ANSI_RESET}`
    );
    console.warn(''); // Newline after warning
  }

  /**
   * Handles stream interruption with clear visual feedback.
   * Requirements: 8.4, 9.1, 9.4
   * 
   * @param model - The model name that was interrupted
   * @param position - The debate position (affirmative or negative)
   * @param reason - The reason for interruption
   * @param partialContent - Optional partial content received before interruption
   */
  onInterruption(model: string, position: Position, reason: string, partialContent?: string): void {
    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Stop progress updates if in progress mode
    if (this.uiConfig.showPreparationProgress) {
      this.stopProgressUpdates();
    }

    // Display interruption with clear visual feedback (Requirement 8.4)
    console.warn(''); // Newline before warning
    console.warn(
      `${mutedColor}[${color}${positionLabel}${ANSI_RESET}${mutedColor} - ${model}] ` +
      `Stream interrupted ⚠ ${ANSI_RESET}`
    );
    console.warn(`${mutedColor}Reason: ${reason}${ANSI_RESET}`);
    
    // Display partial content information if available
    if (partialContent && partialContent.length > 0) {
      const wordCount = partialContent.split(/\s+/).filter(w => w.length > 0).length;
      console.warn(
        `${mutedColor}Partial content received: ${wordCount} words${ANSI_RESET}`
      );
    }
    
    console.warn(''); // Newline after warning
  }

  /**
   * Displays a header for the preparation phase with model identification.
   * Only shown in raw output mode.
   * Requirements: 8.2, 8.5, 9.1, 9.4
   * 
   * @param model - The model name
   * @param position - The debate position (affirmative or negative)
   */
  displayPreparationHeader(model: string, position: Position): void {
    // Skip header in progress bar mode
    if (this.uiConfig.showPreparationProgress) {
      return;
    }

    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const boldColor = getColorForElement(ElementType.BOLD, this.colorScheme);
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Display distinct preparation header with clear labeling (Requirements 8.2, 8.5)
    console.log(''); // Spacing before header
    console.log(`${mutedColor}${'─'.repeat(60)}${ANSI_RESET}`);
    console.log(
      `${boldColor}[${color}${positionLabel}${ANSI_RESET}${boldColor} - ${model}]${ANSI_RESET} ` +
      `${mutedColor}Researching topic...${ANSI_RESET}`
    );
    console.log(`${mutedColor}${'─'.repeat(60)}${ANSI_RESET}`);
    console.log(''); // Spacing after header
  }

  /**
   * Displays a separator between different sections.
   * Requirements: 9.1, 9.4
   */
  displaySeparator(): void {
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    console.log(`${mutedColor}${'═'.repeat(60)}${ANSI_RESET}`);
  }

  /**
   * Displays the preparation phase header.
   * Requirements: 9.1
   */
  displayPhaseHeader(): void {
    const boldColor = getColorForElement(ElementType.BOLD, this.colorScheme);
    
    console.log('');
    this.displaySeparator();
    console.log(`${boldColor}Preparation Phase${ANSI_RESET}`);
    this.displaySeparator();
    
    // Add extra spacing for progress bars
    if (this.uiConfig.showPreparationProgress) {
      console.log('');
      console.log(''); // Reserve space for progress bars
      console.log('');
    }
  }

  /**
   * Displays a labeled stream separator for concurrent streaming.
   * Requirements: 8.2, 9.1, 9.4
   * 
   * @param model - The model name
   * @param position - The debate position (affirmative or negative)
   */
  displayStreamLabel(model: string, position: Position): void {
    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Display clear stream label for concurrent streaming (Requirement 8.2)
    console.log('');
    console.log(
      `${mutedColor}┌─ ${color}${positionLabel}${ANSI_RESET}${mutedColor} - ${model} ─┐${ANSI_RESET}`
    );
  }

  /**
   * Displays a stream end marker.
   * Requirements: 8.2, 8.3, 9.1, 9.4
   * 
   * @param model - The model name
   * @param position - The debate position (affirmative or negative)
   */
  displayStreamEnd(model: string, position: Position): void {
    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Display stream end marker with completion indicator (Requirements 8.2, 8.3)
    console.log(
      `${mutedColor}└─ ${color}${positionLabel}${ANSI_RESET}${mutedColor} - ${model} ─┘ ✓${ANSI_RESET}`
    );
    console.log('');
  }

  /**
   * Formats preparation material distinctly from debate statements.
   * Requirements: 8.5, 9.1, 9.4
   * 
   * @param content - The preparation content to format
   * @param model - The model name
   * @param position - The debate position (affirmative or negative)
   * @returns Formatted preparation content
   */
  formatPreparationContent(content: string, model: string, position: Position): string {
    const color = position === Position.AFFIRMATIVE 
      ? getColorForElement(ElementType.AFFIRMATIVE, this.colorScheme)
      : getColorForElement(ElementType.NEGATIVE, this.colorScheme);
    
    const mutedColor = getColorForElement(ElementType.MUTED, this.colorScheme);
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Format preparation materials distinctly (Requirement 8.5)
    const lines = content.split('\n');
    const formattedLines = lines.map(line => {
      if (line.trim().length === 0) return line;
      return `${mutedColor}│${ANSI_RESET} ${line}`;
    });

    const header = `${mutedColor}┌─ ${color}PREPARATION${ANSI_RESET}${mutedColor} - ${positionLabel} - ${model} ─┐${ANSI_RESET}`;
    const footer = `${mutedColor}└${'─'.repeat(58)}┘${ANSI_RESET}`;

    return `${header}\n${formattedLines.join('\n')}\n${footer}`;
  }
}
