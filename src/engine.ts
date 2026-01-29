// src/engine.ts

import * as UI from './core/logger';
import { detectSubspaceOverlap } from './core/analysis';
import {
  SignalRole,
  StateOptions,
  RingBufferMetadata,
  BasisEngineState,
  Entry
} from './core/types';
import {
  WINDOW_SIZE,
  LOOP_THRESHOLD,
  VOLATILITY_THRESHOLD
} from './core/constants';

// --- Static Internal State ---

const BASIS_INSTANCE_KEY = Symbol.for('__basis_engine_instance__');

// Pre-allocated static signal to prevent GC churn in high-frequency causal tracking
const NULL_SIGNAL: RingBufferMetadata = {
  role: SignalRole.PROJECTION,
  buffer: new Uint8Array(0),
  head: 0,
  density: 0,
  options: {}
};

/**
 * GLOBAL SINGLETON HMR BRIDGE
 * Ensures the state history survives Hot Module Replacement cycles.
 */
const getGlobalInstance = (): BasisEngineState => {
  const root = globalThis as any;
  if (!root[BASIS_INSTANCE_KEY]) {
    root[BASIS_INSTANCE_KEY] = {
      config: { debug: false },
      history: new Map<string, RingBufferMetadata>(),
      currentTickBatch: new Set<string>(),
      redundantLabels: new Set<string>(),
      booted: false,
      tick: 0,
      isBatching: false,
      currentEffectSource: null,
      pausedVariables: new Set<string>(),
      metrics: {
        lastAnalysisTimeMs: 0,
        comparisonCount: 0,
        lastAnalysisTimestamp: 0,
        systemEntropy: 0
      },
      alertCount: 0,
      loopCounters: new Map<string, number>(),
      lastCleanup: Date.now()
    };
  }
  return root[BASIS_INSTANCE_KEY];
};

const instance = getGlobalInstance();

export const config = instance.config;
export const history = instance.history;
export const redundantLabels = instance.redundantLabels;
export const currentTickBatch = instance.currentTickBatch;

let currentTickRegistry: Record<string, boolean> = {};
const dirtyLabels = new Set<string>();

/**
 * TEMPORAL ENTROPY
 * Quantifies the information density of a specific tick.
 */
const calculateTickEntropy = (tickIdx: number) => {
  let activeCount = 0;
  const total = instance.history.size;
  if (total === 0) return 1;

  instance.history.forEach((meta: RingBufferMetadata) => {
    if (meta.buffer[tickIdx] === 1) activeCount++;
  });
  return 1 - (activeCount / total);
};

export const analyzeBasis = () => {
  if (!instance.config.debug || dirtyLabels.size === 0) {
    return;
  }

  const scheduler = (globalThis as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 1));

  // 1. ATOMIC SWAP: Capture current dirty state and clear immediately.
  // This ensures updates happening DURING analysis are captured for the next frame.
  const snapshot = new Set(dirtyLabels);
  dirtyLabels.clear();

  scheduler(() => {
    const analysisStart = performance.now();
    const allEntries: Entry[] = [];
    const dirtyEntries: Entry[] = [];

    // 2. Collect entries based on the snapshot
    instance.history.forEach((meta: RingBufferMetadata, label: string) => {
      if (meta.options.suppressAll || meta.density === 0) return;

      const entry: Entry = {
        label, meta,
        isVolatile: meta.density > VOLATILITY_THRESHOLD
      };

      allEntries.push(entry);
      if (snapshot.has(label)) {
        dirtyEntries.push(entry);
      }
    });

    if (dirtyEntries.length === 0 || allEntries.length < 2) return;

    // 3. PERSISTENCE: Maintain debt markers for signals that weren't in the snapshot
    const nextRedundant = new Set<string>();
    instance.redundantLabels.forEach((l: string) => {
      if (!snapshot.has(l)) {
        nextRedundant.add(l);
      }
    });

    // 4. LOGIC PASS: Direct Sum Decomposition
    const compCount = detectSubspaceOverlap(
      dirtyEntries,
      allEntries,
      nextRedundant,
      snapshot
    );

    // 5. COMMIT: Update the global engine state
    instance.redundantLabels.clear();
    nextRedundant.forEach((l: string) => {
      instance.redundantLabels.add(l);
    });

    instance.metrics.lastAnalysisTimeMs = performance.now() - analysisStart;
    instance.metrics.comparisonCount = compCount;
    instance.metrics.lastAnalysisTimestamp = Date.now();
  });
};

const processHeartbeat = () => {
  instance.tick++;

  instance.history.forEach((meta: RingBufferMetadata, label: string) => {
    const oldValue = meta.buffer[meta.head];
    const newValue = instance.currentTickBatch.has(label) ? 1 : 0;

    // Density Update with drift prevention
    meta.buffer[meta.head] = newValue;
    if (oldValue !== newValue) {
      meta.density += (newValue - oldValue);
    }

    meta.head = (meta.head + 1) % WINDOW_SIZE;
  });

  const lastHead = (instance.history.size > 0) ? (instance.tick % WINDOW_SIZE) : 0;
  instance.metrics.systemEntropy = calculateTickEntropy(lastHead);

  instance.currentTickBatch.clear();
  currentTickRegistry = {};
  instance.isBatching = false;

  // Reactive trigger: Audit if signals are dirty
  if (dirtyLabels.size > 0) {
    analyzeBasis();
  }
};

/**
 * INTERCEPTION LAYER
 * Called by hook proxies to record state pulses.
 */
export const recordUpdate = (label: string): boolean => {
  if (!instance.config.debug) return true;
  if (instance.pausedVariables.has(label)) return false;

  const now = Date.now();
  if (now - instance.lastCleanup > 1000) {
    instance.loopCounters.clear();
    instance.lastCleanup = now;
  }

  const count = (instance.loopCounters.get(label) || 0) + 1;
  instance.loopCounters.set(label, count);

  // SECURITY: Hard Circuit Breaker
  if (count > LOOP_THRESHOLD) {
    UI.displayViolentBreaker(label, count, LOOP_THRESHOLD);
    instance.pausedVariables.add(label);
    return false;
  }

  if (instance.currentEffectSource && instance.currentEffectSource !== label) {
    const targetMeta = instance.history.get(label);
    const sourceMeta = instance.history.get(instance.currentEffectSource);

    if (targetMeta) {
      const sourceDensity = sourceMeta?.density || 0;
      const isVolatile = targetMeta.density > VOLATILITY_THRESHOLD || sourceDensity > VOLATILITY_THRESHOLD;

      if (!isVolatile) {
        UI.displayCausalHint(label, targetMeta, instance.currentEffectSource, sourceMeta || NULL_SIGNAL);
      }
    }
  }

  // BATCHING: Align updates into a single temporal tick
  if (currentTickRegistry[label]) return true;

  currentTickRegistry[label] = true;
  instance.currentTickBatch.add(label);
  dirtyLabels.add(label);

  if (!instance.isBatching) {
    instance.isBatching = true;
    requestAnimationFrame(processHeartbeat);
  }

  return true;
};

// --- LIFECYCLE API ---

export const configureBasis = (c: any) => {
  Object.assign(instance.config, c);
  if (instance.config.debug && !instance.booted) {
    UI.displayBootLog(WINDOW_SIZE);
    instance.booted = true;
  }
};

export const registerVariable = (l: string, o: StateOptions = {}) => {
  if (!instance.config.debug || o.suppressAll) return;
  if (!instance.history.has(l)) {
    instance.history.set(l, {
      buffer: new Uint8Array(WINDOW_SIZE),
      head: 0,
      density: 0,
      options: o,
      role: o.role || SignalRole.LOCAL
    });
  }
};

export const unregisterVariable = (l: string) => {
  instance.history.delete(l);
  instance.loopCounters.delete(l);
  instance.pausedVariables.delete(l);
  instance.redundantLabels.delete(l);
};

export const beginEffectTracking = (l: string) => {
  if (instance.config.debug) instance.currentEffectSource = l;
};

export const endEffectTracking = () => {
  instance.currentEffectSource = null;
};

export const printBasisHealthReport = (threshold = 0.5) => {
  if (!instance.config.debug) return;
  UI.displayHealthReport(instance.history, threshold);
};

export const getBasisMetrics = () => ({
  engine: 'v0.5.x',
  hooks: instance.history.size,
  analysis_ms: instance.metrics.lastAnalysisTimeMs.toFixed(3),
  entropy: instance.metrics.systemEntropy.toFixed(3)
});

// Global Attachments
if (typeof window !== 'undefined') {
  (window as any).printBasisReport = printBasisHealthReport;
  (window as any).getBasisMetrics = getBasisMetrics;
}

export const __testEngine__ = {
  instance,
  history,
  configureBasis,
  registerVariable,
  unregisterVariable,
  recordUpdate,
  printBasisHealthReport,
  analyzeBasis,
  beginEffectTracking,
  endEffectTracking
};
