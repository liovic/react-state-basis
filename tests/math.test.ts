// tests/math.test.ts
import { describe, it, expect } from 'vitest';
import { calculateSimilarityCircular } from '../src/core/math';
// import { performance } from 'perf_hooks';

describe('High-Performance Circular Math (v0.5.x)', () => {

    it('Core: Correctly calculates Dot Product and Magnitude (0.707)', () => {
        const a = new Uint8Array([1, 1, 0, 0]);
        const b = new Uint8Array([1, 0, 0, 0]);
        expect(calculateSimilarityCircular(a, 0, b, 0, 0)).toBeCloseTo(0.7071, 4);
    });

    it('Phase Sweep: Mathematically proves head-pointer independence', () => {
        const L = 50;
        const a = new Uint8Array(L).fill(0);
        const b = new Uint8Array(L).fill(0);
        a[25] = 1; // Pulse at arbitrary position

        // Test ALL combinations of head pointers
        for (let headA = 0; headA < L; headA++) {
            for (let headB = 0; headB < L; headB++) {
                b.fill(0);
                // Calculate where B's pulse should be to align with A
                const bPulseIdx = (headB + (25 - headA + L)) % L;
                b[bPulseIdx] = 1;

                const sim = calculateSimilarityCircular(a, headA, b, headB, 0);
                if (sim < 0.99) {
                    throw new Error(`Phase Fail at headA=${headA}, headB=${headB}, sim=${sim}`);
                }
            }
        }
    });

    it('Boundary Wrap: Correctly tracks lead-lag across the ring-buffer seam', () => {
        const a = new Uint8Array(50).fill(0); a[49] = 1; // End of array
        const b = new Uint8Array(50).fill(0); b[0] = 1;  // Start of array
        // B follows A logically
        expect(calculateSimilarityCircular(a, 0, b, 0, 1)).toBeCloseTo(1, 5);
        // Reverse lag
        expect(calculateSimilarityCircular(a, 0, b, 0, -49)).toBeCloseTo(1, 5);
    });

    it('Symmetry: offset +1 on (A,B) must equal offset -1 on (B,A)', () => {
        const a = new Uint8Array(50).fill(0); a[10] = 1;
        const b = new Uint8Array(50).fill(0); b[11] = 1;
        const forward = calculateSimilarityCircular(a, 0, b, 0, 1);
        const backward = calculateSimilarityCircular(b, 0, a, 0, -1);
        expect(forward).toBe(backward);
        expect(forward).toBeCloseTo(1, 5);
    });

    it('Robustness: Correctly wraps offsets larger than buffer size (L=50)', () => {
        const a = new Uint8Array(50).fill(0); a[0] = 1;
        const b = new Uint8Array(50).fill(0); b[10] = 1;
        expect(calculateSimilarityCircular(a, 0, b, 0, 10)).toBeCloseTo(1, 5);
        expect(calculateSimilarityCircular(a, 0, b, 0, 60)).toBeCloseTo(1, 5);  // 10 + 50
        expect(calculateSimilarityCircular(a, 0, b, 0, -40)).toBeCloseTo(1, 5); // 10 - 50
    });

    it('Heuristic Jitter: Remains stable despite 10% signal noise', () => {
        const a = new Uint8Array(10).fill(1); // 10 pulses
        const b = new Uint8Array(10).fill(1);
        b[9] = 0; // Drop one pulse
        const sim = calculateSimilarityCircular(a, 0, b, 0, 0);
        expect(sim).toBeGreaterThan(0.88);
    });

    it('Safety: Prevents NaN/Inf on idle or flat signals', () => {
        const a = new Uint8Array(50).fill(0);
        const b = new Uint8Array(50).fill(1);
        expect(calculateSimilarityCircular(a, 0, b, 0, 0)).toBe(0);
    });
    it('Performance: Execution cost remains sub-millisecond per 100 calcs', () => {
        const a = new Uint8Array(50).fill(1);
        const b = new Uint8Array(50).fill(1);
        const startTime = performance.now();

        const iterations = 1000;
        for (let i = 0; i < iterations; i++) {
            calculateSimilarityCircular(a, i % 50, b, (i + 1) % 50, 0);
        }

        const elapsed = performance.now() - startTime;
        // 1000 calcs should be extremely fast. 
        // 10ms is a safe upper bound for slow CI environments.
        expect(elapsed).toBeLessThan(10);
    });
});