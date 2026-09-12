<p align="center">
  <img src="./assets/logo.png" width="280" alt="Basis logo">
</p>

<div align="center">

# react-state-basis

### Runtime diagnostics for React state

**Dev-time tool that records *when* state writes land - not the values - and flags repeated timing patterns: extra frames, correlated flags, context copies, and update fan-out.**

[![npm version](https://img.shields.io/npm/v/react-state-basis.svg?style=flat-square)](https://www.npmjs.com/package/react-state-basis)
[![GitHub stars](https://img.shields.io/github/stars/liovic/react-state-basis.svg?style=flat-square)](https://github.com/liovic/react-state-basis/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

<p align="center">
  <a href="https://stackblitz.com/github/liovic/basis-live-demo"><strong>Live demo</strong></a><br>
  <sub>pick a scene · open the preview console</sub>
</p>

</div>

---

React DevTools, [why-did-you-render](https://github.com/welldone-software/why-did-you-render), and [React Scan](https://github.com/aidenybai/react-scan) help answer: **why did this component render?**

Basis asks something else:

**What updated, what updated with it, and what appears upstream?**

<p align="center">
  <img src="./assets/050Basis.gif" width="800" alt="Basis HUD showing state updates">
</p>

The HUD shows individual writes as they happen. The console report looks at the observed update graph over a rolling window - patterns that a single interaction often hides.

---

## Quick start

### 1. Install

```bash
npm i react-state-basis
```

### 2. Vite setup

Vite only for now. **Next.js / SWC is not instrumented yet.**

The Babel plugin labels hooks at build time. You keep importing from `react`.

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { basis } from 'react-state-basis/vite';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['react-state-basis/plugin']],
      },
    }),
    basis(),
  ],
});
```

### 3. Provider

```tsx
import { BasisProvider } from 'react-state-basis';

root.render(
  <BasisProvider debug={true} showHUD={true}>
    <App />
  </BasisProvider>
);
```

`showHUD={false}` keeps diagnostics in the console only.

### 4. Try it

```tsx
const [a, setA] = useState(0);
const [b, setB] = useState(0);

useEffect(() => {
  setB(a + 1);
}, [a]);

return <button onClick={() => setA(a + 1)}>Update</button>;
```

Click the button a few times. A typical console hit:

```text
⚡ BASIS | DOUBLE RENDER
📍 Location: YourComponent.tsx
Issue: effect_L5 triggers b in a separate frame.
Fix: Derive b during the render phase (remove effect) or wrap in useMemo.
```

That “Fix:” line is a prompt from a rolling frame window, not a proof. Repeat the same interaction and see whether the pattern holds.

[Detected patterns →](https://github.com/liovic/react-state-basis/wiki/Detected-patterns)

---

## Reports

After using the app with `debug={true}`:

```js
window.printBasisReport()  // ranked “start here” list
window.printBasisGraph()   // observed update graph
window.getBasisGraph()     // same graph as JSON
window.getBasisMetrics()   // engine timings
```

`printBasisReport()` and `printBasisGraph()` no-op unless `debug` is on. `getBasisGraph()` always returns the current snapshot.

Example graph (from the playground):

```text
📊 BASIS | CAUSAL GRAPH  7 nodes · 7 edges · 2 sources · buffer window 50
parent → child = observed cause → update. (×N) = times in this window.
⚡ Event · 3 targets · ×2
    BooleanEntanglement.tsx → isLoading redundant
    BooleanEntanglement.tsx → isSuccess redundant
    BooleanEntanglement.tsx → hasData redundant
↯ WeatherLab.tsx → effect @ L7
    WeatherLab.tsx → fahrenheit (×2)
```

An edge is something Basis **saw** in this window. It is not a proof of causality. The word `redundant` in that dump means “these writes kept landing together,” not “delete this state.”

For tooling or a bug report:

```ts
import { getBasisGraph } from 'react-state-basis';
import type { BasisGraphJSON } from 'react-state-basis';
```

Zustand stores can sit on the same graph:

```ts
import { basisLogger } from 'react-state-basis/zustand';
```

[Zustand example →](./examples/basis-zustand/)

---

## What Basis looks for

Basis does not decide whether your state is correct. It surfaces runtime patterns that are often worth a second look.

| Pattern | What Basis saw |
| --- | --- |
| Effect-driven extra frame | An effect writes state after another update. If that value can be computed during render, the second paint may be unnecessary. |
| Correlated updates | Two pieces of state repeatedly move in the same window (`isLoading` / `isSuccess`). Basis reports the correlation. It does not assume they should be merged. |
| Fragmented updates | One interaction updates several components, contexts, or stores. Sometimes that is intentional. Sometimes one transition would be easier with a clearer owner. |
| Context and store mirroring | A local hook repeatedly follows Context or a store. If the local value is not a draft or otherwise independent, the extra copy may be unnecessary. |
| Update origins | When several writes land together, the graph points at what looks upstream instead of treating every downstream write as its own issue. |

[Detected patterns →](https://github.com/liovic/react-state-basis/wiki/Detected-patterns)

---

## Signals, not proofs

Detections use timing, correlation, update order, roles, and graph structure. Valid React can still look busy.

Intentional sync, drafts, animations, reducers, stores, and coordinated transitions can all produce hits. Use the signal with your knowledge of the app.

Ignore a file: put this as the very first thing in the file, before any imports, on its own comment line - Basis only checks comments that lead the file, and only matches if the comment contains nothing else:

```ts
// @basis-ignore
import { useState } from 'react';
```

A comment placed after the first import, or mixed in with other text (e.g. `// @basis-ignore for now, revisit later`), is not recognized and instrumentation stays on for that file.

Useful for animation loops, third-party wrappers, and state you already know is coupled on purpose.

---

## Performance and privacy

- **Privacy:** timing, roles, and update relationships - not state values.
- **Development:** hot path is fixed-size ring buffers; heavier work runs on idle. Benchmarks in tested scenarios stay under ~1ms per update cycle. Real cost depends on the tree.
- **Production:** monitoring is off; production entry is a small shim.

[Benchmarks →](https://github.com/liovic/react-state-basis/wiki/Performance)

---

## Used on real codebases

These are demonstrations of output, not a claim that every hit is a defect.

- [shadcn-admin #274](https://github.com/satnaing/shadcn-admin/pull/274) - redundant viewport state; **merged**.
- [Excalidraw #10637](https://github.com/excalidraw/excalidraw/pull/10637) - theme sync pattern; **not merged**.

---

## How it works

Updates are sampled on `requestAnimationFrame`. Same tick means the same paint frame. From those ticks Basis builds a short-lived directed graph: what fired, what followed, and which writes look like they share a cause.

It never reads values or parses dependency arrays. Long async gaps look unrelated. Same-frame coincidence can look related.

[Wiki](https://github.com/liovic/react-state-basis/wiki) · [Roadmap](https://github.com/liovic/react-state-basis/wiki/Roadmap) · [Contributing](./CONTRIBUTING.md)

---

<div align="center">

Built by [LP](https://github.com/liovic) · [MIT License](https://opensource.org/licenses/MIT)

</div>