# Project Overview

## Description

The AI Debate System is a TypeScript application that orchestrates formal debates between AI models. It enables two AI models to take opposing positions on a topic and engage in structured debate rounds including preparation, opening statements, rebuttals, cross-examination, and closing statements.

## Key Features

- **Multi-provider AI Support**: Integrates with OpenAI (GPT-4), Anthropic (Claude), and local models (Ollama, LM Studio)
- **Structured Debate Format**: Follows formal debate structure with distinct phases
- **Real-time Display**: Shows statements with color-coded formatting as they're generated
- **Transcript Generation**: Saves complete debate transcripts in JSON format
- **Configurable Parameters**: Word limits, time limits, strict mode, and more
- **Error Handling**: Robust error logging and partial transcript recovery
- **Property-based Testing**: Extensive test coverage using fast-check

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **AI SDKs**: @anthropic-ai/sdk, openai
- **CLI Framework**: Commander.js
- **Testing**: Jest, fast-check (property-based testing)
- **Build**: TypeScript compiler (tsc)

## Dependencies

### Production Dependencies
- `@anthropic-ai/sdk` (^0.71.0) - Anthropic Claude API client
- `openai` (^6.9.1) - OpenAI API client
- `commander` (^14.0.2) - CLI framework
- `uuid` (^13.0.0) - UUID generation
- `fast-check` (^3.15.0) - Property-based testing

### Development Dependencies
- `typescript` (^5.0.0)
- `jest` (^29.5.0)
- `ts-jest` (^29.1.0)
- `ts-node` (^10.9.0)
- Various `@types/*` packages

## Use Cases

1. **AI Model Comparison**: Compare how different AI models reason and argue
2. **Research**: Study AI argumentation and debate capabilities
3. **Education**: Demonstrate structured debate formats
4. **Entertainment**: Generate engaging debates on interesting topics
