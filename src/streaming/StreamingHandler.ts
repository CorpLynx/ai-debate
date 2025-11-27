import { Position } from '../models/Position';

/**
 * Handles streaming output from AI models during preparation phase.
 * Provides real-time display of content as it's generated with model identification.
 */
export class StreamingHandler {
  private readonly colors = {
    affirmative: '\x1b[36m', // Cyan
    negative: '\x1b[35m',    // Magenta
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    error: '\x1b[31m'        // Red
  };

  /**
   * Called when a chunk of content is received from the model.
   * Displays the chunk with model identification.
   * 
   * @param chunk - The content chunk to display
   * @param model - The model name generating the content
   * @param position - The debate position (affirmative or negative)
   */
  onChunk(chunk: string, model: string, position: Position): void {
    // Display chunk without newline to maintain streaming effect
    process.stdout.write(chunk);
  }

  /**
   * Called when a model completes its response generation.
   * Displays completion message with model identification.
   * 
   * @param model - The model name that completed
   * @param position - The debate position (affirmative or negative)
   */
  onComplete(model: string, position: Position): void {
    const color = position === Position.AFFIRMATIVE 
      ? this.colors.affirmative 
      : this.colors.negative;
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Add newlines and completion message
    process.stdout.write('\n\n');
    console.log(
      `${this.colors.dim}[${color}${positionLabel}${this.colors.reset}${this.colors.dim} - ${model}] ` +
      `Preparation complete${this.colors.reset}`
    );
    console.log(''); // Extra line for spacing
  }

  /**
   * Called when an error occurs during streaming.
   * Displays error message with model identification.
   * 
   * @param error - The error that occurred
   * @param model - The model name that encountered the error
   * @param position - The debate position (affirmative or negative)
   */
  onError(error: Error, model: string, position: Position): void {
    const color = position === Position.AFFIRMATIVE 
      ? this.colors.affirmative 
      : this.colors.negative;
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    // Display error with visual formatting
    console.error(''); // Newline before error
    console.error(
      `${this.colors.error}${this.colors.bold}[ERROR]${this.colors.reset} ` +
      `${this.colors.dim}[${color}${positionLabel}${this.colors.reset}${this.colors.dim} - ${model}]${this.colors.reset}`
    );
    console.error(`${this.colors.error}${error.message}${this.colors.reset}`);
    console.error(''); // Newline after error
  }

  /**
   * Displays a header for the preparation phase with model identification.
   * 
   * @param model - The model name
   * @param position - The debate position (affirmative or negative)
   */
  displayPreparationHeader(model: string, position: Position): void {
    const color = position === Position.AFFIRMATIVE 
      ? this.colors.affirmative 
      : this.colors.negative;
    
    const positionLabel = position === Position.AFFIRMATIVE 
      ? 'AFFIRMATIVE' 
      : 'NEGATIVE';

    console.log(''); // Spacing before header
    console.log(
      `${this.colors.bold}[${color}${positionLabel}${this.colors.reset}${this.colors.bold} - ${model}]${this.colors.reset} ` +
      `${this.colors.dim}Researching topic...${this.colors.reset}`
    );
    console.log(''); // Spacing after header
  }

  /**
   * Displays a separator between different sections.
   */
  displaySeparator(): void {
    console.log(`${this.colors.dim}${'═'.repeat(60)}${this.colors.reset}`);
  }

  /**
   * Displays the preparation phase header.
   */
  displayPhaseHeader(): void {
    console.log('');
    this.displaySeparator();
    console.log(`${this.colors.bold}Preparation Phase${this.colors.reset}`);
    this.displaySeparator();
  }
}
