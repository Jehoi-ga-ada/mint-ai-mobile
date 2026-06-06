import { revealStep } from '../src/features/assistant/useTypewriter';

describe('revealStep', () => {
  test('keeps a smooth minimum speed near the tail', () => {
    expect(revealStep(1)).toBe(2);
    expect(revealStep(10)).toBe(2);
  });

  test('catches up proportionally when far behind', () => {
    expect(revealStep(120)).toBe(10);
    expect(revealStep(1200)).toBe(100);
  });
});
