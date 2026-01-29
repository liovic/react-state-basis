// tests/engine.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __testEngine__, history } from '../src/engine';
import * as UI from '../src/core/logger';
import { WINDOW_SIZE } from '../src/core/constants';

const { registerVariable, recordUpdate, configureBasis, instance } = __testEngine__;

describe('State Engine Core (v0.5.x)', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        history.clear();
        instance.tick = 0;
        instance.isBatching = false;
        instance.loopCounters.clear();
        instance.pausedVariables.clear();
        vi.useFakeTimers();
    });

    it('Activity Guard: remains silent if variables update only once', async () => {
        const spy = vi.spyOn(UI, 'displayRedundancyAlert');
        registerVariable('v1');
        registerVariable('v2');
        recordUpdate('v1');
        recordUpdate('v2');

        await vi.runAllTimersAsync();
        expect(spy).not.toHaveBeenCalled();
    });

    it('prevents infinite loops (v0.5.x Hard Breaker)', () => {
        vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => { });
        registerVariable('loop');

        for (let i = 0; i < 150; i++) {
            expect(recordUpdate('loop')).toBe(true);
        }

        expect(recordUpdate('loop')).toBe(false);

        expect(recordUpdate('loop')).toBe(false);
    });

    it('batches multiple updates into a single temporal tick', async () => {
        registerVariable('a');
        recordUpdate('a');
        recordUpdate('a');

        await vi.runAllTimersAsync();

        const meta = history.get('a')!;
        const lastIdx = (meta.head - 1 + WINDOW_SIZE) % WINDOW_SIZE;
        expect(meta.buffer[lastIdx]).toBe(1);
    });
});