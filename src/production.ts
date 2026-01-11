// src/production.ts

import * as React from 'react';
import type { 
  DependencyList, 
  EffectCallback, 
  FC, 
  ReactNode, 
  Context, 
  Reducer, 
  Dispatch, 
  SetStateAction 
} from 'react';
import * as ReactDOM from 'react-dom';

export type { DependencyList, EffectCallback, FC, ReactNode, Context, Reducer, Dispatch, SetStateAction };

export const useState = <T>(initialState: T | (() => T), _label?: string) => 
  React.useState(initialState);

export const useEffect = (effect: EffectCallback, deps?: DependencyList, _label?: string) => 
  React.useEffect(effect, deps as DependencyList);

export const useMemo = <T>(factory: () => T, deps?: DependencyList, _label?: string) => 
  React.useMemo(factory, deps as DependencyList);

export const useCallback = <T extends (...args: any[]) => any>(callback: T, deps: DependencyList, _label?: string) => 
  React.useCallback(callback, deps);

export const useReducer = (reducer: any, initialArg: any, init?: any, _label?: string) => 
  React.useReducer(reducer, initialArg, init);

export const useRef = <T>(initialValue: T, _label?: string) => 
  React.useRef(initialValue);

export const useLayoutEffect = (effect: EffectCallback, deps?: DependencyList, _label?: string) => 
  React.useLayoutEffect(effect, deps as DependencyList);

export const useContext = React.useContext;
export const createContext = React.createContext;
export const useId = React.useId;
export const useDebugValue = React.useDebugValue;
export const useImperativeHandle = React.useImperativeHandle;
export const useInsertionEffect = React.useInsertionEffect;
export const useSyncExternalStore = React.useSyncExternalStore;
export const useTransition = React.useTransition;
export const useDeferredValue = React.useDeferredValue;
export const unstable_batchedUpdates = ReactDOM.unstable_batchedUpdates;

export const registerVariable = () => {};
export const unregisterVariable = () => {};
export const recordUpdate = () => true;
export const beginEffectTracking = () => {};
export const endEffectTracking = () => {};
export const printBasisHealthReport = () => {};

export const BasisProvider: FC<{ children: ReactNode; debug?: boolean }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};