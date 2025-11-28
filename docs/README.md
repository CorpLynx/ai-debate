# AI Debate System - Documentation

This documentation describes the current state of the AI Debate System project.

## Table of Contents

1. [Project Overview](./project-overview.md)
2. [Architecture](./architecture.md)
3. [Data Models](./data-models.md)
4. [AI Providers](./ai-providers.md)
5. [Debate Orchestrator](./debate-orchestrator.md)
6. [CLI Interface](./cli-interface.md)
7. [Configuration](./configuration.md)
8. [Transcript Management](./transcript-management.md)
9. [Testing](./testing.md)
10. [Current Status](./current-status.md)

### Implementation Notes
- [Statement Display Implementation](./statement-display-implementation.md) - Details on the statement display feature

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run a debate (mock mode for testing)
npm run cli -- "Should AI be regulated?" --mock
```

## Project Structure

```
ai-debate/
├── src/
│   ├── cli/              # Command-line interface
│   ├── models/           # Data type definitions
│   ├── orchestrator/     # Debate coordination logic
│   ├── prompts/          # AI prompt templates
│   ├── providers/        # AI model integrations
│   ├── transcript/       # Transcript generation/storage
│   ├── utils/            # Utility functions
│   └── validators/       # Validation logic
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── properties/       # Property-based tests
├── examples/             # Demo scripts
├── docs/                 # Documentation (this folder)
└── transcripts/          # Saved debate transcripts
```
