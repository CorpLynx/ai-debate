import { LocalModelProvider } from '../../src/providers/LocalModelProvider';
import { DebateContext } from '../../src/models/DebateContext';
import { Position } from '../../src/models/Position';
import { RoundType } from '../../src/models/RoundType';

// Mock fetch globally
global.fetch = jest.fn();

describe('LocalModelProvider', () => {
  let provider: LocalModelProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should throw error if base URL is missing', () => {
      expect(() => {
        new LocalModelProvider({ baseUrl: '', model: 'llama2' });
      }).toThrow('Base URL is required for local model provider');
    });

    it('should throw error if model name is missing', () => {
      expect(() => {
        new LocalModelProvider({ baseUrl: 'http://localhost:11434', model: '' });
      }).toThrow('Model name is required for local model provider');
    });

    it('should use default values when not provided', () => {
      const defaultProvider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
      });
      expect(defaultProvider.getModelName()).toBe('Local-llama2');
    });

    it('should remove trailing slash from base URL', () => {
      const provider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434/',
        model: 'llama2',
      });
      expect(provider.getModelName()).toBe('Local-llama2');
    });

    it('should use custom model when provided', () => {
      const customProvider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434',
        model: 'mistral',
      });
      expect(customProvider.getModelName()).toBe('Local-mistral');
    });
  });

  describe('generateResponse - Ollama format', () => {
    const mockContext: DebateContext = {
      topic: 'Should AI be regulated?',
      position: Position.AFFIRMATIVE,
      roundType: RoundType.OPENING,
      previousStatements: [],
    };

    beforeEach(() => {
      provider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        maxTokens: 500,
        temperature: 0.7,
        apiFormat: 'ollama',
      });
    });

    it('should generate response successfully with Ollama format', async () => {
      const mockResponse = 'This is a test response from Ollama';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: mockResponse }),
      });

      const response = await provider.generateResponse('Generate opening statement', mockContext);

      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('llama2'),
        })
      );
    });

    it('should trim whitespace from response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: '  Response with whitespace  \n' }),
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

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'Response' }),
      });

      await provider.generateResponse('Test prompt', contextWithStatements);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.prompt).toContain('Previous statements in this debate');
      expect(body.prompt).toContain('Previous statement');
    });

    it('should include preparation material in system prompt', async () => {
      const contextWithPrep: DebateContext = {
        ...mockContext,
        preparationMaterial: 'Research notes and arguments',
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ response: 'Response' }),
      });

      await provider.generateResponse('Test prompt', contextWithPrep);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.prompt).toContain('Your preparation materials');
      expect(body.prompt).toContain('Research notes and arguments');
    });

    it('should throw error when no response is generated', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('No response generated from local model');
    });

    it('should handle HTTP errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('Local model API error: HTTP 500: Internal Server Error');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('Local model API error: Network error');
    });

    it('should handle timeout errors', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const error = new Error('Timeout');
            error.name = 'AbortError';
            reject(error);
          }, 1000);
        });
      });

      const promise = provider.generateResponse('Test prompt', mockContext);
      
      // Fast-forward time to trigger timeout
      jest.advanceTimersByTime(120000);

      await expect(promise).rejects.toThrow('Request timeout after 120000ms');
    });
  });

  describe('generateResponse - OpenAI-compatible format', () => {
    const mockContext: DebateContext = {
      topic: 'Should AI be regulated?',
      position: Position.AFFIRMATIVE,
      roundType: RoundType.OPENING,
      previousStatements: [],
    };

    beforeEach(() => {
      provider = new LocalModelProvider({
        baseUrl: 'http://localhost:1234',
        model: 'local-model',
        maxTokens: 500,
        temperature: 0.7,
        apiFormat: 'openai-compatible',
      });
    });

    it('should generate response successfully with OpenAI-compatible format', async () => {
      const mockResponse = 'This is a test response from LM Studio';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: mockResponse,
              },
            },
          ],
        }),
      });

      const response = await provider.generateResponse('Generate opening statement', mockContext);

      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should include system and user messages', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
        }),
      });

      await provider.generateResponse('Test prompt', mockContext);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[1].role).toBe('user');
    });

    it('should throw error when no response is generated', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      await expect(
        provider.generateResponse('Test prompt', mockContext)
      ).rejects.toThrow('No response generated from local model');
    });
  });

  describe('getModelName', () => {
    it('should return correct model name for Ollama', () => {
      const provider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
      });
      expect(provider.getModelName()).toBe('Local-llama2');
    });

    it('should return correct model name for custom model', () => {
      const provider = new LocalModelProvider({
        baseUrl: 'http://localhost:1234',
        model: 'mistral-7b',
      });
      expect(provider.getModelName()).toBe('Local-mistral-7b');
    });
  });

  describe('validateAvailability', () => {
    it('should return true when Ollama server is available', async () => {
      const provider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        apiFormat: 'ollama',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return true when OpenAI-compatible server is available', async () => {
      const provider = new LocalModelProvider({
        baseUrl: 'http://localhost:1234',
        model: 'local-model',
        apiFormat: 'openai-compatible',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/models',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return false when server is unavailable', async () => {
      const provider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(false);
    });

    it('should return false on network errors', async () => {
      const provider = new LocalModelProvider({
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const isAvailable = await provider.validateAvailability();

      expect(isAvailable).toBe(false);
    });
  });
});
