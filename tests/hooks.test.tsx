// tests/hooks.test.tsx

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useState,
    useMemo,
    useEffect,
    useReducer,
    createContext,
    useContext,
    __test__,
    useCallback,
    useTransition,
    useDeferredValue,
    useId,
    useSyncExternalStore,
    useInsertionEffect,
    useActionState
} from '../src/hooks';
import { BasisProvider } from '../src/context';
import * as UI from '../src/core/logger';

describe('Hooks Deep Coverage (v0.5.x)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <BasisProvider debug={true}>{children}</BasisProvider>
    );

    beforeEach(() => {
        __test__.history.clear();
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    it('useState: tracks value and cleans up', () => {
        const { result, unmount } = renderHook(() => useState(0, 'test_state'), { wrapper });

        act(() => {
            result.current[1](5);
        });

        expect(result.current[0]).toBe(5);
        expect(__test__.history.has('test_state')).toBe(true);

        unmount();
        expect(__test__.history.has('test_state')).toBe(false);
    });

    it('useState: handles anonymous state', () => {
        renderHook(() => useState(0), { wrapper });
        const keys = Array.from(__test__.history.keys());
        expect(keys.some(k => k.startsWith('anon_state_'))).toBe(true);
    });

    it('useMemo: registers as PROJECTION', () => {
        renderHook(() => useMemo(() => 42, [], 'test_proj'), { wrapper });

        const meta = __test__.history.get('test_proj');
        expect(meta).toBeDefined();
        expect(meta?.role).toBe('proj');
    });

    it('useEffect: tracks causality (Double Render)', () => {
        const spy = vi.spyOn(UI, 'displayCausalHint').mockImplementation(() => { });

        renderHook(() => {
            const [, s] = useState(0, 'target');
            useEffect(() => {
                s(1); // Triggering state inside effect
            }, [], 'source_effect');
        }, { wrapper });

        // Checks for the correct v0.5.x signature (label, meta, label, meta)
        expect(spy).toHaveBeenCalledWith(
            'target',
            expect.any(Object),
            'source_effect',
            expect.any(Object)
        );
        spy.mockRestore();
    });

    describe('useReducer: initialization patterns', () => {
        it('handles standard initialization', () => {
            const reducer = (s: number) => s + 1;
            const { result } = renderHook(() => useReducer(reducer, 10, undefined, 'reducer_label'), { wrapper });

            act(() => {
                result.current[1]({});
            });
            expect(result.current[0]).toBe(11);
            expect(__test__.history.has('reducer_label')).toBe(true);
        });

        it('handles lazy initialization', () => {
            const reducer = (s: number) => s + 1;
            const initFn = (arg: number) => arg + 100;
            const { result } = renderHook(() => useReducer(reducer, 0, initFn, 'lazy_label'), { wrapper });

            expect(result.current[0]).toBe(100);
            expect(__test__.history.has('lazy_label')).toBe(true);
        });
    });

    it('createContext & useContext: labels and subspace pulses', () => {
        const Ctx = createContext("default", "AuthContext");
        expect((Ctx as any)._basis_label).toBe("AuthContext");

        const wrap = ({ children }: any) => <Ctx.Provider value="active">{children}</Ctx.Provider>;
        const { result } = renderHook(() => useContext(Ctx), { wrapper: wrap });

        expect(result.current).toBe("active");
        // useContext should have registered the context label in engineHistory
        expect(__test__.history.has('AuthContext')).toBe(true);
        expect(__test__.history.get('AuthContext')?.role).toBe('context');
    });

    it('useCallback: registers as PROJECTION', () => {
        const { result } = renderHook(() => useCallback(() => "hello", [], "test_cb"), { wrapper });

        expect(result.current()).toBe("hello");
        expect(__test__.history.get('test_cb')?.role).toBe('proj');
    });

    it('useTransition: returns standard transition tuple', () => {
        const { result } = renderHook(() => useTransition(), { wrapper });
        expect(result.current[0]).toBe(false); // isPending
        expect(typeof result.current[1]).toBe('function'); // startTransition
    });

    it('useDeferredValue: returns standard value', () => {
        const { result } = renderHook(() => useDeferredValue("test"), { wrapper });
        expect(result.current).toBe("test");
    });

    it('useId: returns a valid react id', () => {
        const { result } = renderHook(() => useId(), { wrapper });
        expect(typeof result.current).toBe('string');
    });

    it('useSyncExternalStore: subscribes correctly', () => {
        const subscribe = vi.fn(() => () => { });
        const getSnapshot = () => "data";
        const { result } = renderHook(() => useSyncExternalStore(subscribe, getSnapshot), { wrapper });
        expect(result.current).toBe("data");
        expect(subscribe).toHaveBeenCalled();
    });

    it('useInsertionEffect: executes', () => {
        const effect = vi.fn();
        renderHook(() => useInsertionEffect(effect), { wrapper });
        expect(effect).toHaveBeenCalled();
    });

    it('useActionState: handles label as third argument (Babel style)', async () => {
        const mockAction = async (s: number) => s + 1;
        const { result } = renderHook(() => useActionState(mockAction, 0, 'babel_label'), { wrapper });

        expect(__test__.history.has('babel_label')).toBe(true);
    });
});