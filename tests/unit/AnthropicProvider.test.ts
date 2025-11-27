import { AnthropicProvider } from '../../src/providers/AnthropicProvider';
import { DebateContext } from '../../src/models/DebateContext';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((config) => {
      return {
        messages: {
          create: jest.fn(),
        },
        apiKey: config.apiKey,
        timeout: config.timeout,
        maxRetries: config.maxRetries,
      };
    }),
  };
});

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;
  let mockClient: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create provider with test API key
    provider = new AnthropicProvider({
      apiKey: 'test-api-key',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 500,
      temperature: 0.7,
    });

    // Get the mocked client instance
    const Anthropic = require('@anthropic-ai/sdk').default;
    mockClient = Anthropic.mock.results[Anthropic.mock.results.length - 1].value;
  });

  describe('constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => {
        new AnthropicProvider({ apiKey: '' });
      }).toThrow('Anthropic API key is required');
    });

    it('should use default values when not provided', () => {
      const defaultProvider = new AnthropicProvider({ apiKey: 'test-key' });
      expect(defaultProvider.getModelName()).toBe('Anthropic-claude-3-5-sonnet-20241022');
    });

    it('should use custom model when provided', () => {
      const customProvider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      });
      expect(customProvider.getModelName()).toBe('Anthropic-claude-3-opus-20240229');
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
      const mockResponse = 'This is a test response from Anthropic';
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: mockResponse,
          },
        ],
      });

      const response = await provider.generateResponse('Generate opening statement', mockContext);

      expect(response).toBe(mockResponse);
      expect(mockClient.messages.create).toHaveBeenCalledTimes(1);
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          temperature: 0.7,
          system: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should trim whitespace from response', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '  Response with whitespace  \n',
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

      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Response' }],
      });

      await provider.generateResponse('Test prompt', contextWithStatements);

      const callArgs = mockClient.messages.create.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).toContain('Previous statements in this debate');
      expect(userMessage.content).toContain('Previous statement');
    });

    it('should include preparation material in system prompt', async () => {
      const contextWithPrep: DebateContext = {
        ...mockContext,
        preparationMaterial: 'Research notes and arguments',
      };

      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'Response' }],
      });

      await provider.generateResponse('Test prompt', contextWithPrep);

      const callArgs = mockClient.messages.create.mock.calls[0][0];
      expect(callArgs.system).toContain('Your preparation materials');
      expect(callArgs.system).toContain('Research notes and arguments');
    });

    it('should throw error when response type is not text', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [
          {
            type: 'image',
            data: 'base64data',
          },
        ],
      });

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('Unexpected response type from Anthropic');
    });

    it('should handle API errors gracefully', async () => {
      mockClient.messages.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('Anthropic API error: API rate limit exceeded');
    });

    it('should handle unknown errors', async () => {
      mockClient.messages.create.mockRejectedValue('Unknown error');

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('Unknown error occurred while calling Anthropic API');
    });

    it('should retry on failure based on maxRetries config', async () => {
      // The Anthropic SDK handles retries internally based on maxRetries config
      // We just verify the config is passed correctly
      const retryProvider = new AnthropicProvider({
        apiKey: 'test-key',
        maxRetries: 3,
      });

      const Anthropic = require('@anthropic-ai/sdk').default;
      const lastCall = Anthropic.mock.calls[Anthropic.mock.calls.length - 1][0];
      expect(lastCall.maxRetries).toBe(3);
    });
  });

  describe('getModelName', () => {
    it('should return correct model name', () => {
      expect(provider.getModelName()).toBe('Anthropic-claude-3-5-sonnet-20241022');
    });

    it('should include custom model name', () => {
      const customProvider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      });
      expect(customProvider.getModelName()).toBe('Anthropic-claude-3-opus-20240229');
    });
  });

  describe('validateAvailability', () => {
    it('should return true when API is available', async () => {
      mockClient.messages.create.mockResolvedValue({
        content: [{ type: 'text', text: 'test' }],
      });

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(true);
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        })
      );
    });

    it('should return false when API is unavailable', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('Invalid API key'));

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(false);
    });

    it('should return false on network errors', async () => {
      mockClient.messages.create.mockRejectedValue(new Error('Network error'));

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(false);
    });
  });
});
