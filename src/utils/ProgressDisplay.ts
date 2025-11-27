import { ProgressBar, STATUS_PHRASES } from '../models/ProgressBar';
import { Position } from '../models/Position';
import { DEFAULT_COLOR_SCHEME, ANSI_RESET } from '../models/ColorScheme';

/**
 * Manages animated progress bars and status indicators for the preparation phase
 */
export class ProgressDisplay {
  private activeBars: Map<string, ProgressBar> = new Map();
  private phraseIntervals: Map<string, NodeJS.Timeout> = new Map();
  private currentPhraseIndex: Map<string, number> = new Map();

  /**
   * Creates and displays an animated progress bar
   */
  createProgressBar(label: string, position: Position): ProgressBar {
    const bar: ProgressBar = {
      id: `${position}-${Date.now()}`,
      label,
      percentage: 0,
      statusPhrase: STATUS_PHRASES[0],
      position,
      startTime: new Date()
    };

    this.activeBars.set(bar.id, bar);
    this.currentPhraseIndex.set(bar.id, 0);
    
    return bar;
  }

  /**
   * Updates progress bar percentage
   */
  updateProgress(bar: ProgressBar, percentage: number): void {
    // Clamp percentage between 0 and 100
    bar.percentage = Math.max(0, Math.min(100, percentage));
    
    // Update the bar in the active bars map
    this.activeBars.set(bar.id, bar);
  }

  /**
   * Cycles through status phrases
   */
  updateStatusPhrase(bar: ProgressBar, phrase: string): void {
    bar.statusPhrase = phrase;
    this.activeBars.set(bar.id, bar);
  }

  /**
   * Starts automatic status phrase cycling for a progress bar
   */
  startPhraseCycling(bar: ProgressBar, intervalMs: number = 2000): void {
    // Clear any existing interval
    this.stopPhraseCycling(bar);

    const interval = setInterval(() => {
      const currentIndex = this.currentPhraseIndex.get(bar.id) || 0;
      const nextIndex = (currentIndex + 1) % STATUS_PHRASES.length;
      
      this.currentPhraseIndex.set(bar.id, nextIndex);
      this.updateStatusPhrase(bar, STATUS_PHRASES[nextIndex]);
    }, intervalMs);

    this.phraseIntervals.set(bar.id, interval);
  }

  /**
   * Stops automatic status phrase cycling for a progress bar
   */
  stopPhraseCycling(bar: ProgressBar): void {
    const interval = this.phraseIntervals.get(bar.id);
    if (interval) {
      clearInterval(interval);
      this.phraseIntervals.delete(bar.id);
    }
  }

  /**
   * Completes and finalizes progress bar
   */
  completeProgress(bar: ProgressBar): void {
    this.stopPhraseCycling(bar);
    bar.percentage = 100;
    this.activeBars.set(bar.id, bar);
  }

  /**
   * Removes a progress bar from active tracking
   */
  removeProgressBar(bar: ProgressBar): void {
    this.stopPhraseCycling(bar);
    this.activeBars.delete(bar.id);
    this.currentPhraseIndex.delete(bar.id);
  }

  /**
   * Renders a single progress bar as a string
   */
  renderProgressBar(bar: ProgressBar, width: number = 40): string {
    const color = bar.position === Position.AFFIRMATIVE 
      ? DEFAULT_COLOR_SCHEME.affirmative 
      : DEFAULT_COLOR_SCHEME.negative;
    
    const filledWidth = Math.floor((bar.percentage / 100) * width);
    const emptyWidth = width - filledWidth;
    
    const filled = '█'.repeat(filledWidth);
    const empty = '░'.repeat(emptyWidth);
    
    const percentageStr = `${bar.percentage.toFixed(0)}%`.padStart(4);
    
    return `${color}${bar.label}${ANSI_RESET} [${color}${filled}${ANSI_RESET}${empty}] ${color}${percentageStr}${ANSI_RESET} ${DEFAULT_COLOR_SCHEME.muted}${bar.statusPhrase}${ANSI_RESET}`;
  }

  /**
   * Manages concurrent progress bars for multiple models
   */
  displayConcurrentProgress(bars: ProgressBar[], width: number = 40): string {
    const lines: string[] = [];
    
    for (const bar of bars) {
      lines.push(this.renderProgressBar(bar, width));
    }
    
    return lines.join('\n');
  }

  /**
   * Gets all active progress bars
   */
  getActiveBars(): ProgressBar[] {
    return Array.from(this.activeBars.values());
  }

  /**
   * Clears all active progress bars and intervals
   */
  clearAll(): void {
    for (const bar of this.activeBars.values()) {
      this.stopPhraseCycling(bar);
    }
    this.activeBars.clear();
    this.currentPhraseIndex.clear();
  }

  /**
   * Calculates elapsed time for a progress bar
   */
  getElapsedTime(bar: ProgressBar): number {
    return Date.now() - bar.startTime.getTime();
  }

  /**
   * Formats elapsed time as a human-readable string
   */
  formatElapsedTime(bar: ProgressBar): string {
    const elapsed = this.getElapsedTime(bar);
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }
}
