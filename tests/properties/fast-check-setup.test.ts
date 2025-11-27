import * as fc from 'fast-check';

describe('Fast-check Setup', () => {
  it('should have fast-check configured correctly', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n;
      }),
      { numRuns: 100 }
    );
  });

  it('should be able to generate strings', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        return typeof s === 'string';
      }),
      { numRuns: 100 }
    );
  });
});
