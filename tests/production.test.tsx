// tests/production.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import * as Prod from '../src/production';
import React from 'react';

describe('Production Shims: Full Coverage', () => {
    it('executes all lifecycle and state shims', async () => {
        const { result } = renderHook(() => {
            const [s] = Prod.useState(0, "label");
            const [r, dispatch] = Prod.useReducer((s: any) => s, 0, undefined, "label");
            Prod.useEffect(() => { }, [], "label");
            Prod.useLayoutEffect(() => { }, [], "label");
            Prod.useInsertionEffect(() => { }, []);
            const m = Prod.useMemo(() => 1, [], "label");
            const c = Prod.useCallback(() => { }, [], "label");
            const id = Prod.useId("label");
            const trans = Prod.useTransition("label");
            const def = Prod.useDeferredValue(0, "label");

            return { s, r, dispatch, m, c, id, trans, def };
        });

        expect(result.current.s).toBe(0);
        expect(result.current.m).toBe(1);
        expect(typeof result.current.id).toBe('string');

        act(() => { result.current.dispatch({}); });
    });

    it('covers useActionState and useOptimistic', async () => {
        const { result } = renderHook(() => {
            const [opt, setOpt] = Prod.useOptimistic(0, (s: number, p: number) => p, "label");
            const [state, dispatch] = Prod.useActionState(async (s: any) => s, 0, "link", "label");
            return { opt, setOpt, state, dispatch };
        });

        await act(async () => {
            result.current.setOpt(1);
            result.current.dispatch();
        });
        expect(result.current.opt).toBe(0); // Standard React 19 behavior
    });

    it('covers remaining utility hooks', () => {
        renderHook(() => {
            const dummyRef = { current: null };
            Prod.useDebugValue("test");
            Prod.useImperativeHandle(dummyRef as React.Ref<object>, () => ({}));
            Prod.useSyncExternalStore(() => () => { }, () => 1);
            try { Prod.use(Promise.resolve()); } catch (e) { }
        });
    });

    it('BasisProvider: renders children (Line 11)', () => {
        const { container } = render(<Prod.BasisProvider><span>Test</span></Prod.BasisProvider>);
        expect(container.textContent).toBe('Test');
    });

    it('useReducer: non-lazy path (Line 28)', () => {
        // Calling with 3 args where 3rd is NOT a function hits the 'else'
        const reducer = (s: any) => s;
        const { result } = renderHook(() => Prod.useReducer(reducer, { count: 0 }, "label" as any));
        expect(result.current[0].count).toBe(0);
    });

    it('useActionState: permalink as label path (Line 49)', () => {
        const action = async (s: any) => s;
        // Calling with 3 args where 3rd is string hits the 'actualPermalink = undefined' branch
        const { result } = renderHook(() => Prod.useActionState(action, 0, "my-injected-label"));
        expect(result.current[0]).toBe(0);
    });
});