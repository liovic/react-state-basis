// src/hooks.ts

import * as React from 'react';
import {
  useState as reactUseState,
  useEffect as reactUseEffect,
  useMemo as reactUseMemo,
  useReducer as reactUseReducer,
  useContext as reactUseContext,
  useSyncExternalStore as reactUseSyncExternalStore,
  createContext as reactCreateContext,
  useRef as reactUseRef,
  useLayoutEffect as reactUseLayoutEffect,
  useCallback as reactUseCallback,
  useTransition as reactUseTransition,
  useDeferredValue as reactUseDeferredValue,
} from 'react';

import {
  registerVariable,
  unregisterVariable,
  recordUpdate,
  beginEffectTracking,
  endEffectTracking,
  history as engineHistory
} from './engine';
import { SignalRole } from './core/types';

// --- Internal Type Helpers ---

let anonCount = 0;
const getFallbackLabel = (type: string) => `anon_${type}_${anonCount++}`;

/**
 * Standard React Reducer type inference helpers.
 */
type GetReducerState<R extends React.Reducer<any, any>> = R extends React.Reducer<infer S, any> ? S : never;
type GetReducerAction<R extends React.Reducer<any, any>> = R extends React.Reducer<any, infer A> ? A : never;

interface BasisContext<T> extends React.Context<T> {
  _basis_label?: string;
}

/**
 * React 19 Type Definitions for strictness.
 */
interface React19Extended {
  useOptimistic<S, P>(passthrough: S, reducer?: (state: S, payload: P) => S): [S, (payload: P) => void];
  useActionState<State, Payload>(
    action: (state: State, payload: Payload) => Promise<State> | State,
    initialState: State,
    permalink?: string
  ): [state: State, dispatch: (payload: Payload) => void, isPending: boolean];
  use<T>(usable: React.Usable<T>): T;
}

const React19 = React as unknown as React19Extended;

// --- useState ---

export function useState<S>(
  initialState: S | (() => S),
  label?: string
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const [val, setVal] = reactUseState(initialState);
  const effectiveLabel = reactUseRef(label || getFallbackLabel('state')).current;

  reactUseEffect(() => {
    registerVariable(effectiveLabel, { role: SignalRole.LOCAL });
    return () => { unregisterVariable(effectiveLabel); };
  }, [effectiveLabel]);

  const setter = reactUseCallback((value: React.SetStateAction<S>) => {
    if (recordUpdate(effectiveLabel)) {
      setVal(value);
    }
  }, [effectiveLabel]);

  return [val, setter];
}

// --- useReducer ---

/**
 * PUBLIC OVERLOAD: Lazy initialization
 */
export function useReducer<R extends React.Reducer<any, any>, I>(
  reducer: R,
  initializerArg: I,
  initializer: (arg: I) => GetReducerState<R>,
  label?: string
): [GetReducerState<R>, React.Dispatch<GetReducerAction<R>>];

/**
 * PUBLIC OVERLOAD: Direct initialization
 */
export function useReducer<R extends React.Reducer<any, any>>(
  reducer: R,
  initialState: GetReducerState<R>,
  initializer?: undefined,
  label?: string
): [GetReducerState<R>, React.Dispatch<GetReducerAction<R>>];

/**
 * FINAL IMPLEMENTATION
 */
export function useReducer<R extends React.Reducer<any, any>, I>(
  reducer: R,
  initialArg: I | GetReducerState<R>,
  init?: ((arg: I) => GetReducerState<R>) | string,
  label?: string
): [GetReducerState<R>, React.Dispatch<GetReducerAction<R>>] {
  const isLazy = typeof init === 'function';

  // v0.5.x Label Extraction: prioritize 4th arg, fallback to 3rd if string (Babel behavior)
  const providedLabel = label || (typeof init === 'string' ? init : undefined);
  const effectiveLabel = reactUseRef(providedLabel || getFallbackLabel('reducer')).current;

  const [state, dispatch] = isLazy
    ? reactUseReducer(reducer, initialArg as I, init as (arg: I) => GetReducerState<R>)
    : reactUseReducer(reducer, initialArg as GetReducerState<R>);

  reactUseEffect(() => {
    registerVariable(effectiveLabel, { role: SignalRole.LOCAL });
    return () => { unregisterVariable(effectiveLabel); };
  }, [effectiveLabel]);

  const basisDispatch = reactUseCallback((action: GetReducerAction<R>) => {
    if (recordUpdate(effectiveLabel)) {
      dispatch(action);
    }
  }, [effectiveLabel, dispatch]);

  return [state, basisDispatch];
}

// --- Context ---

export function createContext<T>(defaultValue: T, label?: string): React.Context<T> {
  const context = reactCreateContext(defaultValue) as BasisContext<T>;
  const effectiveLabel = label || getFallbackLabel('context');

  // Use non-enumerable property to store the Basis label
  Object.defineProperty(context, '_basis_label', {
    value: effectiveLabel,
    writable: false,
    enumerable: false
  });

  return context;
}

export function useContext<T>(context: React.Context<T>): T {
  const val = reactUseContext(context);
  const label = (context as BasisContext<T>)._basis_label;

  reactUseLayoutEffect(() => {
    if (label) {
      registerVariable(label, { role: SignalRole.CONTEXT });
      recordUpdate(label);
    }
  }, [val, label]);

  return val;
}

// --- Projections ---

export function useMemo<T>(factory: () => T, deps: React.DependencyList | undefined, label?: string): T {
  const effectiveLabel = reactUseRef(label || getFallbackLabel('proj')).current;
  reactUseEffect(() => {
    registerVariable(effectiveLabel, { role: SignalRole.PROJECTION });
    return () => { unregisterVariable(effectiveLabel); };
  }, [effectiveLabel]);
  return reactUseMemo(factory, deps || []);
}

export function useCallback<T extends (...args: unknown[]) => unknown>(callback: T, deps: React.DependencyList, label?: string): T {
  const effectiveLabel = reactUseRef(label || getFallbackLabel('cb')).current;
  reactUseEffect(() => {
    registerVariable(effectiveLabel, { role: SignalRole.PROJECTION });
    return () => { unregisterVariable(effectiveLabel); };
  }, [effectiveLabel]);
  return reactUseCallback(callback, deps);
}

// --- Effects ---

export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList, label?: string): void {
  const effectiveLabel = label || 'anonymous_effect';
  reactUseEffect(() => {
    beginEffectTracking(effectiveLabel);
    const destructor = effect();
    endEffectTracking();
    return typeof destructor === 'function' ? destructor : undefined;
  }, deps);
}

export function useLayoutEffect(effect: React.EffectCallback, deps?: React.DependencyList, label?: string): void {
  const effectiveLabel = label || 'anonymous_layout_effect';
  reactUseLayoutEffect(() => {
    beginEffectTracking(effectiveLabel);
    const destructor = effect();
    endEffectTracking();
    return typeof destructor === 'function' ? destructor : undefined;
  }, deps);
}

// --- React 19 ---

export function useOptimistic<S, P>(
  passthrough: S,
  reducer?: (state: S, payload: P) => S,
  label?: string
): [S, (payload: P) => void] {
  const effectiveLabel = reactUseRef(label || getFallbackLabel('optimistic')).current;
  reactUseEffect(() => {
    registerVariable(effectiveLabel, { role: SignalRole.LOCAL });
    return () => { unregisterVariable(effectiveLabel); };
  }, [effectiveLabel]);

  const [state, reactAddOptimistic] = React19.useOptimistic(passthrough, reducer);

  const addOptimistic = reactUseCallback((payload: P) => {
    if (recordUpdate(effectiveLabel)) {
      reactAddOptimistic(payload);
    }
  }, [effectiveLabel, reactAddOptimistic]);

  return [state, addOptimistic];
}

export function useActionState<State, Payload>(
  action: (state: State, payload: Payload) => Promise<State> | State,
  initialState: State,
  permalink?: string,
  label?: string
): [state: State, dispatch: (payload: Payload) => void, isPending: boolean] {

  const isLabelArg = typeof permalink === 'string' && label === undefined;
  const effectiveLabel = reactUseRef(isLabelArg ? (permalink as string) : (label || getFallbackLabel('action_state'))).current;
  const actualPermalink = isLabelArg ? undefined : permalink;

  const [state, reactDispatch, isPending] = React19.useActionState(action, initialState, actualPermalink);

  reactUseEffect(() => {
    registerVariable(effectiveLabel, { role: SignalRole.LOCAL });
    return () => { unregisterVariable(effectiveLabel); };
  }, [effectiveLabel]);

  const basisDispatch = reactUseCallback((payload: Payload) => {
    if (recordUpdate(effectiveLabel)) {
      reactDispatch(payload);
    }
  }, [effectiveLabel, reactDispatch]);

  return [state, basisDispatch, isPending];
}

// --- Direct Exports ---
export const useRef = reactUseRef;
export const useId = React.useId;
export const useDebugValue = React.useDebugValue;
export const useImperativeHandle = React.useImperativeHandle;
export const useInsertionEffect = React.useInsertionEffect;
export const useSyncExternalStore = reactUseSyncExternalStore;
export const useTransition = reactUseTransition;
export const useDeferredValue = reactUseDeferredValue;
export const use = React19.use;

export const __test__ = {
  registerVariable,
  history: engineHistory,
  unregisterVariable,
  recordUpdate,
  beginEffectTracking,
  endEffectTracking
};
