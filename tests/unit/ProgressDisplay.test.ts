import { ProgressDisplay } from '../../src/utils/ProgressDisplay';
import { Position } from '../../src/models/Position';
import { STATUS_PHRASES } from '../../src/models/ProgressBar';

describe('ProgressDisplay', () => {
  let progressDisplay: ProgressDisplay;

  beforeEach(() => {
    progressDisplay = new ProgressDisplay();
  });

  afterEach(() => {
    progressDisplay.clearAll();
  });

  describe('createProgressBar', () => {
    it('should create a progress bar with initial values', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);

      expect(bar.label).toBe('Test Model');
      expect(bar.position).toBe(Position.AFFIRMATIVE);
      expect(bar.percentage).toBe(0);
      expect(bar.statusPhrase).toBe(STATUS_PHRASES[0]);
      expect(bar.id).toBeDefined();
      expect(bar.startTime).toBeInstanceOf(Date);
    });

    it('should create unique IDs for different progress bars', () => {
      const bar1 = progressDisplay.createProgressBar('Model 1', Position.AFFIRMATIVE);
      const bar2 = progressDisplay.createProgressBar('Model 2', Position.NEGATIVE);

      expect(bar1.id).not.toBe(bar2.id);
    });
  });

  describe('updateProgress', () => {
    it('should update progress percentage', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);

      progressDisplay.updateProgress(bar, 50);
      expect(bar.percentage).toBe(50);

      progressDisplay.updateProgress(bar, 75);
      expect(bar.percentage).toBe(75);
    });

    it('should clamp percentage to 0-100 range', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);

      progressDisplay.updateProgress(bar, -10);
      expect(bar.percentage).toBe(0);

      progressDisplay.updateProgress(bar, 150);
      expect(bar.percentage).toBe(100);
    });
  });

  describe('updateStatusPhrase', () => {
    it('should update status phrase', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);

      progressDisplay.updateStatusPhrase(bar, 'Custom phrase');
      expect(bar.statusPhrase).toBe('Custom phrase');
    });
  });

  describe('completeProgress', () => {
    it('should set percentage to 100', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);
      progressDisplay.updateProgress(bar, 50);

      progressDisplay.completeProgress(bar);
      expect(bar.percentage).toBe(100);
    });
  });

  describe('renderProgressBar', () => {
    it('should render a progress bar string', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);
      progressDisplay.updateProgress(bar, 50);

      const rendered = progressDisplay.renderProgressBar(bar, 20);

      expect(rendered).toContain('Test Model');
      expect(rendered).toContain('50%');
      expect(rendered).toContain(bar.statusPhrase);
      expect(rendered).toContain('[');
      expect(rendered).toContain(']');
    });

    it('should render filled and empty portions correctly', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);
      progressDisplay.updateProgress(bar, 0);

      const rendered0 = progressDisplay.renderProgressBar(bar, 10);
      expect(rendered0).toContain('░'.repeat(10));

      progressDisplay.updateProgress(bar, 100);
      const rendered100 = progressDisplay.renderProgressBar(bar, 10);
      expect(rendered100).toContain('█'.repeat(10));
    });
  });

  describe('displayConcurrentProgress', () => {
    it('should display multiple progress bars', () => {
      const bar1 = progressDisplay.createProgressBar('Model 1', Position.AFFIRMATIVE);
      const bar2 = progressDisplay.createProgressBar('Model 2', Position.NEGATIVE);

      progressDisplay.updateProgress(bar1, 30);
      progressDisplay.updateProgress(bar2, 70);

      const display = progressDisplay.displayConcurrentProgress([bar1, bar2]);

      expect(display).toContain('Model 1');
      expect(display).toContain('Model 2');
      expect(display).toContain('30%');
      expect(display).toContain('70%');
      expect(display).toContain('\n');
    });

    it('should handle empty array', () => {
      const display = progressDisplay.displayConcurrentProgress([]);
      expect(display).toBe('');
    });
  });

  describe('getActiveBars', () => {
    it('should return all active progress bars', () => {
      const bar1 = progressDisplay.createProgressBar('Model 1', Position.AFFIRMATIVE);
      const bar2 = progressDisplay.createProgressBar('Model 2', Position.NEGATIVE);

      const activeBars = progressDisplay.getActiveBars();

      expect(activeBars).toHaveLength(2);
      expect(activeBars).toContainEqual(bar1);
      expect(activeBars).toContainEqual(bar2);
    });
  });

  describe('removeProgressBar', () => {
    it('should remove a progress bar from active tracking', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);

      expect(progressDisplay.getActiveBars()).toHaveLength(1);

      progressDisplay.removeProgressBar(bar);

      expect(progressDisplay.getActiveBars()).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all active progress bars', () => {
      progressDisplay.createProgressBar('Model 1', Position.AFFIRMATIVE);
      progressDisplay.createProgressBar('Model 2', Position.NEGATIVE);

      expect(progressDisplay.getActiveBars()).toHaveLength(2);

      progressDisplay.clearAll();

      expect(progressDisplay.getActiveBars()).toHaveLength(0);
    });
  });

  describe('getElapsedTime', () => {
    it('should calculate elapsed time', (done) => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);

      setTimeout(() => {
        const elapsed = progressDisplay.getElapsedTime(bar);
        expect(elapsed).toBeGreaterThanOrEqual(50);
        expect(elapsed).toBeLessThan(200);
        done();
      }, 50);
    });
  });

  describe('formatElapsedTime', () => {
    it('should format elapsed time in seconds', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);
      bar.startTime = new Date(Date.now() - 5000);

      const formatted = progressDisplay.formatElapsedTime(bar);
      expect(formatted).toBe('5s');
    });

    it('should format elapsed time in minutes and seconds', () => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);
      bar.startTime = new Date(Date.now() - 125000);

      const formatted = progressDisplay.formatElapsedTime(bar);
      expect(formatted).toBe('2m 5s');
    });
  });

  describe('phrase cycling', () => {
    it('should cycle through status phrases', (done) => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);
      const initialPhrase = bar.statusPhrase;

      progressDisplay.startPhraseCycling(bar, 100);

      setTimeout(() => {
        expect(bar.statusPhrase).not.toBe(initialPhrase);
        progressDisplay.stopPhraseCycling(bar);
        done();
      }, 150);
    });

    it('should stop phrase cycling', (done) => {
      const bar = progressDisplay.createProgressBar('Test Model', Position.AFFIRMATIVE);

      progressDisplay.startPhraseCycling(bar, 100);
      
      setTimeout(() => {
        progressDisplay.stopPhraseCycling(bar);
        const phraseAfterStop = bar.statusPhrase;

        setTimeout(() => {
          expect(bar.statusPhrase).toBe(phraseAfterStop);
          done();
        }, 150);
      }, 50);
    });
  });
});
