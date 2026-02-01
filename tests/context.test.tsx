// tests/context.test.ts

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BasisProvider } from '../src/context';

describe('BasisProvider', () => {
  it('shows monitor in debug mode', () => {
    const { container } = render(<BasisProvider debug={true}><div>App</div></BasisProvider>);
    expect(container.textContent).toContain('BASIS ACTIVE');
  });

  it('hides monitor in non-debug mode', () => {
    const { container } = render(<BasisProvider debug={false}><div>App</div></BasisProvider>);
    expect(container.textContent).not.toContain('BASIS ACTIVE');
  });

    it('hides monitor when showHUD is false, even if debug is true', () => {
    const { container } = render(
      <BasisProvider debug={true} showHUD={false}>
        <div>App</div>
      </BasisProvider>
    );
    
    expect(container.textContent).not.toContain('BASIS ACTIVE');
    
    expect((window as any)._basis_debug).toBe(true);
  });
});