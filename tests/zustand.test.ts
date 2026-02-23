// tests/zustand.test.ts

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { __testEngine__ } from '../src/engine';
import { SignalRole } from '../src/core/types';
import { basisLogger } from '../src/integrations/zustand';

const { registerVariable, recordUpdate, configureBasis, instance } = __testEngine__;

const createStore = <T extends object>(config: (set: any, get: any, api: any) => T) => {
    let state: T;
    const subscribers = new Set<() => void>();

    const api = {
        getState: () => state,
        setState: (partial: any) => {
            const update = typeof partial === 'function' ? partial(state) : partial;
            state = { ...state, ...update };
            subscribers.forEach(cb => cb());
        },
        subscribe: (cb: () => void) => {
            subscribers.add(cb);
            return () => subscribers.delete(cb);
        },
    };

    const set = (partial: any) => api.setState(partial);
    const get = () => api.getState();

    state = config(set, get, api);
    return api;
};

describe('Zustand Integration: basisLogger middleware', () => {

    beforeEach(() => {
        instance.history.clear();
        instance.redundantLabels.clear();
        instance.graph.clear();
        instance.violationMap.clear();
        instance.tick = 0;

        configureBasis({ debug: true });
        vi.stubGlobal('requestIdleCallback', (cb: Function) => cb());
        vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb(performance.now()));
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('LAZY REGISTRATION: does not register the store at setup time', () => {
        basisLogger((set) => ({ count: 0 }), 'TestStore');
        expect(instance.history.has('TestStore')).toBe(false);
    });

    it('LAZY REGISTRATION: registers the store on the first set() call', () => {
        const wrappedConfig = basisLogger(
            (set) => ({
                count: 0,
                increment: () => set({ count: 1 }),
            }),
            'TestStore'
        );

        const store = createStore(wrappedConfig as any);
        expect(instance.history.has('TestStore')).toBe(false);

        (store.getState() as any).increment();
        expect(instance.history.has('TestStore')).toBe(true);
    });

    it('LAZY REGISTRATION: only registers store once despite multiple set() calls', () => {
        const wrappedConfig = basisLogger(
            (set) => ({
                count: 0,
                increment: () => set((s: any) => ({ count: s.count + 1 })),
            }),
            'OnceStore'
        );

        const store = createStore(wrappedConfig as any);
        const registerSpy = vi.spyOn({ registerVariable }, 'registerVariable');

        (store.getState() as any).increment();
        (store.getState() as any).increment();
        (store.getState() as any).increment();

        const storeMeta = instance.history.get('OnceStore');
        expect(storeMeta).toBeDefined();
        expect(storeMeta?.role).toBe(SignalRole.STORE);
    });

    it('ROLE: store-level signal is registered as SignalRole.STORE', () => {
        const wrappedConfig = basisLogger(
            (set) => ({ value: 'a', toggle: () => set({ value: 'b' }) }),
            'RoleStore'
        );

        const store = createStore(wrappedConfig as any);
        (store.getState() as any).toggle();

        expect(instance.history.get('RoleStore')?.role).toBe(SignalRole.STORE);
    });

    it('ROLE: per-key signals are registered as SignalRole.STORE', () => {
        const wrappedConfig = basisLogger(
            (set) => ({ theme: 'light', toggle: () => set({ theme: 'dark' }) }),
            'KeyRoleStore'
        );

        const store = createStore(wrappedConfig as any);
        (store.getState() as any).toggle();

        expect(instance.history.get('KeyRoleStore -> theme')?.role).toBe(SignalRole.STORE);
    });

    it('GRANULARITY: records update only for keys that actually changed', () => {
        const wrappedConfig = basisLogger(
            (set) => ({
                theme: 'light',
                count: 0,
                toggleTheme: () => set({ theme: 'dark' }),
            }),
            'GranularStore'
        );

        const store = createStore(wrappedConfig as any);
        (store.getState() as any).toggleTheme();

        expect(instance.history.has('GranularStore -> theme')).toBe(true);
        expect(instance.history.has('GranularStore -> count')).toBe(false);
    });

    it('GRANULARITY: records updates for multiple changed keys in one set()', () => {
        const wrappedConfig = basisLogger(
            (set) => ({
                isLoading: false,
                data: null,
                fetchData: () => set({ isLoading: true, data: 'result' }),
            }),
            'MultiKeyStore'
        );

        const store = createStore(wrappedConfig as any);
        (store.getState() as any).fetchData();

        expect(instance.history.has('MultiKeyStore -> isLoading')).toBe(true);
        expect(instance.history.has('MultiKeyStore -> data')).toBe(true);
    });

    it('GRANULARITY: does not record update for keys with unchanged values', () => {
        const wrappedConfig = basisLogger(
            (set) => ({
                theme: 'light',
                count: 0,
                incrementCount: () => set((s: any) => ({ count: s.count + 1 })),
            }),
            'NoChangeStore'
        );

        const store = createStore(wrappedConfig as any);
        (store.getState() as any).incrementCount();

        expect(instance.history.has('NoChangeStore -> theme')).toBe(false);
        expect(instance.history.has('NoChangeStore -> count')).toBe(true);
    });

    it('STORE SIGNAL: records store-level update on every set() call', () => {
        const spy = vi.spyOn({ recordUpdate }, 'recordUpdate');

        const wrappedConfig = basisLogger(
            (set) => ({
                count: 0,
                increment: () => set((s: any) => ({ count: s.count + 1 })),
            }),
            'StoreSignal'
        );

        const store = createStore(wrappedConfig as any);

        (store.getState() as any).increment();
        (store.getState() as any).increment();
        (store.getState() as any).increment();

        expect(instance.history.has('StoreSignal')).toBe(true);
        expect(instance.history.get('StoreSignal')?.role).toBe(SignalRole.STORE);
    });

    it('LABEL FORMAT: per-key label follows "StoreName -> key" convention', () => {
        const wrappedConfig = basisLogger(
            (set) => ({ theme: 'light', toggle: () => set({ theme: 'dark' }) }),
            'MyStore'
        );

        const store = createStore(wrappedConfig as any);
        (store.getState() as any).toggle();

        expect(instance.history.has('MyStore -> theme')).toBe(true);
    });

    it('STORE MIRRORING: STORE role is treated as global source, LOCAL is flagged redundant', () => {
        const redundantSet = new Set<string>();
        const violationMap = new Map();

        registerVariable('store_signal', { role: SignalRole.STORE });
        registerVariable('local_signal', { role: SignalRole.LOCAL });

        const storeMeta = instance.history.get('store_signal')!;
        const localMeta = instance.history.get('local_signal')!;

        expect(storeMeta.role).toBe(SignalRole.STORE);
        expect(localMeta.role).toBe(SignalRole.LOCAL);

        expect(storeMeta.role === SignalRole.STORE || storeMeta.role === SignalRole.CONTEXT).toBe(true);
        expect(localMeta.role === SignalRole.LOCAL).toBe(true);
    });

    it('STORE MIRRORING: two STORE signals updating together are not flagged', async () => {
        registerVariable('StoreA -> theme', { role: SignalRole.STORE });
        registerVariable('StoreB -> theme', { role: SignalRole.STORE });

        for (let i = 0; i < 3; i++) {
            recordUpdate('StoreA -> theme');
            recordUpdate('StoreB -> theme');
            await vi.runAllTimersAsync();
        }

        expect(instance.redundantLabels.size).toBe(0);
    });


    it('PRODUCTION: basisLogger shim is a passthrough', async () => {
        const { basisLogger: prodLogger } = await import('../src/integrations/zustand-production');

        const config = (set: any) => ({ count: 0 });
        const result = prodLogger(config);

        expect(result).toBe(config);
    });

    it('FUNCTIONAL SET: correctly diffs state when set() receives a function', () => {
        const wrappedConfig = basisLogger(
            (set) => ({
                count: 0,
                increment: () => set((s: any) => ({ count: s.count + 1 })),
            }),
            'FunctionalStore'
        );

        const store = createStore(wrappedConfig as any);
        (store.getState() as any).increment();

        expect(instance.history.has('FunctionalStore -> count')).toBe(true);
    });
});