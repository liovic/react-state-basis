// src/engine.ts

import * as UI from './core/logger';
import { calculateSimilarityWithOffset, calculateCosineSimilarity } from './core/math';
import {
  WINDOW_SIZE,
  SIMILARITY_THRESHOLD,
  LOOP_THRESHOLD,
  LOOP_WINDOW_MS,
  ANALYSIS_INTERVAL
} from './core/constants';

interface BasisEngineState {
  config: { debug: boolean };
  history: Map<string, number[]>;
  currentTickBatch: Set<string>;
  redundantLabels: Set<string>;
  booted: boolean;
  updateLog: { label: string; ts: number }[];
  tick: number;
  isBatching: boolean;
  currentEffectSource: string | null;
}

const GLOBAL_KEY = '__BASIS_ENGINE_INSTANCE__';

const getGlobalInstance = (): BasisEngineState => {
  const g = (typeof window !== 'undefined' ? window : global) as any;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      config: { debug: false },
      history: new Map<string, number[]>(),
      currentTickBatch: new Set<string>(),
      redundantLabels: new Set<string>(),
      booted: false,
      updateLog: [],
      tick: 0,
      isBatching: false,
      currentEffectSource: null
    };
  }
  return g[GLOBAL_KEY];
};

const instance = getGlobalInstance();

export const config = instance.config;
export const history = instance.history;
export const currentTickBatch = instance.currentTickBatch;
export const redundantLabels = instance.redundantLabels;

export const configureBasis = (newConfig: Partial<{ debug: boolean }>) => {
  Object.assign(instance.config, newConfig);

  if (instance.config.debug && !instance.booted) {
    UI.displayBootLog(WINDOW_SIZE);
    instance.booted = true;
  }
};

/**
 * HELPER: Compares two vectors across three temporal planes:
 * 1. Sync (Same 20ms window)
 * 2. Lag A (B follows A) (A happens at T, B happens at T+1)
 * 3. Lag B (A follows B) (B happens at T, A happens at T+1)
 */
const getTemporalSimilarity = (vecA: number[], vecB: number[]) => {
  const L = vecA.length;

  const sync = calculateSimilarityWithOffset(vecA, vecB, 0, 0, L);
  const bFollowsA = calculateSimilarityWithOffset(vecA, vecB, 0, 1, L - 1);
  const aFollowsB = calculateSimilarityWithOffset(vecA, vecB, 1, 0, L - 1);

  return { sync, bFollowsA, aFollowsB };
};

const analyzeBasis = () => {
  if (!instance.config.debug) {
    instance.redundantLabels.clear();
    return;
  }

  // FILTER: Only look at variables that have updated at least twice.
  const entries = Array.from(instance.history.entries()).filter(([_, vec]) => {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) sum += vec[i];
    return sum >= 2;
  });

  if (entries.length < 2) return;

  const newRedundant = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [labelA, vecA] = entries[i];
      const [labelB, vecB] = entries[j];

      const { sync, bFollowsA, aFollowsB } = getTemporalSimilarity(vecA, vecB);

      const maxSim = Math.max(sync, bFollowsA, aFollowsB);

      if (maxSim > SIMILARITY_THRESHOLD) {
        if (sync === maxSim) {
          newRedundant.add(labelA);
          newRedundant.add(labelB);
          UI.displayRedundancyAlert(labelA, labelB, sync);
        }
        else if (bFollowsA === maxSim) {
          UI.displayCausalHint(labelB, labelA, 'math');
        }
        else if (aFollowsB === maxSim) {
          UI.displayCausalHint(labelA, labelB, 'math');
        }
      }
    }
  }

  instance.redundantLabels.clear();
  newRedundant.forEach(label => instance.redundantLabels.add(label));
};

export const recordUpdate = (label: string): boolean => {
  if (!instance.config.debug) return true;

  const now = Date.now();

  // CIRCUIT BREAKER
  instance.updateLog.push({ label, ts: now });
  instance.updateLog = instance.updateLog.filter(e => now - e.ts < LOOP_WINDOW_MS);

  if (instance.updateLog.filter(e => e.label === label).length > LOOP_THRESHOLD) {
    UI.displayInfiniteLoop(label);
    return false;
  }

  // DIRECT CAUSAL TRACKING
  if (instance.currentEffectSource && instance.currentEffectSource !== label) {
    UI.displayCausalHint(label, instance.currentEffectSource, 'tracking');
  }

  instance.currentTickBatch.add(label);

  if (!instance.isBatching) {
    instance.isBatching = true;

    setTimeout(() => {
      instance.tick++;

      instance.history.forEach((vec, l) => {
        vec.shift();
        vec.push(instance.currentTickBatch.has(l) ? 1 : 0);
      });

      instance.currentTickBatch.clear();
      instance.isBatching = false;

      if (instance.tick % ANALYSIS_INTERVAL === 0) {
        analyzeBasis();
      }
    }, 20);
  }

  return true;
};

// LIFECYCLE 
export const beginEffectTracking = (label: string) => {
  if (instance.config.debug) instance.currentEffectSource = label;
};

export const endEffectTracking = () => {
  instance.currentEffectSource = null;
};

export const registerVariable = (label: string) => {
  if (!instance.config.debug) return;

  if (!instance.history.has(label)) {
    instance.history.set(label, new Array(WINDOW_SIZE).fill(0));
  }
};

export const unregisterVariable = (label: string) => {
  instance.history.delete(label);
};

export const printBasisHealthReport = (threshold = 0.5) => {
  if (!instance.config.debug) {
    console.warn("[Basis] Cannot generate report. Debug mode is OFF.");
    return;
  }
  UI.displayHealthReport(instance.history, calculateCosineSimilarity, threshold);
};

if (typeof window !== 'undefined') {
  (window as any).printBasisReport = printBasisHealthReport;
}

export const __testEngine__ = {
  instance,
  config: instance.config,
  history: instance.history,
  currentTickBatch: instance.currentTickBatch,
  configureBasis,
  registerVariable,
  recordUpdate,
  printBasisHealthReport,
  beginEffectTracking,
  endEffectTracking,
};