// tests/record-update-isolation.test.tsx

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useState, useReducer, __test__ } from '../src/hooks';
import { BasisProvider } from '../src/context';
import { __testEngine__ } from '../src/engine';
import * as UI from '../src/core/logger';
import { LOOP_THRESHOLD } from '../src/core/constants';

const { registerVariable, recordUpdate, configureBasis, instance, unregisterVariable } =
    __testEngine__;

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BasisProvider debug={true}>{children}</BasisProvider>
);

describe('Instrumentation must not block host updates', () => {
    beforeEach(() => {
        instance.history.clear();
        instance.graph.clear();
        instance.violationMap.clear();
        instance.redundantLabels.clear();
        instance.pausedVariables.clear();
        instance.loopCounters.clear();
        instance.currentTickBatch.clear();
        instance.currentEffectSource = null;
        instance.lastStateUpdate = null;
        instance.isBatching = false;
        instance.lastCleanup = Date.now();
        configureBasis({ debug: true });

        __test__.history.clear();
        __test__.endEffectTracking();

        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('recordUpdate does not throw when requestAnimationFrame is missing', () => {
        vi.stubGlobal('requestAnimationFrame', undefined);

        registerVariable('no_raf');

        expect(() => recordUpdate('no_raf')).not.toThrow();
        expect(recordUpdate('no_raf')).toBe(true);
    });

    it('falls back to setTimeout when requestAnimationFrame is absent', () => {
        const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
        vi.stubGlobal('requestAnimationFrame', undefined);

        registerVariable('timeout_fallback');
        recordUpdate('timeout_fallback');

        expect(timeoutSpy).toHaveBeenCalled();
    });

    it('loop guard pauses analysis only: later recordUpdate returns false', () => {
        const spy = vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => { });
        registerVariable('hot_path');

        let last = true;
        for (let i = 0; i < LOOP_THRESHOLD + 2; i++) {
            last = recordUpdate('hot_path');
        }

        expect(spy).toHaveBeenCalled();
        expect(instance.pausedVariables.has('hot_path')).toBe(true);
        expect(last).toBe(false);
        expect(recordUpdate('hot_path')).toBe(false);
    });

    it('unregisterVariable clears the pause so a remount can be analyzed again', () => {
        vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => { });
        registerVariable('remount_me');

        for (let i = 0; i < LOOP_THRESHOLD + 1; i++) {
            recordUpdate('remount_me');
        }
        expect(instance.pausedVariables.has('remount_me')).toBe(true);

        unregisterVariable('remount_me');
        registerVariable('remount_me');

        expect(instance.pausedVariables.has('remount_me')).toBe(false);
        expect(recordUpdate('remount_me')).toBe(true);
    });

    it('useState still updates after the label is paused', () => {
        vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => { });

        const { result } = renderHook(() => useState(0, 'paused_state'), { wrapper });

        act(() => {
            for (let i = 0; i < LOOP_THRESHOLD + 5; i++) {
                result.current[1](i + 1);
            }
        });

        expect(result.current[0]).toBe(LOOP_THRESHOLD + 5);

        act(() => {
            result.current[1](999);
        });
        expect(result.current[0]).toBe(999);
    });

    it('useReducer still dispatches after the label is paused', () => {
        vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => { });
        const reducer = (s: number) => s + 1;

        const { result } = renderHook(
            () => useReducer(reducer, 0, undefined, 'paused_reducer'),
            { wrapper }
        );

        act(() => {
            for (let i = 0; i < LOOP_THRESHOLD + 3; i++) {
                result.current[1]({});
            }
        });

        expect(result.current[0]).toBe(LOOP_THRESHOLD + 3);
    });

    it('useState still updates when requestAnimationFrame is missing', () => {
        vi.stubGlobal('requestAnimationFrame', undefined);

        const { result } = renderHook(() => useState(0, 'ssr_state'), { wrapper });

        expect(() => {
            act(() => {
                result.current[1](3);
            });
        }).not.toThrow();

        expect(result.current[0]).toBe(3);
    });

    it('useState still updates if something inside recordUpdate throws for an unrelated reason', () => {
        vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => {
            throw new Error('boom');
        });

        const { result } = renderHook(() => useState(0, 'throwy_state'), { wrapper });

        expect(() => {
            act(() => {
                for (let i = 0; i < LOOP_THRESHOLD + 5; i++) {
                    result.current[1](i + 1);
                }
            });
        }).not.toThrow();

        expect(result.current[0]).toBe(LOOP_THRESHOLD + 5);
    });

    it('useReducer still dispatches if something inside recordUpdate throws for an unrelated reason', () => {
        vi.spyOn(UI, 'displayViolentBreaker').mockImplementation(() => {
            throw new Error('boom');
        });
        const reducer = (s: number) => s + 1;

        const { result } = renderHook(
            () => useReducer(reducer, 0, undefined, 'throwy_reducer'),
            { wrapper }
        );

        expect(() => {
            act(() => {
                for (let i = 0; i < LOOP_THRESHOLD + 3; i++) {
                    result.current[1]({});
                }
            });
        }).not.toThrow();

        expect(result.current[0]).toBe(LOOP_THRESHOLD + 3);
    });
});