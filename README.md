<p align="center">
  <img src="./assets/logo.png" width="300" alt="Basis Logo">
</p>

<div align="center">

# 📐 REACT-STATE-BASIS
### **Behavioral State Analysis for React**

[![npm version](https://img.shields.io/npm/v/react-state-basis.svg?style=flat-square)](https://www.npmjs.com/package/react-state-basis)
[![GitHub stars](https://img.shields.io/github/stars/liovic/react-state-basis.svg?style=flat-square)](https://github.com/liovic/react-state-basis/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

### The Core Concept
In Linear Algebra, a **Basis** is a set of linearly independent vectors that span a space. **Basis** treats your React application as a dynamic system where every state variable is a signal over time.

If two states always update in lockstep, they are **linearly dependent** (redundant). Basis detects these "Dimension Collapses" at runtime and suggests refactoring to derived state (`useMemo`).

---

## How it Works: The Vectorization Engine

Basis doesn't care about the *values* of your state. It monitors the **topology of transitions**.

### 1. The System Tick
The engine groups all state updates occurring within a **20ms window** (aligned with the 60FPS frame budget) into a single **System Tick**.

### 2. State-to-Vector Mapping
Every hook is mapped to a vector $v$ in a 50-dimensional space $\mathbb{R}^{50}$ representing a sliding window of the last 50 ticks:
*   `1` = State transition occurred during this tick.
*   `0` = State remained stagnant.

**Example of two redundant (collinear) states:**
```text
State A: [0, 1, 0, 0, 1, 0, 1, 0, 1, 0]  <-- vA
State B: [0, 1, 0, 0, 1, 0, 1, 0, 1, 0]  <-- vB
Result:  Cosine Similarity = 1.00 (REDUNDANT)
```

Basis detects synchronization, not identity. Even if the data inside the hooks is different, if they always change at the same time, they are collinear in the state-space."

### 3. Real-time Auditing
Every 5 ticks, Basis calculates the **Cosine Similarity** between all active state vectors. If similarity exceeds **0.88**, an architectural alert is triggered in your console with a suggested fix.

---

## Ghost Mode: Zero-Overhead Production
Basis is a **development-only** infrastructure. Using **Conditional Exports**, it automatically swaps itself for a "Zero-Op" version in production:
*   **Development:** Full Linear Algebra engine and auditor active.
*   **Production:** Exports raw React hooks directly. **Zero bundle bloat. Zero performance penalty.**

---

## Quick Start

### 1. Install
```bash
npm i react-state-basis
```

### 2. Initialize
```tsx
import { BasisProvider } from 'react-state-basis';

export default function Root() {
  return (
    <BasisProvider debug={true}> {/* Set debug={false} for total silence in dev */}
       <App />
    </BasisProvider>
  );
}
```
**Props:**
*   `debug (boolean)`: 
    *   `true` (Default): Enables the real-time diagnostic dashboard, visual system status badge (Web only), and detailed console auditing (including the Circuit Breaker).
    *   `false`: Completely deactivates the Basis engine. No background analysis, no memory consumption, and no logging. The "Circuit Breaker" is also disabled in this mode to allow for a zero-overhead, raw React experience in development.

### 3. Drop-in Replacement
Replace your standard React hook imports with `react-state-basis`. This allows the engine to instrument your state updates without changing your component logic.

**Standard Named Imports (Recommended):**
```tsx
// ❌ Change this:
// import { useState, useEffect } from 'react';

// ✅ To this:
import { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback,
  useContext, 
  useRef, 
  useLayoutEffect, 
  useId, 
  useSyncExternalStore,
  useDeferredValue, 
  useTransition
} from 'react-state-basis';

function MyComponent() {
  const [data, setData] = useState([]); // Automatically vectorized and tracked
}
```

**Namespace Imports:**
Basis also supports namespace imports if you prefer to keep your hooks grouped:
```tsx
import * as Basis from 'react-state-basis';

function MyComponent() {
  const [count, setCount] = Basis.useState(0); // Also tracked automatically
}
```
---

## Automated Diagnostics (Babel)
While Basis works out of the box, hooks will be labeled as `anonymous_state` by default. To get the rich diagnostics seen in the demos (with automatic **filenames** and **variable names**), we highly recommend using our Babel plugin.

### Vite Integration
Add Basis to your `vite.config.ts`. It will automatically instrument your hooks during build time:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        // Automatically labels useState, useMemo, etc. 
        plugins: [['react-state-basis/plugin']]
      }
    })
  ]
})
```

### Manual Labeling (Alternative)
If you prefer not to use Babel, you can manually label any hook by passing a string as the last argument:

```tsx
const [count, setCount] = useState(0, "MyComponent -> count");
```

---

## High-Level Insights

### System Health Report
For a bird's-eye view of your entire application's state-space, call the global reporter in your browser console:

```javascript
window.printBasisReport();
```
This generates a correlation matrix and calculates your **Basis Efficiency Score** in real-time.

---
### React Native & Expo

Basis automatically detects the environment. In mobile environments, it switches to **Headless Mode**-disabling the web badge and formatting all diagnostics for the Metro terminal.

---

## Basis vs Existing Tools

| Feature | React DevTools | Why Did You Render | Basis 📐 |
| :--- | :---: | :---: | :---: |
| **Analyzes Values** | ✅ | ✅ | ❌ (Value-agnostic) |
| **Tracks Timing/Ticks** | ❌ | ❌ | ✅ |
| **Detects Redundancy** | ❌ | ❌ | ✅ (Linear Dependence) |
| **Circuit Breaker** | ❌ | ❌ | ✅ (Halts petlje) |
| **Prod. Overhead** | Low | Medium | **Zero** (Ghost Mode) |

---

## Key Capabilities

### 1. Temporal State Matrix (Real-time HUD)
The "Heartbeat" of your application. Basis injects a high-performance, Zero-Overhead HUD that visualizes your state transitions as a temporal heatmap.
*   **Signal Visualization:** Watch every `useState`, `useReducer`, and `useEffect` update pulse in real-time.
*   **Visual Pattern Recognition:** Identify architectural flaws simply by looking at the rhythm of the matrix. If multiple rows pulse together, they likely belong together.
*   **Zero-Overhead:** Powered by Canvas API and `requestAnimationFrame` polling to ensure your application's performance remains untouched during development.

### 2. Redundant State Detection (Dimension Collapse)
Basis monitors transition vectors to identify "Dimension Collapses" in your state space.
*   **Collinearity Alerts:** When multiple states (like `isLoading`, `isSuccess`, `hasData`) update in lockstep, Basis flags them as mathematically redundant.
*   **Visual Debugging:** Redundant states are automatically highlighted in **Red** within the HUD, providing immediate visual proof that you are storing the same information in multiple places.

### 3. Causal Detective (Double Render Tracker)
Identify "Double Render Cycles" by tracking the causality chain from effects to state setters.
*   **Sequence Tracking:** Detects when a state update is a lagging echo of a `useEffect` or `useLayoutEffect`.
*   **Refactor Insights:** Provides direct console hints to move from manual synchronization to pure, deterministic mathematical projections using `useMemo`.

### 4. Stability Circuit Breaker
A real-time safety monitor for your execution thread.
*   **Oscillation Detection:** If high-frequency state oscillation is detected (e.g., a recursive effect loop), Basis forcefully halts the update chain.
*   **Tab Protection:** Stops the browser thread from locking up, allowing you to catch and fix infinite loops without having to force-quit your browser tab.

### 5. System Health & Efficiency Rank
Basis performs a global audit of your state space to calculate its **Mathematical Rank**—the actual number of independent information dimensions.
*   **Efficiency Score:** A real-time KPI for your architecture. A 100% score means every state variable is a unique, non-redundant source of truth.
*   **Architecture Audit:** Use the global Health Report (`window.printBasisReport()`) to generate a correlation matrix of your entire application state.

---

### See it in Action
<p align="center">
  <img src="./assets/react-state-basis.gif" width="800" alt="React State Basis Demo" />
</p>

---

## 🔍 Case Study: Auditing High-Integrity React Architecture

To test the engine against professional standards, Basis was used to audit the [shadcn-admin](https://github.com/satnaing/shadcn-admin) template-a high-quality, production-ready dashboard implementation.

<p align="center">
  <img src="./assets/shadcn-admin.png" width="800" alt="Basis Real World Audit" />
</p>

### Audit Results: 100% Basis Efficiency
The project demonstrated exceptional architectural integrity. The engine verified a **100% Efficiency**, confirming that all state variables are linearly independent. This proves that the codebase follows a "Single Source of Truth" philosophy with zero redundant state.

### Subtle Optimization Caught
Despite the perfect efficiency score, the **Causality Engine** identified a hidden performance bottleneck:
*   **Double Render Detection:** Basis flagged a "Double Render Cycle" in the `use-mobile.tsx` hook. It detected that the `isMobile` state was being manually synchronized within a `useEffect`, triggering a secondary render pass. 
*   **Refactor Insight:** While the logic was correct, Basis revealed the cost of the implementation - a redundant render cycle that occurs before every layout shift.

### Stability Confirmation
The auditor provided formal verification for the rest of the suite:
*   **Stable Callbacks:** Verified that `Sidebar` methods were correctly memoized, ensuring child components are protected from unnecessary updates.
*   **Valid Projections:** Confirmed that complex table logic (pagination and filtering) was implemented as pure mathematical projections, rather than state-syncing.

Math reveals exactly what standard code reviews often miss: the **temporal topology** of your application.
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