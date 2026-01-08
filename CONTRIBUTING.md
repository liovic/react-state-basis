# Contributing to react-state-basis

First, thank you for your interest. `react-state-basis` is a move away from "voodoo" heuristics toward **Formal Runtime Verification** of React architectures. 

To maintain the mathematical integrity of the engine while scaling the ecosystem, we operate a two-track contribution model.

---

## The Two-Track Policy

### 1. The Core Engine (The Math)
The engine is a formal implementation of Linear Algebra applied to temporal signals. We model the React state-space using finite-dimensional vector spaces and inner product metrics.

*   **Theoretical Foundation:** We use Sheldon Axler’s *Linear Algebra Done Right* as our primary reference. 
*   **Requirement:** The engine is a formal implementation of Linear Algebra applied to temporal signals. Every contribution to `src/core/math.ts` and `src/engine.ts` requires a rigorous understanding of the following concepts as defined by Sheldon Axler.
*   **The Standard:** We do not accept heuristics or "close-enough" math. Every change must maintain the mathematical rank of the system and ensure deterministic signal analysis.

### 2. The Ecosystem & DX (The Plumbing)
We highly value contributions that bridge the gap between math and developer experience.
*   **Integrations:** Adapters for Next.js (SWC), Remix, and Enterprise Webpack configs.
*   **Global State:** Middleware for Zustand, Redux, or Jotai to pipe signals into the Basis engine.
*   **Visualization:** Improving the Temporal Matrix HUD (Canvas optimization, GLSL shaders, or new themes).
*   **Tooling:** Development of `rsb-init` CLI and automated refactoring hints.

---

## Engineering Standards

We are building a **scientific instrument**, not a logger. 
1. **Zero-Overhead Principle:** Side effects within the engine are strictly forbidden.
2. **Deterministic Logic:** All auditing results must be reproducible and predictable based on the temporal vectors.

---

## Workflow

1. **Target Branch:** All Pull Requests must be opened against the **`dev` branch**. Pull Requests opened against `main` will be closed or asked to be retargeted. 
2. **RFC First:** For major features or integrations, please open an Issue with the `RFC` (Request for Comments) tag. 
3. **Atomic Commits:** Keep your changes focused. One PR = One logical improvement.
4. **Ghost Mode Verification:** Ensure that your changes do not leak into the `production.ts` zero-op exports.

---

## Local Development

Developing a React library that intercepts core hooks requires strict management of React instances. If the library and the example app use different React binaries, the engine will fail to initialize (resulting in an empty HUD or "Invalid Hook Call" errors).

### The Recommended Workflow (Yalc)
We prefer **Yalc** over `npm link` because it avoids symlink-related resolution issues in Vite.

1.  **In the project root:**
    ```bash
    npm run build
    yalc publish
    ```
2.  **In the `example` folder:**
    ```bash
    yalc add react-state-basis
    npm install
    npm run dev
    ```

### Using npm link (The "Singleton Wedding")
If you prefer `npm link`, you must perform a "reverse link" to ensure the library and the app share the exact same React instance:

1.  **Register the library:** (In project root)
    ```bash
    npm link
    ```
2.  **Link to the app:** (In `example` folder)
    ```bash
    npm link react-state-basis
    ```
3.  **The Marriage Step:** Force the library to use the app's React (In project root):
    ```bash
    npm link ./example/node_modules/react
    npm link ./example/node_modules/react-dom
    ```

---

## Acknowledgements
Contributors who provide significant architectural insights or build core integrations will be featured in the **Technical Acknowledgements** section of the project.

— LP