// tests/hooks19.test.tsx

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimistic, useActionState, __test__ } from '../src/hooks';
import { BasisProvider } from '../src/context';

describe('React 19 Hooks Coverage', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <BasisProvider>{children}</BasisProvider>;

  beforeEach(() => {
    __test__.history.clear();
  });

  it('useOptimistic: tracks updates', async () => {
    const { result } = renderHook(() => useOptimistic(0, (s, p: number) => p), { wrapper });
    
    await act(async () => {});

    const keys = Array.from(__test__.history.keys()) as string[];
    expect(keys.some(k => k.includes('optimistic'))).toBe(true);
  });

  it('useActionState: tracks updates', async () => {
    const mockAction = async (s: number, p: number) => s + p;
    const { result } = renderHook(() => useActionState(mockAction, 0), { wrapper });

    await act(async () => {});

    const keys = Array.from(__test__.history.keys()) as string[];
    expect(keys.some(k => k.includes('action_state'))).toBe(true);
  });
});