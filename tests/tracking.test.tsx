// tests/tracking.test.tsx

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useState, useEffect } from '../src/hooks';
import { BasisProvider } from '../src/context';
import * as UI from '../src/core/logger';

describe('Manual Effect Tracking', () => {
  it('triggers TRACKED SYNC LEAK when setState is called inside effect', () => {
    const spy = vi.spyOn(UI, 'displayCausalHint').mockImplementation(() => { });
    const wrapper = ({ children }: any) => <BasisProvider>{children}</BasisProvider>;

    renderHook(() => {
      const [, setB] = useState(0, 'target');
      useEffect(() => {
        setB(1);
      }, [], 'source_effect');
    }, { wrapper });

    expect(spy).toHaveBeenCalledWith(
      'target',
      expect.objectContaining({ role: 'local' }),
      'source_effect',
      expect.anything()
    );
    spy.mockRestore();
  });
});