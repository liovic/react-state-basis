// tests/reports.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { __testEngine__ } from '../src/engine';
import { SignalRole } from '../src/core/types';

const { registerVariable, recordUpdate, printBasisHealthReport, history, configureBasis, instance } = __testEngine__;

describe('Health Reports & Clustering (v0.6.x)', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        history.clear();
        instance.graph.clear();
        instance.violationMap.clear();

        vi.stubGlobal('requestIdleCallback', (cb: any) => cb());
        vi.useFakeTimers();

        // Ensure browser env simulation for logger checks
        if (typeof window === 'undefined') {
            global.window = {} as any;
            global.document = {} as any;
        }
        (window as any).requestIdleCallback = vi.fn((cb) => cb());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('DIAGNOSIS: identifies Context Mirroring in the report', async () => {
        const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

        registerVariable('AuthCtx', { role: SignalRole.CONTEXT });
        registerVariable('localUser', { role: SignalRole.LOCAL });

        // Force a synchronous relationship (Density 2)
        for (let i = 0; i < 2; i++) {
            recordUpdate('AuthCtx');
            recordUpdate('localUser');
            await vi.runAllTimersAsync();
        }

        printBasisHealthReport();

        // Check 1: Should appear in the "Impacts" or Group header
        const groupTexts = groupSpy.mock.calls.map(call => call[0]).join(' ');
        expect(groupTexts).toContain('AuthCtx');

        // Check 2: Should trigger the specific diagnosis text in the Sync Issues section
        const logTexts = logSpy.mock.calls.map(call => call[0]).join(' ');
        expect(logTexts).toContain('Context Mirroring');
    });

    it('DIAGNOSIS: identifies Boolean Explosion in the report', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => { });

        // requires specific keywords to trigger "Boolean Explosion"
        registerVariable('isLoading');
        registerVariable('isSuccess');
        registerVariable('hasData');

        for (let i = 0; i < 2; i++) {
            recordUpdate('isLoading');
            recordUpdate('isSuccess');
            recordUpdate('hasData');
            await vi.runAllTimersAsync();
        }

        printBasisHealthReport();

        // Check if ANY log call contains "Boolean Explosion"
        const logTexts = logSpy.mock.calls.map(call => call[0]).join(' ');
        expect(logTexts).toContain('Boolean Explosion');
    });

    it('identifies independent vs clustered variables', async () => {
        const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => { });

        registerVariable('var_a');
        registerVariable('var_b');

        recordUpdate('var_a');
        recordUpdate('var_b');
        await vi.runAllTimersAsync();

        printBasisHealthReport();

        // Should generate a "Global Event" group (v0.6) or "Sync Issue" group (v0.5)
        expect(groupSpy).toHaveBeenCalled();
    });
});
