/**
 * Mock implementation of ora for testing
 */

export interface Ora {
  start(): Ora;
  stop(): Ora;
  succeed(text?: string): Ora;
  fail(text?: string): Ora;
  warn(text?: string): Ora;
  info(text?: string): Ora;
  text: string;
  isSpinning: boolean;
}

const createMockSpinner = (options?: any): Ora => {
  return {
    start: function() { this.isSpinning = true; return this; },
    stop: function() { this.isSpinning = false; return this; },
    succeed: function(text?: string) { this.isSpinning = false; return this; },
    fail: function(text?: string) { this.isSpinning = false; return this; },
    warn: function(text?: string) { this.isSpinning = false; return this; },
    info: function(text?: string) { this.isSpinning = false; return this; },
    text: options?.text || '',
    isSpinning: false,
  };
};

export default createMockSpinner;
