// tests/reports.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __testEngine__ } from '../src/engine';
import { SignalRole } from '../src/core/types';

const { registerVariable, recordUpdate, printBasisHealthReport, history, configureBasis } = __testEngine__;

describe('Health Reports & Clustering (v0.5.x)', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        history.clear();
        vi.stubGlobal('requestIdleCallback', (cb: any) => cb());

        vi.useFakeTimers();

        if (typeof window !== 'undefined') {
            (window as any).requestIdleCallback = vi.fn((cb) => cb());
        }
    });

    it('DIAGNOSIS: identifies Context Mirroring in the report', async () => {
        const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
        registerVariable('AuthCtx', { role: SignalRole.CONTEXT });
        registerVariable('localUser', { role: SignalRole.LOCAL });

        // Force a synchronous relationship (Density 2)
        for (let i = 0; i < 2; i++) {
            recordUpdate('AuthCtx');
            recordUpdate('localUser');
            await vi.runAllTimersAsync();
        }

        printBasisHealthReport();

        // Check if ANY group call contains the context name
        const groupTexts = groupSpy.mock.calls.map(call => call[0]).join(' ');
        expect(groupTexts).toContain('AuthCtx');
        groupSpy.mockRestore();
    });

    it('DIAGNOSIS: identifies Boolean Explosion in the report', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        registerVariable('bool1');
        registerVariable('bool2');
        registerVariable('bool3');

        for (let i = 0; i < 2; i++) {
            recordUpdate('bool1');
            recordUpdate('bool2');
            recordUpdate('bool3');
            await vi.runAllTimersAsync();
        }

        printBasisHealthReport();

        // Check if ANY log call contains "Boolean Explosion"
        const logTexts = logSpy.mock.calls.map(call => call[0]).join(' ');
        expect(logTexts).toContain('Boolean Explosion');
        logSpy.mockRestore();
    });

    it('identifies independent vs clustered variables', async () => {
        const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });

        registerVariable('var_a');
        registerVariable('var_b');
        recordUpdate('var_a');
        recordUpdate('var_b');
        await vi.runAllTimersAsync();

        printBasisHealthReport();
        expect(groupSpy).toHaveBeenCalled();
        groupSpy.mockRestore();
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