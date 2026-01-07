import * as UI from './core/logger';
import { calculateCosineSimilarity } from './core/math';
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

const analyzeBasis = () => {
  if (!instance.config.debug) {
    instance.redundantLabels.clear();
    return;
  }

  const entries = Array.from(instance.history.entries());
  if (entries.length < 2) return;

  const newRedundant = new Set<string>();

  entries.forEach(([labelA, vecA], i) => {
    entries.slice(i + 1).forEach(([labelB, vecB]) => {
      const sim = calculateCosineSimilarity(vecA, vecB);
      
      if (sim > SIMILARITY_THRESHOLD) {
        newRedundant.add(labelA);
        newRedundant.add(labelB);
        UI.displayRedundancyAlert(labelA, labelB, sim, instance.history.size);
      }
    });
  });

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

  // CAUSAL HINT
  if (instance.currentEffectSource && instance.currentEffectSource !== label) {
    UI.displayCausalHint(label, instance.currentEffectSource);
  }

  // BATCHING (20ms)
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