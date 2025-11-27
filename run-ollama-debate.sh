#!/bin/bash

# Quick script to run an Ollama debate
# Usage: ./run-ollama-debate.sh [topic]

set -e

TOPIC="${1:-Artificial intelligence will benefit humanity more than harm it}"

echo "🚀 Running Ollama Debate"
echo "Topic: $TOPIC"
echo ""

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "❌ Ollama is not running!"
    echo ""
    echo "Please start Ollama in another terminal:"
    echo "  ollama serve"
    exit 1
fi

# Check for available models
MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -5)
MODEL_COUNT=$(echo "$MODELS" | wc -l | tr -d ' ')

if [ -z "$MODELS" ]; then
    echo "❌ No models found in Ollama!"
    echo ""
    echo "Please pull at least one model:"
    echo "  ollama pull llama2"
    exit 1
fi

echo "✅ Found $MODEL_COUNT model(s) in Ollama"
echo ""

# Build if needed
if [ ! -d "dist" ]; then
    echo "Building project..."
    npm run build
    echo ""
fi

# Run the test
npx ts-node test-ollama.ts
