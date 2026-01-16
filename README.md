<p align="center">
  <img src="./assets/logo.png" width="300" alt="Basis Logo">
</p>

<div align="center">

# 📐 react-state-basis
### Runtime state profiler for React

[![npm version](https://img.shields.io/npm/v/react-state-basis.svg?style=flat-square)](https://www.npmjs.com/package/react-state-basis)
[![GitHub stars](https://img.shields.io/github/stars/liovic/react-state-basis.svg?style=flat-square)](https://github.com/liovic/react-state-basis/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Catches redundant state and update chains while your React app runs.**

</div>

---

## What Does It Do?

**react-state-basis** watches your React app in development and flags common architectural issues:

- **Redundant state** - Two states that always update together
- **Update chains** - Effects that trigger more state updates (double renders)
- **Infinite loops** - Circular dependencies that freeze your browser
- **Tight coupling** - State variables that should be independent but aren't

It works by tracking *when* state updates happen, not *what* the values are.

---

## Quick Example
```tsx
// ❌ Basis will flag this
const [user, setUser] = useState(null);
const [isLoggedIn, setIsLoggedIn] = useState(false);

useEffect(() => {
  setIsLoggedIn(!!user);  // Double render - flagged as redundant
}, [user]);

// ✅ Better
const [user, setUser] = useState(null);
const isLoggedIn = !!user;  // Computed, no second render
```

---

## See It Work

The optional HUD shows which states update together in real-time:

<p align="center">
  <img src="./assets/react-state-basis.gif" width="800" alt="React State Basis Demo" />
</p>

---

## Setup (Vite)

### 1. Install
```bash
npm i react-state-basis
```

### 2. Add to `vite.config.ts`
```tsx
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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

### 3. Wrap your app
```tsx
import { BasisProvider } from 'react-state-basis';

root.render(
  <BasisProvider debug={true}>
    <App />
  </BasisProvider>
);
```

That's it. The tool runs automatically in development.

---

## What You'll See

### Console Alerts

When Basis detects issues, you'll see styled console logs:

**Redundant State:**
```
📐 BASIS | REDUNDANT STATE DETECTED
📍 Location: TodoList.tsx
Pattern: States "todos" and "count" update together 92% of the time.
One is likely redundant and can be removed.

Suggested fix: Convert "count" to a computed value
```

**Update Chains:**
```
💡 BASIS | UPDATE CHAIN DETECTED
Sequence: user ➔ Effect ➔ isLoggedIn
Pattern: "isLoggedIn" is synchronized via useEffect, causing a second render.
```

**Infinite Loops:**
```
🛑 BASIS | INFINITE LOOP DETECTED
State variable "counter" is updating too rapidly (25+ times in 500ms).
Execution halted to prevent browser freeze.
```

### Health Report

Check your entire app's state health:
```tsx
window.printBasisReport();
```

Shows:
- Efficiency score (how much redundant state you have)
- Which states are independent vs synchronized
- Correlation matrix

---

## Testing on Real Projects

I've tested this on a few open-source projects to validate the detection:

### Excalidraw (114k+ ⭐)

**Found:** Theme state being manually synchronized in `useEffect`  
**Issue:** Double render on every theme change  
**Fix:** [PR #10637](https://github.com/excalidraw/excalidraw/pull/10637) - replaced with computed value  
**Status:** Pending review

<p align="center"> 
  <img src="./assets/excalidraw-audit.png" width="800" alt="Excalidraw Audit" /> 
</p>

### shadcn-admin (10k+ ⭐)

**Found:** Mobile detection hook with effect-based synchronization  
**Issue:** Unnecessary re-renders on viewport resize  
**Fix:** [PR #274](https://github.com/satnaing/shadcn-admin/pull/274) - cleaner subscription pattern  
**Status:** Pending review

<p align="center"> 
  <img src="./assets/shadcn-admin.png" width="800" alt="shadcn Admin Audit" /> 
</p>

> **Note:** These are proposed improvements based on the tool's detection. The maintainers may choose different solutions or determine the patterns are intentional.

---

## How It Works

### The Basic Idea

The tool records the last 50 "ticks" (roughly 1 second) for each state variable:
```
useState("count"): [0,1,0,0,1,1,0,0,0,...]
useState("total"): [0,1,0,0,1,1,0,0,0,...]
                    ↑ Both update at same times = probably redundant
```

It uses **cosine similarity** (a standard correlation metric) to detect when states update together.

If similarity > 0.88, it flags them as potentially redundant.

### Why This Works

Most architectural issues create **temporal patterns**:
- Redundant state → always updates together
- Update chains → one state updates, then another follows
- Infinite loops → same state updates rapidly

The tool watches for these patterns and alerts you.

### What It Doesn't Do

❌ Doesn't analyze your code statically  
❌ Doesn't read variable values  
❌ Doesn't prove mathematical correctness  
❌ Doesn't replace code review

It's a **diagnostic tool** - it points out patterns worth investigating.

---

## Production Safety

In production builds, the entire tool is removed:
```json
// package.json - automatic based on NODE_ENV
"exports": {
  ".": {
    "development": "./dist/index.mjs",
    "production": "./dist/production.mjs",  // Zero-op shims
    "default": "./dist/production.mjs"
  }
}
```

**Zero runtime overhead. Zero bundle size increase.**

---

## Comparison to Other Tools

| Tool | What It Detects | When |
|------|----------------|------|
| **React DevTools** | Component renders, props/state values | After the fact |
| **Why Did You Render** | Unnecessary re-renders | During render |
| **ESLint exhaustive-deps** | Missing effect dependencies | Static analysis |
| **react-state-basis** | Redundant state, update chains, loops | Runtime patterns |

They're complementary - use them together.

---

## Skipping Files

Add this comment to skip noisy files:
```tsx
// @basis-ignore
```

Good for:
- Animation loops
- High-frequency timers  
- WebSocket handlers
- Performance-critical code

---

## Limitations

### Current Version (v0.3.x)

**What works well:**
- ✅ Detecting obvious redundant state
- ✅ Flagging effect-driven update chains
- ✅ Catching infinite loops
- ✅ Works in typical React apps

**Known issues:**
- ⚠️ May miss delayed chains (>20ms apart)
- ⚠️ Can flag intentional patterns as issues
- ⚠️ Complex multi-way dependencies might not be caught
- ⚠️ Requires judgment to interpret results

**False positives happen.** Always verify before refactoring.

---

## Roadmap

### v0.4.0 (Next)
- [ ] Zustand integration
- [ ] Redux middleware
- [ ] Better false positive filtering
- [ ] Automated fix suggestions

### v0.5.0 (Future)
- [ ] Visual state dependency graph
- [ ] Domain isolation analysis
- [ ] Historical trend tracking

---

## Contributing

Found a bug? Have an idea? Open an issue or PR.

For technical details on how the detection works, see the [Wiki](https://github.com/liovic/react-state-basis/wiki).

---

## FAQ

**Q: Will this slow down my app?**  
A: Only in development. Production builds are zero-overhead.

**Q: Do I have to change my code?**  
A: No. The Babel plugin instruments hooks automatically.

**Q: What if it flags something that's not a problem?**  
A: Use your judgment. It's a diagnostic tool, not gospel.

**Q: Why "basis"?**  
A: In linear algebra, a "basis" is a minimal set of independent vectors. The name reflects the goal of finding your app's minimal independent state.

---

<div align="center">

Built by [LP](https://github.com/liovic) • MIT License

</div>