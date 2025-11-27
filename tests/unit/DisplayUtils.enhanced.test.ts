/**
 * Tests for enhanced DisplayUtils functions
 * 
 * Requirements tested:
 * - 6.2: Configuration display formatting
 * - 6.4: Setup progress indicators
 * - 6.5: Confirmation displays with checkmarks
 * - 7.1: Error format distinction
 * - 7.2: Warning vs error styling
 * - 7.3: Stack trace readability
 * - 7.4: Error grouping
 * - 7.5: Recovery suggestion highlighting
 */

import {
  displayError,
  displayWarning,
  displayGroupedMessages,
  displayConfirmation,
  displayConfirmations,
  displayConfigSection,
  displayHeader,
  displaySetupStep,
  displayProgressBar,
  formatStackTrace,
  displayRecoverySuggestions,
  displayWelcomeBanner
} from '../../src/utils/DisplayUtils';
import { DEFAULT_COLOR_SCHEME } from '../../src/models/ColorScheme';

describe('Enhanced DisplayUtils', () => {
  describe('Error and Warning Formatting', () => {
    it('should format error with stack trace and recovery suggestions', () => {
      const result = displayError('Test error message', {
        stackTrace: 'Error: Test\n  at test.ts:10:5\n  at main.ts:20:10',
        recoverySuggestions: ['Check configuration', 'Restart the service'],
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('ERROR');
      expect(result).toContain('Test error message');
      expect(result).toContain('Stack Trace');
      expect(result).toContain('Suggestions');
      expect(result).toContain('Check configuration');
    });

    it('should format warning with context', () => {
      const result = displayWarning('Test warning', {
        context: { file: 'test.ts', line: 42 },
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('WARNING');
      expect(result).toContain('Test warning');
      expect(result).toContain('Context');
      expect(result).toContain('file');
    });

    it('should group multiple errors', () => {
      const errors = [
        { message: 'Error 1', context: { code: 'E001' } },
        { message: 'Error 2', stackTrace: 'at test.ts:10' }
      ];
      
      const result = displayGroupedMessages(errors, 'error', {
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('2 ERRORS FOUND');
      expect(result).toContain('Error 1');
      expect(result).toContain('Error 2');
      expect(result).toContain('E001');
    });

    it('should format stack trace with line numbers', () => {
      const stackTrace = 'Error: Test\n  at func1 (file1.ts:10:5)\n  at func2 (file2.ts:20:10)\n  at func3 (file3.ts:30:15)';
      
      const result = formatStackTrace(stackTrace, {
        maxLines: 3,
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('Stack Trace');
      expect(result).toContain('func1');
      expect(result).toContain('func2');
    });
  });

  describe('Confirmation Displays', () => {
    it('should display confirmation with checkmark', () => {
      const result = displayConfirmation('Model', 'GPT-4', {
        colorScheme: DEFAULT_COLOR_SCHEME,
        showCheckmark: true
      });
      
      expect(result).toContain('✓');
      expect(result).toContain('Model');
      expect(result).toContain('GPT-4');
    });

    it('should display multiple confirmations', () => {
      const confirmations = [
        { label: 'Provider', value: 'OpenAI' },
        { label: 'Model', value: 'GPT-4' }
      ];
      
      const result = displayConfirmations(confirmations, {
        title: 'Configuration',
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('Configuration');
      expect(result).toContain('Provider');
      expect(result).toContain('OpenAI');
      expect(result).toContain('Model');
      expect(result).toContain('GPT-4');
      expect(result).toContain('✓');
    });
  });

  describe('Configuration Display', () => {
    it('should display config section with border', () => {
      const items = {
        provider: 'OpenAI',
        model: 'GPT-4',
        temperature: 0.7
      };
      
      const result = displayConfigSection('API Configuration', items, {
        colorScheme: DEFAULT_COLOR_SCHEME,
        showBorder: true
      });
      
      expect(result).toContain('API Configuration');
      expect(result).toContain('provider');
      expect(result).toContain('OpenAI');
      expect(result).toContain('┌');
      expect(result).toContain('└');
    });

    it('should display config section without border', () => {
      const items = {
        rounds: 3,
        wordLimit: 500
      };
      
      const result = displayConfigSection('Debate Settings', items, {
        colorScheme: DEFAULT_COLOR_SCHEME,
        showBorder: false
      });
      
      expect(result).toContain('Debate Settings');
      expect(result).toContain('rounds');
      expect(result).toContain('3');
    });
  });

  describe('Setup Progress Indicators', () => {
    it('should display header with progress bar', () => {
      const result = displayHeader('Configuration', 60, 2, 4, {
        colorScheme: DEFAULT_COLOR_SCHEME,
        showProgressBar: true
      });
      
      expect(result).toContain('Step 2/4');
      expect(result).toContain('Configuration');
      expect(result).toContain('50%');
    });

    it('should display setup step with status', () => {
      const result = displaySetupStep(1, 3, 'Select Provider', 'complete', {
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('✓');
      expect(result).toContain('[1/3]');
      expect(result).toContain('Select Provider');
    });

    it('should display active setup step', () => {
      const result = displaySetupStep(2, 3, 'Choose Model', 'active', {
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('▶');
      expect(result).toContain('[2/3]');
      expect(result).toContain('Choose Model');
    });

    it('should display pending setup step', () => {
      const result = displaySetupStep(3, 3, 'Enter Topic', 'pending', {
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('○');
      expect(result).toContain('[3/3]');
      expect(result).toContain('Enter Topic');
    });
  });

  describe('Progress Bar', () => {
    it('should display progress bar with label', () => {
      const result = displayProgressBar(3, 5, 40, {
        colorScheme: DEFAULT_COLOR_SCHEME,
        label: 'Loading'
      });
      
      expect(result).toContain('Loading');
      expect(result).toContain('60%');
      expect(result).toContain('(3/5)');
    });
  });

  describe('Recovery Suggestions', () => {
    it('should display recovery suggestions prominently', () => {
      const suggestions = [
        'Check your API key',
        'Verify network connection',
        'Try again in a few moments'
      ];
      
      const result = displayRecoverySuggestions(suggestions, {
        title: 'How to Fix',
        colorScheme: DEFAULT_COLOR_SCHEME
      });
      
      expect(result).toContain('How to Fix');
      expect(result).toContain('💡');
      expect(result).toContain('Check your API key');
      expect(result).toContain('Verify network connection');
      expect(result).toContain('Try again in a few moments');
    });
  });

  describe('Welcome Banner', () => {
    it('should display welcome banner with ASCII art', () => {
      const result = displayWelcomeBanner({
        colorScheme: DEFAULT_COLOR_SCHEME,
        animated: false
      });
      
      // Verify banner contains ASCII art elements
      expect(result).toContain('___');
      expect(result).toContain('____');
      
      // Verify box drawing characters
      expect(result).toContain('╔');
      expect(result).toContain('╗');
      expect(result).toContain('╚');
      expect(result).toContain('╝');
      expect(result).toContain('┌');
      expect(result).toContain('└');
      
      // Verify subtitle
      expect(result).toContain('Orchestrating Intelligent Discourse');
      
      // Verify features section
      expect(result).toContain('Key Features');
      expect(result).toContain('Multiple AI Provider Support');
      expect(result).toContain('Structured Debate Format');
      expect(result).toContain('Real-time Streaming Display');
      expect(result).toContain('Citation Tracking');
      
      // Verify setup steps
      expect(result).toContain('Interactive Setup Process');
      expect(result).toContain('Select AI providers');
      expect(result).toContain('Choose specific models');
      expect(result).toContain('Enter your debate topic');
      expect(result).toContain('Review configuration');
      
      // Verify help text
      expect(result).toContain('exit');
    });

    it('should display welcome banner without animation by default', () => {
      const result = displayWelcomeBanner();
      
      expect(result).toContain('___');
      expect(result).toContain('Orchestrating Intelligent Discourse');
      expect(result).not.toContain('Ready'); // Animation indicator
    });

    it('should display welcome banner with animation indicator when requested', () => {
      const result = displayWelcomeBanner({
        colorScheme: DEFAULT_COLOR_SCHEME,
        animated: true
      });
      
      expect(result).toContain('___');
      expect(result).toContain('Orchestrating Intelligent Discourse');
      expect(result).toContain('Ready'); // Animation indicator
    });
  });
});
