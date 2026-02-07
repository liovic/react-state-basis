// tests/temporal.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { __testEngine__, beginEffectTracking, endEffectTracking } from '../src/engine';
import * as UI from '../src/core/logger';

const { registerVariable, recordUpdate, history, configureBasis, instance } = __testEngine__;

describe('Temporal Lead-Lag Logic (v0.6.x)', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        history.clear();
        instance.graph.clear();
        instance.violationMap.clear();
        instance.tick = 0;

        // Reset implicit event tracking
        instance.currentEffectSource = null;
        instance.lastStateUpdate = null;

        vi.useFakeTimers();
        // Stub rAF to run immediately to ensure heartbeats process in tests
        vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb(performance.now()));
        // Stub rIC to run immediately
        vi.stubGlobal('requestIdleCallback', (cb: Function) => cb({
            timeRemaining: () => 10,
            didTimeout: false
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('identifies Redundancy when updates are simultaneous', async () => {
        const spy = vi.spyOn(UI, 'displayRedundancyAlert');
        registerVariable('a');
        registerVariable('b');

        // Simultaneous pulses (Sync Plane)
        for (let i = 0; i < 5; i++) {
            recordUpdate('a');
            recordUpdate('b');
            // Force analysis cycle
            await vi.runAllTimersAsync();
        }

        expect(spy).toHaveBeenCalledWith(
            'a', expect.any(Object),
            'b', expect.any(Object),
            expect.any(Number)
        );
    });

    it('identifies Sync Leak when B follows A', async () => {
        const spy = vi.spyOn(UI, 'displayCausalHint');
        registerVariable('source_A');
        registerVariable('target_B');
        // Register the root to ensure metadata exists for the "Instant Hint" check
        registerVariable('ROOT_SYSTEM_INIT');

        // Simulate 'source_A' driven by an Effect to pass the "Event Driven" filter.
        beginEffectTracking('ROOT_SYSTEM_INIT');

        // Loop enough times to build high density (Confidence > 2)
        for (let i = 0; i < 20; i++) {
            // T=0: A updates
            recordUpdate('source_A');
            // Ensure heartbeat processes A
            await vi.runAllTimersAsync();

            // T=1: B updates (Lagging A)
            recordUpdate('target_B');
            // Ensure heartbeat processes B and Analysis runs
            await vi.runAllTimersAsync();
        }

        endEffectTracking();

        // The spy will be called many times with (target_B, ROOT).
        // We specifically check that it was ALSO called with (target_B, source_A)
        // which proves the Statistical Analyzer found the causal link.
        expect(spy).toHaveBeenCalledWith(
            'target_B', expect.any(Object),
            'source_A', expect.any(Object)
        );
    });
});
