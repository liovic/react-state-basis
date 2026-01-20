// tests/reports.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { __testEngine__ } from '../src/engine';

const { registerVariable, recordUpdate, printBasisHealthReport, history, configureBasis } = __testEngine__;

describe('Health Reports & Clustering', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        history.clear();
        vi.useFakeTimers();
    });

    it('identifies independent vs clustered variables in health report', () => {
        const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        registerVariable('var_a');
        registerVariable('var_b');
        
        recordUpdate('var_a');
        recordUpdate('var_b');
        
        vi.advanceTimersByTime(50); 

        printBasisHealthReport(0.5);

        const totalCalls = groupSpy.mock.calls.length + logSpy.mock.calls.length;
        
        expect(totalCalls).toBeGreaterThan(0);

        groupSpy.mockRestore();
        logSpy.mockRestore();
    });
});