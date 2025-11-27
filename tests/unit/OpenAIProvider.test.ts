import { OpenAIProvider } from '../../src/providers/OpenAIProvider';
import { DebateContext } from '../../src/models/DebateContext';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

// Mock the OpenAI SDK
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((config) => {
      return {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
        models: {
          retrieve: jest.fn(),
        },
        apiKey: config.apiKey,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      };
    }),
  };
});

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;
  let mockClient: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create provider with test API key
    provider = new OpenAIProvider({
      apiKey: 'test-api-key',
      model: 'gpt-4',
      maxTokens: 500,
      temperature: 0.7,
    });

    // Get the mocked client instance
    const OpenAI = require('openai').default;
    mockClient = OpenAI.mock.results[OpenAI.mock.results.length - 1].value;
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => {
        new OpenAIProvider({ apiKey: '' });
      }).toThrow('OpenAI API key is required');
    });

    it('should use default values when not provided', () => {
      const defaultProvider = new OpenAIProvider({ apiKey: 'test-key' });
      expect(defaultProvider.getModelName()).toBe('OpenAI-gpt-4');
    });

    it('should use custom model when provided', () => {
      const customProvider = new OpenAIProvider({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });
      expect(customProvider.getModelName()).toBe('OpenAI-gpt-3.5-turbo');
    });
  });

  describe('generateResponse', () => {
    const mockContext: DebateContext = {
      topic: 'Should AI be regulated?',
      position: Position.AFFIRMATIVE,
      roundType: RoundType.OPENING,
      previousStatements: [],
    };

    it('should generate response successfully', async () => {
      const mockResponse = 'This is a test response from OpenAI';
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockResponse,
            },
          },
        ],
      });

      const response = await provider.generateResponse('Generate opening statement', mockContext);

      expect(response).toBe(mockResponse);
      expect(mockClient.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          max_tokens: 500,
          temperature: 0.7,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should trim whitespace from response', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '  Response with whitespace  \n',
            },
          },
        ],
      });

      const response = await provider.generateResponse('Test prompt', mockContext);

      expect(response).toBe('Response with whitespace');
    });

    it('should include previous statements in context', async () => {
      const contextWithStatements: DebateContext = {
        ...mockContext,
        previousStatements: [
          {
            model: 'TestModel',
            position: Position.NEGATIVE,
            content: 'Previous statement',
            wordCount: 2,
            generatedAt: new Date(),
          },
        ],
      };

      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await provider.generateResponse('Test prompt', contextWithStatements);

      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('Previous statements in this debate');
      expect(userMessage.content).toContain('Previous statement');
    });

    it('should include preparation material in system prompt', async () => {
      const contextWithPrep: DebateContext = {
        ...mockContext,
        preparationMaterial: 'Research notes and arguments',
      };

      mockClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
      });

      await provider.generateResponse('Test prompt', contextWithPrep);

      const callArgs = mockClient.chat.completions.create.mock.calls[0][0];
      const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');
      expect(systemMessage.content).toContain('Your preparation materials');
      expect(systemMessage.content).toContain('Research notes and arguments');
    });

    it('should throw error when no response is generated', async () => {
      mockClient.chat.completions.create.mockResolvedValue({
        choices: [],
      });

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('No response generated from OpenAI');
    });

    it('should handle API errors gracefully', async () => {
      mockClient.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('OpenAI API error: API rate limit exceeded');
    });

    it('should handle unknown errors', async () => {
      mockClient.chat.completions.create.mockRejectedValue('Unknown error');

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('Unknown error occurred while calling OpenAI API');
    });

    it('should retry on failure based on maxRetries config', async () => {
      // The OpenAI SDK handles retries internally based on maxRetries config
      // We just verify the config is passed correctly
      const retryProvider = new OpenAIProvider({
        apiKey: 'test-key',
        maxRetries: 3,
      });

      const OpenAI = require('openai').default;
      const lastCall = OpenAI.mock.calls[OpenAI.mock.calls.length - 1][0];
      expect(lastCall.maxRetries).toBe(3);
    });
  });

  describe('getModelName', () => {
    it('should return correct model name', () => {
      expect(provider.getModelName()).toBe('OpenAI-gpt-4');
    });

    it('should include custom model name', () => {
      const customProvider = new OpenAIProvider({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });
      expect(customProvider.getModelName()).toBe('OpenAI-gpt-3.5-turbo');
    });
  });

  describe('validateAvailability', () => {
    it('should return true when API is available', async () => {
      mockClient.models.retrieve.mockResolvedValue({ id: 'gpt-4' });

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(true);
      expect(mockClient.models.retrieve).toHaveBeenCalledWith('gpt-4');
    });

    it('should return false when API is unavailable', async () => {
      mockClient.models.retrieve.mockRejectedValue(new Error('Invalid API key'));

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(false);
    });

    it('should return false on network errors', async () => {
      mockClient.models.retrieve.mockRejectedValue(new Error('Network error'));

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(false);
    });
  });
});
