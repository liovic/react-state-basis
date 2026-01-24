// tests/math.test.ts

import { describe, it, expect } from 'vitest';
import { calculateSimilarityCircular } from '../src/core/math';

describe('High-Performance Circular Math (v0.4.2)', () => {
    it('returns 1 for perfectly aligned circular signals', () => {
        const a = new Uint8Array([1, 0, 0, 0, 0]);
        const b = new Uint8Array([0, 1, 0, 0, 0]);

        const sync = calculateSimilarityCircular(a, 0, b, 0, 0);
        expect(sync).toBe(0);

        const lead = calculateSimilarityCircular(a, 0, b, 0, 1);
        expect(lead).toBeCloseTo(1, 5);
    });

    it('verifies head-pointer independence', () => {
        const a = new Uint8Array([1, 0, 0]);
        const b = new Uint8Array([0, 0, 1]);

        const result = calculateSimilarityCircular(a, 0, b, 2, 0);
        expect(result).toBeCloseTo(1, 5);
    });

    it('handles empty/zero signals without NaN', () => {
        const a = new Uint8Array([0, 0, 0]);
        const b = new Uint8Array([0, 0, 0]);
        expect(calculateSimilarityCircular(a, 0, b, 0, 0)).toBe(0);
    });

    it('handles logical wraparound across the buffer boundary', () => {
        const L = 5;
        const a = new Uint8Array([1, 0, 0, 0, 0]);
        const b = new Uint8Array([0, 0, 0, 0, 1]);

        const match = calculateSimilarityCircular(a, 0, b, 0, -1);
        expect(match).toBeCloseTo(1, 5);
    });
});