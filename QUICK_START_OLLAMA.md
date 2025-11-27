# Quick Start: Test with Ollama

## One-Command Setup

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Pull at least one model and run test
ollama pull llama2 && \
npm install && \
npm run build && \
npx ts-node test-ollama.ts

# Optional: Pull a second model for more interesting debates
ollama pull mistral
```

## Step-by-Step

### 1. Start Ollama
```bash
ollama serve
```
Leave this running in a terminal.

### 2. Pull at least one model (in a new terminal)
```bash
# Minimum: one model (will be used for both sides)
ollama pull llama2

# Better: two models (for more interesting debates)
ollama pull mistral
```

### 3. Build and Run
```bash
npm install
npm run build
npx ts-node test-ollama.ts
```

## Expected Output

You should see:
```
🎯 Starting Ollama Debate Test

Checking Ollama availability...
Fetching available models...
✅ Found 2 model(s): llama2, mistral
ℹ️  Using two different models for the debate
✅ Models initialized

📋 Topic: Artificial intelligence will benefit humanity more than harm it
📋 Affirmative: Local-llama2
📋 Negative: Local-mistral

📢 Opening Statements
════════════════════════════════════════════════════════════════════════════════
[AFFIRMATIVE - Local-llama2]
[Opening Statement]
...

✅ Debate completed successfully!
```

## Customize the Test

Edit `test-ollama.ts` to change:

- **Topic**: Search for `const topic =`
  ```typescript
  const topic = 'Your debate topic here';
  ```

- **Word Limit**: Search for `wordLimit:`
  ```typescript
  wordLimit: 200,
  ```

- **Timeout**: Search for `timeout:`
  ```typescript
  timeout: 120000,  // 2 minutes for slower models
  ```

The script automatically detects and uses available models!

## Available Ollama Models

Popular models for debates:
- `llama2` - Good general purpose
- `llama3` - Better reasoning (if you have it)
- `mistral` - Fast and capable
- `phi` - Smaller, faster
- `gemma` - Google's model

List your installed models:
```bash
ollama list
```

## Troubleshooting

**"Ollama models not available"**
→ Make sure `ollama serve` is running

**"Model not found"**
→ Pull the model: `ollama pull <model-name>`

**Slow responses**
→ Normal for local models. Wait 30-60 seconds per response.

**Out of memory**
→ Use smaller models like `phi` or `gemma:2b`
