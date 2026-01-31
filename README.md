<p align="center">
  <img src="./assets/logo.png" width="300" alt="Basis Logo">
</p>

<div align="center">

# react-state-basis
### Runtime Architectural Auditor for React

**Basis tracks when state updates (never what) to catch architectural debt that standard tools miss, while keeping your data private.**

[![npm version](https://img.shields.io/npm/v/react-state-basis.svg?style=flat-square)](https://www.npmjs.com/package/react-state-basis)
[![GitHub stars](https://img.shields.io/github/stars/liovic/react-state-basis.svg?style=flat-square)](https://github.com/liovic/react-state-basis/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

## Quick Start

### 1. Install
```bash
npm i react-state-basis
```

### 2. Setup (Vite)
Add the plugin to your `vite.config.ts`. The Babel plugin auto-labels your hooks—you continue importing from `react` as normal.

```ts
import { basis } from 'react-state-basis/vite';

export default defineConfig({
  plugins: [
    react({ 
      babel: { plugins: [['react-state-basis/plugin']] } 
    }),
    basis()
  ]
});
```

### 3. Initialize
```tsx
import { BasisProvider } from 'react-state-basis';

root.render(
  <BasisProvider debug={true}>
    <App />
  </BasisProvider>
);
```

### 4. Verify the Signal
Drop this pattern into any component. Basis will identify the rhythm of the debt within ~100ms.

```tsx
const [a, setA] = useState(0);
const [b, setB] = useState(0);

useEffect(() => {
  setB(a); // ⚡ BASIS: "Double Render Detected"
}, [a]);

return <button onClick={() => setA(a + 1)}>Pulse Basis</button>;
```

Click the button. You should see this in your console within ~100ms:
```
⚡ BASIS | DOUBLE RENDER
📍 Location: YourComponent.tsx
Issue: a triggers b in a separate frame.
Fix: Derive b during the first render.
```

---

## Visual Proof

The optional HUD shows your **State Basis Matrix** in real-time. Purple pulses ($\Omega$) are Context anchors; Red pulses (!) are redundant shadows.

<p align="center">
  <img src="./assets/050Basis.gif" width="800" alt="Basis v0.5.0 Demo" />
</p>

---

## What Basis Detects

Basis treats every hook as a signal to catch these architectural violations:

- **Ω Context Mirroring** - Local state shadowing global context
- **♊ Duplicate State** - Independent variables that always update together  
- **⚡ Sync Leaks** - 1-frame delays forcing double renders
- **🛑 Recursive Oscillation** - Infinite loops (with circuit breaker)

[**See examples & fixes →**](https://github.com/liovic/react-state-basis/wiki/03%3A-The-Forensic-Catalog)

---

## Reports & Telemetry

### Architectural Health Report
Check your entire app's state architecture by running `window.printBasisReport()` in the console.

*   **Efficiency Score:** Ratio of independent signals to total hooks.
*   **Entangled Clusters:** Groups of variables that move in sync (Boolean Explosion).
*   **Correlation Matrix:** Raw pairwise similarity data for deep-dive forensics.

### Hardware Telemetry
Verify engine efficiency and heap stability in real-time via `window.getBasisMetrics()`.

---

## Real-World Evidence

Basis is verified against industry-standard codebases to ensure high-fidelity detection:

*   **Excalidraw (114k⭐)** - Caught a theme-sync leak forcing a double-render on every toggle. [**PR #10637**](https://github.com/excalidraw/excalidraw/pull/10637)
*   **shadcn-admin (10k⭐)** - Detected redundant state pattern in viewport detection hooks. [**PR #274**](https://github.com/satnaing/shadcn-admin/pull/274)

---

## Performance & Privacy

**Development:** <1ms overhead per update cycle, zero heap growth  
**Production:** ~0.01ms per hook (monitoring disabled, ~2-3KB bundle)  
**Privacy:** Only tracks update timing, never state values

[**See benchmarks →**](https://github.com/liovic/react-state-basis/wiki/Performance-Forensics)

---

## Documentation & Theory

Basis is built on heuristics inspired by **Linear Algebra** and **Signal Processing**. To understand the underlying math, visit the [**Full Wiki**](https://github.com/liovic/react-state-basis/wiki).

---

## Roadmap

Each era of Basis answers a different architectural question:

✓ **v0.4.x** - The Correlation Era - *Are these states moving together?*  
→ **v0.5.x** - The Decomposition Era - *Is this local state just a copy of Context?*  
**v0.6.x** - The Graph Era - *Which bug should I fix first for maximum impact?*  
**v0.7.x** - The Information Era - *Does this state carry real information, or is it derivative?*

[**More info**](https://github.com/liovic/react-state-basis/wiki/Roadmap)

---

<div align="center">

Built by [LP](https://github.com/liovic) • [MIT License](https://opensource.org/licenses/MIT)

</div>
