// tests/babel-plugin.test.ts

import { describe, it, expect } from 'vitest';
import { transformSync } from '@babel/core';
import plugin from '../src/babel-plugin.js';

const run = (code: string, filename = 'MyComponent.js'): string => {
  const result = transformSync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceType: 'module',
    plugins: [plugin],
  });

  if (!result?.code) {
    throw new Error(`transformSync returned no code for ${filename}`);
  }

  return result.code;
};

describe('babel-plugin-basis-transform', () => {
  it('labels a plain useState call with file -> varName:line', () => {
    const out = run(`
    import { useState } from 'react';
    function Comp() {
      const [count, setCount] = useState(0);
    }
  `);

    expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
    expect(out).toMatch(/import\s*{\s*useState\s*}\s*from\s*["']react-state-basis["']/);
  });

  it('handles member-expression callees (React.useState(...))', () => {
    const out = run(`
    import * as React from 'react';
    function Comp() {
      const [count, setCount] = React.useState(0);
    }
  `);

    expect(out).toMatch(/React\.useState\(0, "MyComponent\.js -> count:\d+"\)/);
  });

  it('is idempotent, does not double-label a call that already has a label arg', () => {
    const out = run(`
      import { useState } from 'react';
      function Comp() {
        const [count, setCount] = useState(0, 'MyComponent -> count');
      }
    `);

    const matches = out.match(/useState\(/g) || [];
    expect(matches.length).toBe(1);

    expect(out).toContain("useState(0, 'MyComponent -> count')");
    expect(out).not.toContain("MyComponent.js -> count");
  });

  it('gives two same-named useState calls distinct line-suffixed labels', () => {
    const out = run(`
      import { useState } from 'react';
      function useFoo() {
        const [value, setValue] = useState(0);
      }
      function useBar() {
        const [value, setValue] = useState(0);
      }
    `);

    const labels = [...out.matchAll(/useState\(0, "(MyComponent\.js -> value:\d+)"\)/g)]
      .map(m => m[1]);

    expect(labels).toHaveLength(2);
    expect(labels[0]).not.toBe(labels[1]);
    expect(out).not.toMatch(/useState\(0, "MyComponent\.js -> value"\)/);
  });

  it('labels useMemo / useEffect with the same file -> name:line scheme', () => {
    const out = run(`
      import { useMemo, useEffect } from 'react';
      function Comp() {
        const boxed = useMemo(() => 1, []);
        useEffect(() => {}, []);
      }
    `);

    expect(out).toMatch(/useMemo\(\(\) => 1, \[\], "MyComponent\.js -> boxed:\d+"\)/);
    expect(out).toMatch(/useEffect\(\(\) => \{\}, \[\], "MyComponent\.js -> effect_L\d+:\d+"\)/);
  });

  it('routes an aliased import to basis but still does not label the alias call site', () => {
    const out = run(`
      import { useState as useLocalState } from 'react';
      function Comp() {
        const [count, setCount] = useLocalState(0);
      }
    `);

    expect(out).toMatch(
      /import\s*\{\s*useState as useLocalState\s*\}\s*from\s*["']react-state-basis["']/
    );
    expect(out).toContain('useLocalState(0)');
    expect(out).not.toMatch(/useLocalState\(0,\s*"/);
  });

  it('handles useReducer 2-arg form (no lazy init)', () => {
    const out = run(`
    import { useReducer } from 'react';
    function Comp() {
      const [state, dispatch] = useReducer(reducer, initialState);
    }
  `);

    expect(out).toMatch(
      /useReducer\(reducer, initialState, undefined, "MyComponent\.js -> state:\d+"\)/
    );
  });

  it('handles useReducer 3-arg lazy-init form', () => {
    const out = run(`
    import { useReducer } from 'react';
    function Comp() {
      const [state, dispatch] = useReducer(reducer, initialArg, init);
    }
  `);

    expect(out).toMatch(
      /useReducer\(reducer, initialArg, init, "MyComponent\.js -> state:\d+"\)/
    );
  });

  it('respects a block-comment @basis-ignore at the top of the file', () => {
    const out = run(`
      /* @basis-ignore */
      import { useState } from 'react';
      function Comp() {
        const [count, setCount] = useState(0);
      }
    `);

    expect(out).toContain('useState(0)');
    expect(out).not.toContain('MyComponent.js -> count');

    expect(out).not.toMatch(/react-state-basis/);
  });

  it('respects a line-comment @basis-ignore at the top of the file', () => {
    const out = run(`
      // @basis-ignore
      import { useState } from 'react';
      function Comp() {
        const [count, setCount] = useState(0);
      }
    `);

    expect(out).toContain('useState(0)');
    expect(out).not.toContain('MyComponent.js -> count');
  });

  describe('#64: @basis-ignore must be an exact, leading directive', () => {
    it('does NOT trigger on a comment that merely contains the substring "basis-ignore"', () => {
      const out = run(`
        // TODO: check if basis-ignore is still needed here
        import { useState } from 'react';
        function Comp() {
          const [count, setCount] = useState(0);
        }
      `);

      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
      expect(out).toMatch(/react-state-basis/);
    });

    it('does NOT trigger on a matching comment that appears after the first statement', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          // @basis-ignore
          const [count, setCount] = useState(0);
        }
      `);

      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
      expect(out).toMatch(/react-state-basis/);
    });

    it('does NOT trigger on extra trailing text sharing the same comment', () => {
      const out = run(`
        // @basis-ignore for now, remove once #64 is fixed
        import { useState } from 'react';
        function Comp() {
          const [count, setCount] = useState(0);
        }
      `);

      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
    });

    it('still triggers on the exact leading directive with surrounding whitespace', () => {
      const out = run(`
        //   @basis-ignore   
        import { useState } from 'react';
        function Comp() {
          const [count, setCount] = useState(0);
        }
      `);

      expect(out).toContain('useState(0)');
      expect(out).not.toContain('MyComponent.js -> count');
    });
  });

  describe('#65: @basis-ignore-next-line opts a single call out of instrumentation', () => {
    it('rewrites the ignored call to a raw React import, leaving other calls instrumented', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          const [count, setCount] = useState(0);
          // @basis-ignore-next-line
          const [ticks, setTicks] = useState(0);
        }
      `);

      expect(out).toMatch(
        /import\s*{\s*useState\s*}\s*from\s*["']react-state-basis["']/
      );
      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);

      const rawImportMatch = out.match(
        /import\s*{\s*useState as (_?basis_raw_useState\d*)\s*}\s*from\s*["']react["']/
      );
      expect(rawImportMatch).not.toBeNull();
      const rawLocal = rawImportMatch![1];
      expect(out).toContain(`${rawLocal}(0)`);
      expect(out).not.toContain(`${rawLocal}(0, "`);
    });

    it('applies to the call line, not the enclosing statement, on a split declaration', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          const [count, setCount] =
            // @basis-ignore-next-line
            useState(0);
        }
      `);

      expect(out).toMatch(/basis_raw_useState/);
      expect(out).not.toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
    });

    it('leaves an unused basis import behind when the only call to a hook is ignored (known limitation, harmless)', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          // @basis-ignore-next-line
          const [count, setCount] = useState(0);
        }
      `);

      expect(out).toMatch(
        /import\s*{\s*useState\s*}\s*from\s*["']react-state-basis["']/
      );
      expect(out).toMatch(/basis_raw_useState/);
      expect(out).not.toMatch(/useState\(0, "/);
    });

    it('reuses the same raw import for multiple ignored calls to the same hook', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          // @basis-ignore-next-line
          const [a, setA] = useState(0);
          // @basis-ignore-next-line
          const [b, setB] = useState(0);
        }
      `);

      const rawImportDecls = out.match(
        /import\s*{\s*useState as _?basis_raw_useState\d*\s*}\s*from\s*["']react["']/g
      ) || [];
      expect(rawImportDecls).toHaveLength(1);
    });

    it('handles a member-expression call site (React.useState(...))', () => {
      const out = run(`
        import * as React from 'react';
        function Comp() {
          // @basis-ignore-next-line
          const [count, setCount] = React.useState(0);
        }
      `);

      expect(out).toMatch(/basis_raw_useState/);
      expect(out).not.toMatch(/React\.useState\(0\)/);
    });

    it('does NOT trigger when the comment is not on the line immediately above the call', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          // @basis-ignore-next-line

          const [count, setCount] = useState(0);
        }
      `);

      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
      expect(out).not.toMatch(/basis_raw_useState/);
    });

    it('does NOT trigger on a trailing comment on the same line as the call', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          const [count, setCount] = useState(0); // @basis-ignore-next-line
        }
      `);

      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
      expect(out).not.toMatch(/basis_raw_useState/);
    });

    it('does NOT trigger on a substring mention of the directive', () => {
      const out = run(`
        import { useState } from 'react';
        function Comp() {
          // remember to try @basis-ignore-next-line later
          const [count, setCount] = useState(0);
        }
      `);

      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);
    });
  });

  describe('does not corrupt real React parameters with a label', () => {
    it('leaves a bare useDebugValue(value) untouched -- no label in the formatter slot', () => {
      const out = run(`
        import { useDebugValue } from 'react';
        function useThing(value) {
          useDebugValue(value);
        }
      `);

      expect(out).toContain('useDebugValue(value)');
      expect(out).not.toContain('MyComponent.js ->');
    });

    it('does not clobber an explicit useDebugValue formatter function', () => {
      const out = run(`
        import { useDebugValue } from 'react';
        function useThing(value) {
          useDebugValue(value, (v) => v.toString());
        }
      `);

      expect(out).toContain("useDebugValue(value, v => v.toString())");
      expect(out).not.toContain('MyComponent.js ->');
    });

    it('leaves a bare useDeferredValue(value) untouched -- no label in the initialValue slot', () => {
      const out = run(`
        import { useDeferredValue } from 'react';
        function Comp({ value }) {
          const deferred = useDeferredValue(value);
        }
      `);

      expect(out).toContain('useDeferredValue(value)');
      expect(out).not.toContain('MyComponent.js ->');
    });

    it('does not clobber an explicit useDeferredValue initialValue', () => {
      const out = run(`
        import { useDeferredValue } from 'react';
        function Comp({ value }) {
          const deferred = useDeferredValue(value, 'initial');
        }
      `);

      expect(out).toContain("useDeferredValue(value, 'initial')");
      expect(out).not.toContain('MyComponent.js ->');
    });

    it('labels a bare useOptimistic(state) without landing the label in the reducer slot', () => {
      const out = run(`
        import { useOptimistic } from 'react';
        function Comp({ state }) {
          const [optimisticState, addOptimistic] = useOptimistic(state);
        }
      `);

      expect(out).toMatch(
        /useOptimistic\(state, undefined, "MyComponent\.js -> optimisticState:\d+"\)/
      );
    });

    it('preserves an explicit useOptimistic reducer and labels after it', () => {
      const out = run(`
        import { useOptimistic } from 'react';
        function Comp({ state }) {
          const [optimisticState, addOptimistic] = useOptimistic(state, (s, p) => p);
        }
      `);

      expect(out).toMatch(
        /useOptimistic\(state, \(s, p\) => p, "MyComponent\.js -> optimisticState:\d+"\)/
      );
    });

    it('does not redirect useDebugValue or useDeferredValue imports to react-state-basis at all', () => {
      const out = run(`
        import { useDebugValue, useDeferredValue, useState } from 'react';
        function Comp({ value }) {
          const [count, setCount] = useState(0);
          const deferred = useDeferredValue(value);
          useDebugValue(count);
        }
      `);

      expect(out).toMatch(
        /import\s*{\s*useState\s*}\s*from\s*["']react-state-basis["']/
      );
      expect(out).toMatch(/useState\(0, "MyComponent\.js -> count:\d+"\)/);

      expect(out).toMatch(
        /import\s*{\s*useDebugValue,\s*useDeferredValue\s*}\s*from\s*["']react["']/
      );
      expect(out).toContain('useDeferredValue(value)');
      expect(out).toContain('useDebugValue(count)');
    });

    it('is idempotent for an already-labeled useOptimistic call', () => {
      const out = run(`
        import { useOptimistic } from 'react';
        function Comp({ state }) {
          const [optimisticState, addOptimistic] = useOptimistic(state, undefined, 'MyComponent -> optimisticState');
        }
      `);

      const matches = out.match(/useOptimistic\(/g) || [];
      expect(matches.length).toBe(1);
      expect(out).toContain("useOptimistic(state, undefined, 'MyComponent -> optimisticState')");
    });
  });
});