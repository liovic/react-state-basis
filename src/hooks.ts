// src/hooks.ts

import { 
  useState as reactUseState, 
  useEffect as reactUseEffect, 
  useMemo as reactUseMemo, 
  useReducer as reactUseReducer,
  useContext as reactUseContext,
  createContext as reactCreateContext,
  useCallback 
} from 'react';
import { 
  registerVariable, 
  recordUpdate, 
  beginEffectTracking, 
  endEffectTracking 
} from './engine';

export function useState<T>(initialValue: T, label?: string): [T, (val: T | ((p: T) => T)) => void] {
  const [val, setVal] = reactUseState(initialValue);
  const effectiveLabel = label || 'anonymous_state';

  reactUseEffect(() => {
    registerVariable(effectiveLabel);
  }, [effectiveLabel]);

  const setter = useCallback((newValue: any) => {
    if (recordUpdate(effectiveLabel)) {
      setVal(newValue);
    }
  }, [effectiveLabel]);

  return [val, setter];
}

export function useMemo<T>(factory: () => T, deps: any[], label?: string): T {
  const effectiveLabel = label || 'anonymous_projection';
  
  reactUseEffect(() => {
    if ((window as any)._basis_debug !== false) {
      console.log(`%c [Basis] Projection active: "${effectiveLabel}" `, "color: #2ecc71; font-weight: bold;");
    }
  }, [effectiveLabel]);

  return reactUseMemo(factory, deps);
}

export function useEffect(effect: () => void | (() => void), deps?: any[], label?: string) {
  const effectiveLabel = label || 'anonymous_effect';

  reactUseEffect(() => {
    beginEffectTracking(effectiveLabel);
    const cleanup = effect();
    endEffectTracking();
    return cleanup;
  }, deps);
}

export function useReducer(reducer: any, initialState: any, label?: string) {
  const [state, dispatch] = reactUseReducer(reducer, initialState);
  const effectiveLabel = label || 'anonymous_reducer';

  reactUseEffect(() => {
    registerVariable(effectiveLabel);
  }, [effectiveLabel]);

  const basisDispatch = useCallback((action: any) => {
    if (recordUpdate(effectiveLabel)) {
      dispatch(action);
    }
  }, [effectiveLabel]);

  return [state, basisDispatch];
}

export function createContext<T>(defaultValue: T, label?: string) {
  const context = reactCreateContext(defaultValue);
  if (label) {
    (context as any)._basis_label = label;
  }
  return context;
}

export function useContext<T>(context: React.Context<T>): T {
  return reactUseContext(context);
}