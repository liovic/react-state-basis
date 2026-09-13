# Basis Next Labs

A minimal Next.js App Router project wired up with **React State Basis**,
used to test and demo the SWC/webpack integration.

Unlike the `basis-react` playground, this app is small on purpose - it
exists to prove the Next.js setup works end to end (dev, build, and
`@basis-ignore`), not to showcase every detected pattern.

## Running this example

**Heads up regarding `package.json`:**
By default, this example is configured to test the local build of the
library (`file:../../react-state-basis-0.6.10.tgz`).

**If you just want to try it out:**
1. Open `package.json`.
2. Replace the `react-state-basis` line with a normal version, e.g. `"react-state-basis": "^0.6.10"`.
3. Run `npm install`.
4. `npm run dev`.

**If you are developing Basis locally:**
1. Run `npm run build` in the library root (this also rebuilds the SWC plugin, `dist/swc.wasm`).
2. Run `npm pack` in the library root.
3. Make sure the `.tgz` filename matches `package.json`.
4. `npm install` and `npm run dev`.

---

## Important: this project must run on webpack

Turbopack is the default bundler for both `next dev` and `next build` in
this Next.js version, and the Basis SWC plugin only works under webpack.
Both scripts here already carry the flag:

```json
"dev": "next dev --webpack",
"build": "next build --webpack"
```

If you copy this setup into your own project, don't drop `--webpack` from
either script - without it, hooks still run but stay anonymous, and no
labels or reports are produced.