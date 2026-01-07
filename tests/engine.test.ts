// tests/engine.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __testEngine__ } from '../src/engine';

const {
    registerVariable,
    recordUpdate,
    history,
    currentTickBatch,
    printBasisHealthReport,
    configureBasis,
    instance
} = __testEngine__;

describe('State Engine', () => {
    beforeEach(() => {
        configureBasis({ debug: true });

        history.clear();
        currentTickBatch.clear();
        instance.updateLog = [];
        instance.tick = 0;
        instance.isBatching = false;
        
        vi.useFakeTimers();
    });

    it('registers a variable with default vector in singleton history', () => {
        registerVariable('testVar');
        expect(history.has('testVar')).toBe(true);
        expect(instance.history.has('testVar')).toBe(true);
    });

    it('batches updates and shifts vectors using 20ms window', () => {
        registerVariable('a');
        recordUpdate('a');
        
        vi.advanceTimersByTime(25); 
        
        expect(history.get('a')![49]).toBe(1);
    });

    it('prevents infinite loops (Circuit Breaker)', () => {
        registerVariable('loop');
        for (let i = 0; i < 25; i++) recordUpdate('loop');
        
        expect(recordUpdate('loop')).toBe(false);
    });

    it('triggers health report with console.table', () => {
        const tableSpy = vi.spyOn(console, 'table').mockImplementation(() => { });
        registerVariable('v1');
        printBasisHealthReport();
        expect(tableSpy).toHaveBeenCalled();
        tableSpy.mockRestore();
    });

    it('respects debug: false by not recording history (Ghost Mode)', () => {
        configureBasis({ debug: false });
        registerVariable('ghost_var');
        recordUpdate('ghost_var');
        
        expect(history.has('ghost_var')).toBe(false);
    });
});