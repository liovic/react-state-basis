// tests/vite.test.ts

import { describe, it, expect } from 'vitest';
import { basis } from '../src/vite-plugin';

describe('Vite Plugin', () => {
  it('returns a valid vite plugin object', () => {
    const plugin = basis();
    expect(plugin.name).toBe('vite-plugin-react-state-basis');
    
    if (typeof plugin.config === 'function') {
      const config = (plugin.config as any)({});
      expect(config.optimizeDeps.exclude).toContain('react-state-basis');
    }
  });
});