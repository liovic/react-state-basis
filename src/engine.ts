// src/engine.ts

import * as UI from './core/logger';
import { calculateSimilarityCircular } from './core/math';
import {
  WINDOW_SIZE,
  SIMILARITY_THRESHOLD,
  LOOP_THRESHOLD,
  ANALYSIS_INTERVAL,
  VOLATILITY_THRESHOLD
} from './core/constants';

export interface StateOptions { label?: string; suppressAll?: boolean; }
interface RingBufferMetadata { buffer: Uint8Array; head: number; options: StateOptions; }
interface PerformanceMetrics { lastAnalysisTimeMs: number; comparisonCount: number; lastAnalysisTimestamp: number; }

interface BasisEngineState {
  config: { debug: boolean };
  history: Map<string, RingBufferMetadata>;
  currentTickBatch: Set<string>;
  redundantLabels: Set<string>;
  booted: boolean;
  tick: number;
  isBatching: boolean;
  currentEffectSource: string | null;
  pausedVariables: Set<string>;
  metrics: PerformanceMetrics;
  alertCount: number;
  loopCounters: Map<string, number>;
  lastCleanup: number;
}

const BASIS_INSTANCE_KEY = Symbol.for('__basis_engine_instance__');

const getGlobalInstance = (): BasisEngineState => {
  const root = globalThis as any;
  if (!root[BASIS_INSTANCE_KEY]) {
    root[BASIS_INSTANCE_KEY] = {
      config: { debug: false },
      history: new Map(),
      currentTickBatch: new Set(),
      redundantLabels: new Set(),
      booted: false,
      tick: 0,
      isBatching: false,
      currentEffectSource: null,
      pausedVariables: new Set(),
      metrics: { lastAnalysisTimeMs: 0, comparisonCount: 0, lastAnalysisTimestamp: 0 },
      alertCount: 0,
      loopCounters: new Map(),
      lastCleanup: Date.now()
    };
  }
  return root[BASIS_INSTANCE_KEY];
};

const instance = getGlobalInstance();
export const { config, history, redundantLabels, currentTickBatch } = instance;

// Internal registries
let currentTickRegistry: Record<string, boolean> = {};
const dirtyLabels = new Set<string>();

/**
 * HEURISTIC ANALYSIS (O(D * N))
 * Runs in idle time to detect architectural debt.
 */
const analyzeBasis = () => {
  if (!instance.config.debug) {
    instance.redundantLabels.clear();
    return;
  }

  const scheduler = (globalThis as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 1));

  scheduler(() => {
    const analysisStart = performance.now();
    if (dirtyLabels.size === 0) return;

    const allEntries: { label: string; meta: RingBufferMetadata; density: number }[] = [];
    const dirtyEntries: { label: string; meta: RingBufferMetadata; density: number }[] = [];

    // Pre-pass
    instance.history.forEach((meta, label) => {
      if (meta.options.suppressAll) return;
      let density = 0;
      for (let k = 0; k < meta.buffer.length; k++) density += meta.buffer[k];
      if (density >= 2) {
        const entry = { label, meta, density };
        allEntries.push(entry);
        if (dirtyLabels.has(label)) dirtyEntries.push(entry);
      }
    });

    if (dirtyEntries.length === 0 || allEntries.length < 2) {
      dirtyLabels.clear();
      return;
    }

    const nextRedundant = new Set<string>();
    let compCount = 0;

    // Persist existing redundancy for non-moving parts
    instance.redundantLabels.forEach(l => { if (!dirtyLabels.has(l)) nextRedundant.add(l); });

    // Pairwise Reactive Loop
    for (const dirtyEntry of dirtyEntries) {
      for (const otherEntry of allEntries) {
        if (dirtyEntry.label === otherEntry.label) continue;

        // Zero Double-Math
        if (dirtyLabels.has(otherEntry.label) && dirtyEntry.label > otherEntry.label) continue;

        compCount++;
        const sync = calculateSimilarityCircular(dirtyEntry.meta.buffer, dirtyEntry.meta.head, otherEntry.meta.buffer, otherEntry.meta.head, 0);
        const bA = calculateSimilarityCircular(dirtyEntry.meta.buffer, dirtyEntry.meta.head, otherEntry.meta.buffer, otherEntry.meta.head, 1);
        const aB = calculateSimilarityCircular(dirtyEntry.meta.buffer, dirtyEntry.meta.head, otherEntry.meta.buffer, otherEntry.meta.head, -1);
        const maxSim = Math.max(sync, bA, aB);

        if (maxSim > SIMILARITY_THRESHOLD) {
          const bothVolatile = dirtyEntry.density > VOLATILITY_THRESHOLD && otherEntry.density > VOLATILITY_THRESHOLD;
          if (sync === maxSim && !bothVolatile) {
            nextRedundant.add(dirtyEntry.label); nextRedundant.add(otherEntry.label);
            UI.displayRedundancyAlert(dirtyEntry.label, otherEntry.label, sync);
          } else if (bA === maxSim) UI.displayCausalHint(otherEntry.label, dirtyEntry.label, 'math');
          else if (aB === maxSim) UI.displayCausalHint(dirtyEntry.label, otherEntry.label, 'math');
        }
      }
    }

    dirtyLabels.clear();
    instance.redundantLabels.clear();
    nextRedundant.forEach(l => instance.redundantLabels.add(l));
    instance.metrics.lastAnalysisTimeMs = performance.now() - analysisStart;
    instance.metrics.comparisonCount = compCount;
    instance.metrics.lastAnalysisTimestamp = Date.now();
  });
};

const processHeartbeat = () => {
  instance.tick++;
  instance.history.forEach((meta, label) => {
    meta.buffer[meta.head] = instance.currentTickBatch.has(label) ? 1 : 0;
    meta.head = (meta.head + 1) % WINDOW_SIZE;
  });
  instance.currentTickBatch.clear();
  currentTickRegistry = {};
  instance.isBatching = false;
  if (instance.tick % ANALYSIS_INTERVAL === 0) analyzeBasis();
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

  // SECURITY: HARD CIRCUIT BREAKER
  if (count > LOOP_THRESHOLD) {
    UI.displayViolentBreaker(label, count, LOOP_THRESHOLD);
    instance.pausedVariables.add(label);
    return false;
  }

  // CAUSAL TRACKING
  if (instance.currentEffectSource && instance.currentEffectSource !== label) {
    UI.displayCausalHint(label, instance.currentEffectSource, 'tracking');
  }

  // PERFORMANCE: ATOMIC BAILOUT
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

// --- LIFECYCLE ---

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
    instance.history.set(l, { buffer: new Uint8Array(WINDOW_SIZE), head: 0, options: o });
  }
};

export const unregisterVariable = (l: string) => {
  instance.history.delete(l);
};

export const beginEffectTracking = (l: string) => {
  if (instance.config.debug) instance.currentEffectSource = l;
};

export const endEffectTracking = () => {
  instance.currentEffectSource = null;
};

/**
 * DISPLAY: window.printBasisReport()
 */
export const printBasisHealthReport = (threshold = 0.5) => {
  if (!instance.config.debug) {
    console.warn('[Basis] Cannot generate report. Debug mode is OFF.');
    return;
  }
  UI.displayHealthReport(instance.history, threshold);
};

export const getBasisMetrics = () => ({
  engine: 'v0.4.2 (Ring Buffer)',
  hooks: instance.history.size,
  load: instance.metrics.comparisonCount,
  analysis_ms: instance.metrics.lastAnalysisTimeMs.toFixed(3)
});

// Global Attachments
if (typeof window !== 'undefined') {
  (window as any).printBasisReport = printBasisHealthReport;
  (window as any).getBasisMetrics = getBasisMetrics;
}

export const __testEngine__ = {
  instance,
  history: instance.history,
  configureBasis,
  registerVariable,
  unregisterVariable,
  recordUpdate,
  printBasisHealthReport,
  beginEffectTracking,
  endEffectTracking
};