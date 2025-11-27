#!/usr/bin/env ts-node

/**
 * Demo of enhanced StatementFormatter with rich text support
 * 
 * This demonstrates:
 * - Enhanced round headers with decorative elements (Requirement 2.1)
 * - Metadata styling distinct from content (Requirement 2.2)
 * - Visual statement separators (Requirement 2.3)
 * - Position-specific color coding (Requirement 2.4)
 * - Round progress display (Requirement 2.5)
 * - Consistent indentation and margins (Requirement 1.5)
 * - Rich text formatting (Requirements 5.1-5.5)
 */

import { formatStatement, createStatementSeparator } from '../src/utils/StatementFormatter';
import { Statement } from '../src/models/Statement';
import { Position } from '../src/models/Position';
import { RoundType } from '../src/models/RoundType';

console.log('\n=== Enhanced Statement Formatter Demo ===\n');

// Example 1: Opening statement with rich text
const affirmativeOpening: Statement = {
  model: 'GPT-4',
  position: Position.AFFIRMATIVE,
  content: `# Main Argument

I argue that **artificial intelligence** will fundamentally transform society in positive ways.

## Key Points

1. AI enhances human capabilities
2. AI solves complex problems
3. AI creates new opportunities

> "The question is not whether AI will change the world, but how we guide that change."

Consider the following:
- Medical diagnostics improved by *machine learning*
- Climate modeling enhanced by *neural networks*
- Education personalized through *adaptive systems*

\`\`\`
function transform(society) {
  return society + AI;
}
\`\`\`

This represents a **paradigm shift** in human progress.`,
  wordCount: 85,
  generatedAt: new Date()
};

console.log('Example 1: Affirmative Opening Statement with Rich Text\n');
console.log(formatStatement(affirmativeOpening, RoundType.OPENING, 2, 5));

// Separator between statements
console.log(createStatementSeparator());

// Example 2: Negative rebuttal
const negativeRebuttal: Statement = {
  model: 'Claude',
  position: Position.NEGATIVE,
  content: `# Counter-Argument

While AI offers benefits, we must consider the **significant risks** and challenges.

## Concerns

1. Job displacement and economic disruption
2. Privacy and surveillance concerns
3. Algorithmic bias and fairness

> "With great power comes great responsibility."

The opposing side overlooks:
- *Ethical implications* of autonomous systems
- *Security vulnerabilities* in AI systems
- *Concentration of power* in tech companies

We need **careful regulation** before widespread deployment.`,
  wordCount: 72,
  generatedAt: new Date()
};

console.log('Example 2: Negative Rebuttal with Rich Text\n');
console.log(formatStatement(negativeRebuttal, RoundType.REBUTTAL, 3, 5));

// Separator between statements
console.log(createStatementSeparator());

// Example 3: Simple closing statement
const affirmativeClosing: Statement = {
  model: 'GPT-4',
  position: Position.AFFIRMATIVE,
  content: `In conclusion, the benefits of AI outweigh the risks when properly managed.

We have shown that AI can enhance human capabilities, solve complex problems, and create opportunities.

The path forward requires collaboration between technologists, policymakers, and society.

Thank you.`,
  wordCount: 42,
  generatedAt: new Date()
};

console.log('Example 3: Affirmative Closing Statement\n');
console.log(formatStatement(affirmativeClosing, RoundType.CLOSING, 5, 5));

console.log('\n=== Demo Complete ===\n');
