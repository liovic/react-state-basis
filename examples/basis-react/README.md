# Basis React Playground

This is the main demo app for **React State Basis**.

This application is intentionally built to fail. It contains a collection of 
components with architectural anti-patterns - the kind you usually find buried 
in legacy codebases, so you can see exactly how Basis detects and reports them.

## Running this example

**Heads up regarding `package.json`:**
By default, this example is configured to test the local build of the library (`file:../../react-state-basis-0.6.0.tgz`).

**If you just want to try it out:**
1.  Open `package.json`.
2.  Delete the `react-state-basis` line.
3.  Run `npm install react-state-basis`.
4.  `npm run dev`.

**If you are developing Basis locally:**
1.  Run `npm pack` in the library root.
2.  Make sure the `.tgz` filename matches `package.json`.
3.  `npm install` and `npm run dev`.

---

## The "Labs" (What to test)

Open your browser console and try these scenarios.

### 1. Weather Lab (Double Renders)
**File:** `src/WeatherLab.tsx`
*   **The Bug:** Using `useEffect` to convert Celsius to Fahrenheit. This forces 
    a second render every time the user types.
*   **Basis Detection:** `⚡ DOUBLE RENDER`. It will tell you to derive the value 
    during the render phase instead.

### 2. Boolean Entanglement (Duplicate State)
**File:** `src/BooleanEntanglement.tsx`
*   **The Bug:** Managing `isLoading`, `isSuccess`, and `hasData` as separate state variables that always update together.
*   **Basis Detection:** `♊ DUPLICATE STATE` / `Boolean Explosion`. It will suggest merging them into a single status string or reducer.

### 3. Global Neural Controller (Prime Movers)
**File:** `src/App.tsx` (Global Override button)
*   **The Bug:** A single button click triggers updates in `AuthContext` and `ThemeContext` simultaneously.
*   **Basis Detection:** `⚡ GLOBAL EVENT`. This is the **v0.6 Graph Engine** in action. It groups these disparate updates into a single "Prime Mover" event to show you where your state is fragmenting.

### 4. The Crash Lab (Safety)
**File:** `src/InfiniteCrashLab.tsx`
*   **The Bug:** A component that updates itself in a loop.
*   **Basis Detection:** `🛑 CIRCUIT BREAKER`. Basis kills the monitoring for that variable before your browser freezes, proving it's safe to use even in broken apps.
