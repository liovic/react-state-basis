// tests/reports.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __testEngine__ } from '../src/engine';

const { registerVariable, recordUpdate, printBasisHealthReport, history, configureBasis } = __testEngine__;

describe('Health Reports & Clustering (v0.4.2)', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        history.clear();

        vi.useFakeTimers();

        if (typeof window !== 'undefined') {
            (window as any).requestIdleCallback = vi.fn((cb) => cb());
        }
    });

    it('identifies independent vs clustered variables', async () => {
        global.window = window;
        global.document = window.document;

        const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });

        configureBasis({ debug: true });

        registerVariable('var_a');
        registerVariable('var_b');

        recordUpdate('var_a');
        recordUpdate('var_b');

        await vi.runAllTimersAsync();

        printBasisHealthReport();

        expect(groupSpy).toHaveBeenCalled();
        groupSpy.mockRestore();
    });
});