import { MockAIProvider } from '../../src/providers/MockAIProvider';
import { DebateContext } from '../../src/models/DebateContext';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

describe('MockAIProvider', () => {
  let provider: MockAIProvider;
  let context: DebateContext;

  beforeEach(() => {
    provider = new MockAIProvider('TestModel');
    context = {
      topic: 'Test Topic',
      position: Position.AFFIRMATIVE,
      roundType: RoundType.OPENING,
      previousStatements: [],
    };
  });

  describe('getModelName', () => {
    it('should return the configured model name', () => {
      expect(provider.getModelName()).toBe('TestModel');
    });

    it('should return default model name when not specified', () => {
      const defaultProvider = new MockAIProvider();
      expect(defaultProvider.getModelName()).toBe('MockModel');
    });
  });

  describe('validateAvailability', () => {
    it('should return true by default', async () => {
      const available = await provider.validateAvailability();
      expect(available).toBe(true);
    });

    it('should return false when configured as unavailable', async () => {
      const unavailableProvider = new MockAIProvider('TestModel', { available: false });
      const available = await unavailableProvider.validateAvailability();
      expect(available).toBe(false);
    });

    it('should allow changing availability', async () => {
      provider.setAvailable(false);
      expect(await provider.validateAvailability()).toBe(false);
      
      provider.setAvailable(true);
      expect(await provider.validateAvailability()).toBe(true);
    });
  });

  describe('generateResponse', () => {
    it('should return default response when no specific response configured', async () => {
      const response = await provider.generateResponse('test prompt', context);
      expect(response).toBe('Mock response from TestModel');
    });

    it('should return custom default response when configured', async () => {
      const customProvider = new MockAIProvider('TestModel', {
        defaultResponse: 'Custom default response',
      });
      const response = await customProvider.generateResponse('test prompt', context);
      expect(response).toBe('Custom default response');
    });

    it('should return specific response for exact prompt match', async () => {
      provider.setResponse('specific prompt', 'Specific response');
      const response = await provider.generateResponse('specific prompt', context);
      expect(response).toBe('Specific response');
    });

    it('should return response based on round type', async () => {
      provider.setResponse(RoundType.OPENING, 'Opening statement response');
      const response = await provider.generateResponse('any prompt', context);
      expect(response).toBe('Opening statement response');
    });

    it('should return response based on position', async () => {
      provider.setResponse(Position.AFFIRMATIVE, 'Affirmative response');
      const response = await provider.generateResponse('any prompt', context);
      expect(response).toBe('Affirmative response');
    });

    it('should prioritize exact prompt match over round type', async () => {
      provider.setResponse('exact prompt', 'Exact match');
      provider.setResponse(RoundType.OPENING, 'Round type match');
      const response = await provider.generateResponse('exact prompt', context);
      expect(response).toBe('Exact match');
    });

    it('should throw error when configured to fail', async () => {
      provider.setShouldFail(true, 'Test failure');
      await expect(provider.generateResponse('test prompt', context)).rejects.toThrow('Test failure');
    });

    it('should use default failure message when not specified', async () => {
      provider.setShouldFail(true);
      await expect(provider.generateResponse('test prompt', context)).rejects.toThrow('Mock provider failure');
    });
  });

  describe('configuration methods', () => {
    it('should allow setting default response', async () => {
      provider.setDefaultResponse('New default');
      const response = await provider.generateResponse('test', context);
      expect(response).toBe('New default');
    });

    it('should allow resetting provider state', async () => {
      provider.setResponse('key', 'value');
      provider.setShouldFail(true);
      provider.setAvailable(false);
      
      provider.reset();
      
      expect(await provider.validateAvailability()).toBe(true);
      const response = await provider.generateResponse('key', context);
      expect(response).toBe('Mock response from TestModel');
    });
  });

  describe('constructor with responses map', () => {
    it('should use pre-configured responses', async () => {
      const responses = new Map<string, string>();
      responses.set('prompt1', 'response1');
      responses.set(RoundType.REBUTTAL, 'rebuttal response');
      
      const configuredProvider = new MockAIProvider('TestModel', { responses });
      
      expect(await configuredProvider.generateResponse('prompt1', context)).toBe('response1');
      
      const rebuttalContext = { ...context, roundType: RoundType.REBUTTAL };
      expect(await configuredProvider.generateResponse('any', rebuttalContext)).toBe('rebuttal response');
    });
  });
});
