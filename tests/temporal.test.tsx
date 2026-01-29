// tests/temporal.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __testEngine__ } from '../src/engine';
import * as UI from '../src/core/logger';

const { registerVariable, recordUpdate, history, configureBasis } = __testEngine__;

describe('Temporal Lead-Lag Logic', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        history.clear();
        vi.useFakeTimers();
    });

    it('identifies Redundancy when updates are simultaneous', async () => {
        const spy = vi.spyOn(UI, 'displayRedundancyAlert');
        registerVariable('a');
        registerVariable('b');

        for (let i = 0; i < 5; i++) {
            recordUpdate('a');
            recordUpdate('b');
            await vi.runAllTimersAsync();
        }

        expect(spy).toHaveBeenCalledWith(
            'a', expect.any(Object),
            'b', expect.any(Object),
            expect.any(Number)
        );
        spy.mockRestore();
    });

    it('identifies Sync Leak when B follows A', async () => {
        const spy = vi.spyOn(UI, 'displayCausalHint');
        registerVariable('source_A');
        registerVariable('target_B');

        for (let i = 0; i < 10; i++) {
            recordUpdate('source_A');
            await vi.runAllTimersAsync();
            recordUpdate('target_B');
            await vi.runAllTimersAsync();
        }

        expect(spy).toHaveBeenCalledWith(
            'target_B', expect.any(Object),
            'source_A', expect.any(Object)
        );
        spy.mockRestore();
    });
});