import { RichTextFormatter } from '../src/utils/RichTextFormatter';
import { DEFAULT_COLOR_SCHEME } from '../src/models/ColorScheme';
import { DEFAULT_FORMATTING_RULES } from '../src/models/FormattingRules';

/**
 * Demo of RichTextFormatter capabilities
 */
function demonstrateRichTextFormatting() {
  const formatter = new RichTextFormatter(DEFAULT_COLOR_SCHEME, DEFAULT_FORMATTING_RULES);

  console.log('\n=== Rich Text Formatter Demo ===\n');

  // Example 1: Headers
  console.log('--- Headers ---');
  const headerText = `# Main Title
## Subtitle
### Section Header`;
  console.log(formatter.formatRichText(headerText));

  // Example 2: Lists
  console.log('\n--- Lists ---');
  const listText = `Shopping List:
- Apples
- Bananas
- Oranges

Steps:
1. First step
2. Second step
3. Third step`;
  console.log(formatter.formatRichText(listText));

  // Example 3: Quotes
  console.log('\n--- Quotes ---');
  const quoteText = `As someone once said:

> To be or not to be, that is the question.
> Whether 'tis nobler in the mind to suffer.

And that's profound.`;
  console.log(formatter.formatRichText(quoteText));

  // Example 4: Emphasis
  console.log('\n--- Emphasis ---');
  const emphasisText = `This text has **bold** and *italic* formatting.
You can also use __bold__ and _italic_ with underscores.`;
  console.log(formatter.formatRichText(emphasisText));

  // Example 5: Code
  console.log('\n--- Code ---');
  const codeText = `Use the \`console.log()\` function to print output.

Here's a code block:

\`\`\`
function greet(name) {
  console.log("Hello, " + name);
}
\`\`\`

That's how you define a function.`;
  console.log(formatter.formatRichText(codeText));

  // Example 6: Combined formatting
  console.log('\n--- Combined Formatting ---');
  const combinedText = `# AI Debate Analysis

## Key Arguments

The **affirmative** position made several strong points:

- Economic benefits are *significant*
- Implementation is feasible
- Long-term sustainability is proven

> The data clearly shows a positive trend.

However, the code analysis reveals:

\`\`\`
if (benefits > costs) {
  return "Proceed";
}
\`\`\`

### Conclusion

Both sides presented **compelling** arguments with *nuanced* perspectives.`;
  console.log(formatter.formatRichText(combinedText));

  console.log('\n=== End of Demo ===\n');
}

// Run the demo
if (require.main === module) {
  demonstrateRichTextFormatting();
}

export { demonstrateRichTextFormatting };
