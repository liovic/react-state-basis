// tests/math.test.ts

import { describe, it, expect } from 'vitest';
import { calculateSimilarityWithOffset } from '../src/core/math';

describe('High-Performance Offset Math', () => {
  it('returns 1 for perfectly aligned offset signals', () => {
    const a = [1, 0, 1, 0, 0];
    const b = [0, 1, 0, 1, 0];
    
    const sync = calculateSimilarityWithOffset(a, b, 0, 0, 5);
    expect(sync).toBe(0);

    const lag = calculateSimilarityWithOffset(a, b, 0, 1, 4);
    expect(lag).toBeCloseTo(1, 10); 
  });

  it('handles empty/zero signals without NaN', () => {
    const a = [0, 0, 0];
    const b = [0, 0, 0];
    expect(calculateSimilarityWithOffset(a, b, 0, 0, 3)).toBe(0);
  });
});