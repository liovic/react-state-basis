// tests/safety.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __testEngine__ } from '../src/engine';
import * as UI from '../src/core/logger';

const { registerVariable, recordUpdate, configureBasis, instance } = __testEngine__;

describe('Engine: Circuit Breaker Path', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        instance.loopCounters.clear();
        instance.pausedVariables.clear();
        instance.lastCleanup = Date.now();

        vi.clearAllMocks();
    });

    it('triggers displayViolentBreaker on loop', () => {
        const spy = vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => { });

        const label = 'bad_loop';
        registerVariable(label);

        // 3. Force 151 updates (Breaker threshold is 150)
        // This loop happens in the same 'millisecond' in test time
        for (let i = 0; i < 151; i++) {
            recordUpdate(label);
        }

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('bad_loop'),
            151,
            150
        );

        expect(instance.pausedVariables.has(label)).toBe(true);

        expect(recordUpdate(label)).toBe(false);

        spy.mockRestore();
    });
});