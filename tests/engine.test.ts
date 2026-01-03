// tests/engine.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __testEngine__ } from '../src/engine';

const {
    registerVariable,
    recordUpdate,
    history,
    currentTickBatch,
    printBasisHealthReport,
    configureBasis
} = __testEngine__;

describe('State Engine', () => {
    beforeEach(() => {
        configureBasis({ debug: true });

        history.clear();
        currentTickBatch.clear();
        vi.useFakeTimers();
    });

    it('registers a variable with default vector', () => {
        registerVariable('testVar');
        expect(history.has('testVar')).toBe(true);
    });

    it('batches updates and shifts vectors', () => {
        registerVariable('a');
        recordUpdate('a');
        vi.runAllTimers();
        expect(history.get('a')![49]).toBe(1);
    });

    it('prevents infinite loops', () => {
        registerVariable('loop');
        for (let i = 0; i < 26; i++) recordUpdate('loop');
        expect(recordUpdate('loop')).toBe(false);
    });

    it('triggers health report', () => {
        const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => { });
        registerVariable('v1');
        printBasisHealthReport();
        expect(tableSpy).toHaveBeenCalled();
        tableSpy.mockRestore();
    });

    it('respects debug: false in recordUpdate', () => {
        configureBasis({ debug: false });
        const result = recordUpdate('hidden_var');
        expect(result).toBe(true);
        expect(history.has('hidden_var')).toBe(false);
    });

    it('respects debug: false in registerVariable', () => {
        configureBasis({ debug: false });
        registerVariable('ghost_var');
        expect(history.has('ghost_var')).toBe(false);
    });
});