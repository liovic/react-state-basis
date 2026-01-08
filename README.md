<p align="center">
  <img src="./assets/logo.png" width="300" alt="Basis Logo">
</p>

<div align="center">

# 📐 REACT-STATE-BASIS
### **Real-time Architectural Auditor for React**

[![npm version](https://img.shields.io/npm/v/react-state-basis.svg?style=flat-square)](https://www.npmjs.com/package/react-state-basis)
[![GitHub stars](https://img.shields.io/github/stars/liovic/react-state-basis.svg?style=flat-square)](https://github.com/liovic/react-state-basis/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Audit your React architecture without changing a single line of code.**

</div>

---

### The Core Concept
In Linear Algebra, a **Basis** is a set of linearly independent vectors that span a space. **Basis** treats your React application as a dynamic system where every state variable's update history is a signal over time.

If two states always update in lockstep, they are **linearly dependent** (redundant). Basis detects these "Dimension Collapses" at runtime and provides deterministic refactor suggestions.

---

## Key Capabilities

*   **Temporal State Matrix (HUD):** A zero-overhead visualization of state signals. If rows pulse together, the architecture is redundant.
*   **Redundancy Detection:** Identification of collinear hooks with suggested `useMemo` refactors.
*   **Causal Detective:** Tracking the causality chain from effects to state setters to identify "Double Render Cycles".
*   **Stability Circuit Breaker:** Forcefully halts recursive state oscillations before they freeze the browser tab.
*   **Universal Support:** Officially supports **React Web**, **React Native**, and **Expo**.

---

## See It In Action
The Real-time HUD visualizes your state's "heartbeat" using the Canvas API. Below, watch as Basis detects collinear state, flags causal render loops, and activates the stability circuit breaker.

<p align="center">
  <img src="./assets/react-state-basis.gif" width="800" alt="React State Basis Demo" />
</p>

---

## Zero-Friction Setup (Vite)

As of **v0.3.0**, Basis is completely invisible. You no longer need to swap imports manually. It acts as a transparent proxy for `react` and `react-dom` during development.

### 1. Install
```bash
npm i react-state-basis
```

### 2. Configure Vite
Add the `basis` plugin to your `vite.config.ts`. It will automatically intercept standard React imports and instrument them with the auditing engine.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { basis } from 'react-state-basis/vite';

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: [['react-state-basis/plugin']] }
    }),
    basis() // <--- That's it. Keep your "import from react" as is.
  ]
});
```

### 3. Initialize Provider
Wrap your root component with the `BasisProvider` to enable the HUD and Engine.
```tsx
import { BasisProvider } from 'react-state-basis';

root.render(
  <BasisProvider debug={true}>
     <App />
  </BasisProvider>
);
```

---

## Basis vs Existing Tools

| Feature | React DevTools | Why Did You Render | Basis 📐 |
| :--- | :---: | :---: | :---: |
| **Analyzes Values** | ✅ | ✅ | ❌ (Value-agnostic) |
| **Tracks Timing/Ticks** | ❌ | ❌ | ✅ |
| **Detects Redundancy** | ❌ | ❌ | ✅ (Linear Dependence) |
| **Circuit Breaker** | ❌ | ❌ | ✅ (Halts Loops) |
| **Prod. Overhead** | Low | Medium | **Zero** (Ghost Mode) |

---

## Case Study: shadcn-admin Audit
We ran Basis on a production-ready dashboard to verify its mathematical engine.
*   **Result:** Verified **100% Basis Efficiency** (12/12 independent dimensions).
*   **Insight:** Caught a minor "Double Render" bottleneck in the `useIsMobile` hook that standard linters missed.

<p align="center">
  <img src="./assets/shadcn-admin.png" width="800" alt="Real World Audit" />
</p>

---

## Roadmap

#### **v0.2.x - Signal Intelligence & Visual Foundation (Current)** ✅
- [x] **Full React Hook Parity:** Support for all standard hooks and React Native/Expo.
- [x] **React 19 Ready:** Full support for `use()`, `useOptimistic()`, and `useActionState()`.
- [x] **Temporal Matrix HUD:** Real-time Canvas-based visualization of state signals.
- [x] **Causality Engine:** Detection of sequential sync-leaks and double-render cycles.
- [x] **Ghost Mode:** Zero-op production exports with no bundle overhead.
- [x] **95% Test Coverage:** Verified mathematical engine.

#### **v0.3.0 - Global State & Ecosystem**
- [x] **Zero-Config Vite Plugin:** Automatic aliasing for `react` and `react-dom`.
- [x] **Babel Auto-Instrumentation:** Automatic hook labeling without code changes.
- [ ] **Zustand Middleware:** Auditing global-to-local state redundancy.
- [ ] **Redux Integration:** Connecting the causal engine to Redux dispatch cycles.
- [ ] **CLI Initializer:** `rsb-init` to automatically configure Babel/Vite plugins.
- [ ] **Context Auditor:** Tracking signal collisions across multiple React Context providers.

#### **v0.4.0 - Topology & Automation**
- [ ] **State-Space Topology Map:** 2D force-directed graph showing coupling clusters.
- [ ] **Automated Fix Hints:** Advanced console codemods for converting redundant state to `useMemo`.

---

<div align="center">
Developed by LP | For engineers who treat software as applied mathematics. 🚀
</div>