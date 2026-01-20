// tests/engine.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { __testEngine__ } from '../src/engine';
import * as UI from '../src/core/logger';

const {
    registerVariable,
    recordUpdate,
    history,
    configureBasis,
    instance
} = __testEngine__;

describe('State Engine Core', () => {
    beforeEach(() => {
        configureBasis({ debug: true });
        
        history.clear();
        instance.updateLog = [];
        instance.tick = 0;
        instance.isBatching = false;
        
        vi.useFakeTimers();
    });

    it('Activity Guard: remains silent if variables update only once', () => {
        const spy = vi.spyOn(UI, 'displayRedundancyAlert');
        registerVariable('v1');
        registerVariable('v2');
        
        recordUpdate('v1');
        recordUpdate('v2');
        
        vi.advanceTimersByTime(25); 
        
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });

    it('prevents infinite loops (v0.4.0 Circuit Breaker)', () => {
        registerVariable('loop');
        
        for (let i = 0; i < 300; i++) {
            recordUpdate('loop');
        }
        
        expect(recordUpdate('loop')).toBe(false);
    });

    it('batches multiple updates into a single temporal tick', () => {
        registerVariable('a');
        
        recordUpdate('a');
        recordUpdate('a'); 
        
        vi.advanceTimersByTime(25); 
        
        expect(history.get('a')![49]).toBe(1);
    });
});