import { ConfigurationManager } from '../../src/utils/ConfigurationManager';
import { DEFAULT_CONFIG } from '../../src/models/DebateConfig';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Configuration Error Handling Integration', () => {
  let configManager: ConfigurationManager;
  let tempDir: string;
  let tempConfigPath: string;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debate-config-error-test-'));
    tempConfigPath = path.join(tempDir, '.debaterc');
  });

  afterEach(() => {
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  describe('Missing Configuration File', () => {
    it('should use defaults when configuration file does not exist', () => {
      const result = configManager.loadAndMerge({}, '/nonexistent/path/.debaterc');
      
      // Should use all default values
      expect(result.config).toEqual(DEFAULT_CONFIG);
      
      // No warnings for missing file (expected behavior)
      expect(result.warnings).toHaveLength(0);
      expect(result.invalidParams).toHaveLength(0);
    });
  });

  describe('Invalid Configuration Format', () => {
    it('should handle malformed JSON and display warning', () => {
      // Write invalid JSON
      fs.writeFileSync(tempConfigPath, '{ invalid json }');
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Should use default values
      expect(result.config).toEqual(DEFAULT_CONFIG);
      
      // Should have warning about invalid JSON
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('invalid JSON format');
      expect(result.warnings[0]).toContain('Using default values');
    });

    it('should handle incomplete JSON and display warning', () => {
      // Write incomplete JSON
      fs.writeFileSync(tempConfigPath, '{ "timeLimit": 120');
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Should use default values
      expect(result.config).toEqual(DEFAULT_CONFIG);
      
      // Should have warning
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('invalid JSON format');
    });

    it('should handle non-JSON content and display warning', () => {
      // Write plain text
      fs.writeFileSync(tempConfigPath, 'This is not JSON');
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Should use default values
      expect(result.config).toEqual(DEFAULT_CONFIG);
      
      // Should have warning
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('invalid JSON format');
    });
  });

  describe('Missing Individual Parameters', () => {
    it('should use defaults for missing parameters without warnings', () => {
      const partialConfig = {
        timeLimit: 90,
        wordLimit: 400
        // Other parameters missing
      };
      
      fs.writeFileSync(tempConfigPath, JSON.stringify(partialConfig, null, 2));
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Specified parameters should be used
      expect(result.config.timeLimit).toBe(90);
      expect(result.config.wordLimit).toBe(400);
      
      // Missing parameters should use defaults
      expect(result.config.strictMode).toBe(DEFAULT_CONFIG.strictMode);
      expect(result.config.showPreparation).toBe(DEFAULT_CONFIG.showPreparation);
      expect(result.config.numCrossExamQuestions).toBe(DEFAULT_CONFIG.numCrossExamQuestions);
      expect(result.config.preparationTime).toBe(DEFAULT_CONFIG.preparationTime);
      
      // No warnings for missing parameters (expected behavior)
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle completely empty configuration', () => {
      fs.writeFileSync(tempConfigPath, JSON.stringify({}, null, 2));
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Should use all defaults
      expect(result.config).toEqual(DEFAULT_CONFIG);
      
      // No warnings
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Invalid Individual Parameters', () => {
    it('should display warnings for invalid parameters and use defaults', () => {
      const invalidConfig = {
        timeLimit: -50, // invalid
        wordLimit: 0, // invalid
        strictMode: 'not a boolean', // invalid
        showPreparation: true, // valid
        numCrossExamQuestions: 3 // valid
      };
      
      fs.writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2));
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Valid parameters should be used
      expect(result.config.showPreparation).toBe(true);
      expect(result.config.numCrossExamQuestions).toBe(3);
      
      // Invalid parameters should fall back to defaults
      expect(result.config.timeLimit).toBe(DEFAULT_CONFIG.timeLimit);
      expect(result.config.wordLimit).toBe(DEFAULT_CONFIG.wordLimit);
      expect(result.config.strictMode).toBe(DEFAULT_CONFIG.strictMode);
      
      // Should have warnings for invalid parameters
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('timeLimit'))).toBe(true);
      expect(result.warnings.some(w => w.includes('wordLimit'))).toBe(true);
      expect(result.warnings.some(w => w.includes('strictMode'))).toBe(true);
      
      // Should track invalid parameters
      expect(result.invalidParams).toContain('timeLimit');
      expect(result.invalidParams).toContain('wordLimit');
      expect(result.invalidParams).toContain('strictMode');
    });

    it('should handle multiple types of errors simultaneously', () => {
      const mixedConfig = {
        timeLimit: -10, // invalid
        wordLimit: 300, // valid
        strictMode: 'yes', // invalid
        preparationTime: 0 // invalid
      };
      
      fs.writeFileSync(tempConfigPath, JSON.stringify(mixedConfig, null, 2));
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Valid parameter should be used
      expect(result.config.wordLimit).toBe(300);
      
      // Invalid parameters should use defaults
      expect(result.config.timeLimit).toBe(DEFAULT_CONFIG.timeLimit);
      expect(result.config.strictMode).toBe(DEFAULT_CONFIG.strictMode);
      expect(result.config.preparationTime).toBe(DEFAULT_CONFIG.preparationTime);
      
      // Should have warnings for all invalid parameters
      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
      expect(result.invalidParams).toContain('timeLimit');
      expect(result.invalidParams).toContain('strictMode');
      expect(result.invalidParams).toContain('preparationTime');
    });
  });

  describe('Combined Error Scenarios', () => {
    it('should handle file errors and parameter errors together', () => {
      // This test verifies that warnings from file loading and validation are combined
      const invalidConfig = {
        timeLimit: -50 // invalid parameter
      };
      
      fs.writeFileSync(tempConfigPath, JSON.stringify(invalidConfig, null, 2));
      
      const result = configManager.loadAndMerge({}, tempConfigPath);
      
      // Should use default for invalid parameter
      expect(result.config.timeLimit).toBe(DEFAULT_CONFIG.timeLimit);
      
      // Should have warning for invalid parameter
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('timeLimit'))).toBe(true);
    });
  });

  describe('Requirement 7.3: Display warnings for configuration issues', () => {
    it('should display warnings for all configuration issues', () => {
      const testCases = [
        {
          name: 'invalid JSON',
          content: '{ invalid }',
          expectedWarning: 'invalid JSON format'
        },
        {
          name: 'invalid parameter',
          content: JSON.stringify({ timeLimit: -10 }),
          expectedWarning: 'timeLimit'
        }
      ];

      for (const testCase of testCases) {
        fs.writeFileSync(tempConfigPath, testCase.content);
        
        const result = configManager.loadAndMerge({}, tempConfigPath);
        
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings.some(w => w.includes(testCase.expectedWarning))).toBe(true);
        
        // Clean up for next iteration
        fs.unlinkSync(tempConfigPath);
      }
    });
  });
});
