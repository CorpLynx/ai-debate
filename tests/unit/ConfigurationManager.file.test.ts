import { ConfigurationManager } from '../../src/utils/ConfigurationManager';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigurationManager - File Loading', () => {
  const testConfigPath = path.join(__dirname, '.debaterc.test');
  let configManager: ConfigurationManager;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    // Clean up any existing test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Clean up test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  test('should load configuration from file', () => {
    const testConfig = {
      timeLimit: 120,
      wordLimit: 500,
      strictMode: true
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadFromFile(testConfigPath);
    
    expect(loaded.timeLimit).toBe(120);
    expect(loaded.wordLimit).toBe(500);
    expect(loaded.strictMode).toBe(true);
  });

  test('should return empty object if file does not exist', () => {
    const loaded = configManager.loadFromFile('/nonexistent/path/.debaterc');
    expect(loaded).toEqual({});
  });

  test('should handle invalid JSON gracefully', () => {
    fs.writeFileSync(testConfigPath, 'invalid json {');
    
    const loaded = configManager.loadFromFile(testConfigPath);
    expect(loaded).toEqual({});
  });

  test('should load all supported configuration options', () => {
    const testConfig = {
      timeLimit: 90,
      wordLimit: 400,
      strictMode: false,
      showPreparation: false,
      numCrossExamQuestions: 5
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadFromFile(testConfigPath);
    
    expect(loaded.timeLimit).toBe(90);
    expect(loaded.wordLimit).toBe(400);
    expect(loaded.strictMode).toBe(false);
    expect(loaded.showPreparation).toBe(false);
    expect(loaded.numCrossExamQuestions).toBe(5);
  });

  test('should ignore unknown properties in config file', () => {
    const testConfig = {
      timeLimit: 120,
      unknownProperty: 'should be ignored',
      anotherUnknown: 42
    };
    
    fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));
    
    const loaded = configManager.loadFromFile(testConfigPath);
    
    expect(loaded.timeLimit).toBe(120);
    expect((loaded as any).unknownProperty).toBeUndefined();
    expect((loaded as any).anotherUnknown).toBeUndefined();
  });
});

describe('ConfigurationManager - Environment Variables', () => {
  let configManager: ConfigurationManager;
  con