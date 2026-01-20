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

    it('identifies Redundancy when updates are simultaneous (Plane 0)', () => {
        const spy = vi.spyOn(UI, 'displayRedundancyAlert');
        registerVariable('a');
        registerVariable('b');

        for (let i = 0; i < 5; i++) {
            recordUpdate('a');
            recordUpdate('b');
            vi.advanceTimersByTime(25);
        }

        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('identifies Sync Leak when B follows A (Lead Plane +1)', () => {
        const spy = vi.spyOn(UI, 'displayCausalHint');
        registerVariable('source_A');
        registerVariable('target_B');

        for (let i = 0; i < 10; i++) {
            recordUpdate('source_A');
            vi.advanceTimersByTime(25);
            
            recordUpdate('target_B');
            vi.advanceTimersByTime(25);
            
            vi.advanceTimersByTime(100); 
        }

        expect(spy).toHaveBeenCalledWith('target_B', 'source_A', 'math');
        spy.mockRestore();
    });

    it('identifies Sync Leak when A follows B (Lag Plane -1)', () => {
        const spy = vi.spyOn(UI, 'displayCausalHint');
        registerVariable('source_B');
        registerVariable('target_A');

        for (let i = 0; i < 10; i++) {
            recordUpdate('source_B');
            vi.advanceTimersByTime(25); 
            
            recordUpdate('target_A');
            vi.advanceTimersByTime(25);
            
            vi.advanceTimersByTime(100); 
        }

        expect(spy).toHaveBeenCalledWith('target_A', 'source_B', 'math');
        spy.mockRestore();
    });
});