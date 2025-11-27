/**
 * Mock implementation of chalk for testing
 */

const identity = (str: string) => str;

const chalk = {
  // Color functions
  red: identity,
  green: identity,
  yellow: identity,
  blue: identity,
  magenta: identity,
  cyan: identity,
  white: identity,
  gray: identity,
  grey: identity,
  
  // Modifiers
  bold: identity,
  dim: identity,
  italic: identity,
  underline: identity,
  inverse: identity,
  hidden: identity,
  strikethrough: identity,
  
  // Chained functions
  'red.bold': identity,
  'green.bold': identity,
  'yellow.bold': identity,
  'blue.bold': identity,
  'cyan.bold': identity,
  'white.bold': identity,
};

// Add chaining support
Object.keys(chalk).forEach(key => {
  if (typeof chalk[key as keyof typeof chalk] === 'function') {
    const fn = chalk[key as keyof typeof chalk] as any;
    Object.keys(chalk).forEach(modifier => {
      fn[modifier] = identity;
    });
  }
});

export default chalk;
