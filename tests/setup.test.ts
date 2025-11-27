describe('Project Setup', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should be able to import core models', () => {
    const { Position, DebateState, RoundType } = require('../src/models');
    expect(Position.AFFIRMATIVE).toBe('affirmative');
    expect(DebateState.INITIALIZED).toBe('initialized');
    expect(RoundType.OPENING).toBe('opening');
  });
});
