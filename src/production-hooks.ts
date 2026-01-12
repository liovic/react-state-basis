// src/production-hooks.ts

import * as React from 'react';
import type { FC, ReactNode, DependencyList, EffectCallback } from 'react';

export const BasisProvider: FC<{ children: ReactNode; debug?: boolean }> = ({ children }) => {
    return React.createElement(React.Fragment, null, children);
};

export const useState = <T>(initialState: T | (() => T), _label?: string) => React.useState(initialState);
export const useEffect = (effect: EffectCallback, deps?: DependencyList, _label?: string) => React.useEffect(effect, deps as DependencyList);
export const useMemo = <T>(factory: () => T, deps?: DependencyList, _label?: string) => React.useMemo(factory, deps as DependencyList);
export const useCallback = <T extends (...args: any[]) => any>(callback: T, deps?: DependencyList, _label?: string) => React.useCallback(callback, deps as DependencyList);
export const useReducer = (reducer: any, initArg: any, init?: any, _label?: string) => React.useReducer(reducer, initArg, init);
export const useRef = <T>(initialValue: T, _label?: string) => React.useRef(initialValue);
export const useLayoutEffect = (effect: EffectCallback, deps?: DependencyList, _label?: string) => React.useLayoutEffect(effect, deps as DependencyList);
export const useTransition = (_label?: string) => React.useTransition();
export const useDeferredValue = <T>(value: T, _label?: string) => React.useDeferredValue(value);
export const useOptimistic = <S, P>(passthrough: S, reducer?: (state: S, payload: P) => S, _label?: string) => (React as any).useOptimistic(passthrough, reducer);
export const useActionState = <State, Payload>(action: (state: State, payload: Payload) => Promise<State> | State, initialState: State, permalink?: string, _label?: string) => (React as any).useActionState(action, initialState, permalink);

export const useId = (_label?: string) => React.useId();
export const useDebugValue = React.useDebugValue;
export const useImperativeHandle = React.useImperativeHandle;
export const useInsertionEffect = React.useInsertionEffect;
export const useSyncExternalStore = React.useSyncExternalStore;
export const use = (React as any).use;
export const createContext = React.createContext;
export const useContext = React.useContext;