// src/core/analysis.ts

import * as UI from './logger';
import { calculateSimilarityCircular } from './math';
import { SIMILARITY_THRESHOLD } from './constants';
import { SignalRole, Entry } from './types';

interface Similarities {
  sync: number;
  bA: number;
  aB: number;
  max: number;
}

const calculateAllSimilarities = (entryA: Entry, entryB: Entry): Similarities => {
  const sync = calculateSimilarityCircular(entryA.meta.buffer, entryA.meta.head, entryB.meta.buffer, entryB.meta.head, 0);
  const bA = calculateSimilarityCircular(entryA.meta.buffer, entryA.meta.head, entryB.meta.buffer, entryB.meta.head, 1);
  const aB = calculateSimilarityCircular(entryA.meta.buffer, entryA.meta.head, entryB.meta.buffer, entryB.meta.head, -1);
  return { sync, bA, aB, max: Math.max(sync, bA, aB) };
};

const shouldSkipComparison = (entryA: Entry, entryB: Entry, dirtyLabels: Set<string>): boolean => {
  if (entryA.label === entryB.label) return true;

  if (dirtyLabels.has(entryB.label) && entryA.label > entryB.label) return true;

  return false;
};

const detectRedundancy = (entryA: Entry, entryB: Entry, similarities: Similarities, redundantSet: Set<string>): void => {
  const roleA = entryA.meta.role;
  const roleB = entryB.meta.role;

  // Context-to-Context correlation is architecturally valid
  if (roleA === SignalRole.CONTEXT && roleB === SignalRole.CONTEXT) return;

  // Require 2+ updates for statistical confidence (avoid false positives)
  if (entryA.meta.density < 2 || entryB.meta.density < 2) return;

  // Case 1: Local state mirroring Context (U ∩ W ≠ {0})
  if (roleA === SignalRole.LOCAL && roleB === SignalRole.CONTEXT) {
    redundantSet.add(entryA.label);  // Mark LOCAL as redundant (context is source of truth)
    UI.displayRedundancyAlert(entryA.label, entryA.meta, entryB.label, entryB.meta, similarities.max);
  }
  // Case 2: Context mirroring Local (reverse of Case 1)
  else if (roleA === SignalRole.CONTEXT && roleB === SignalRole.LOCAL) {
    redundantSet.add(entryB.label);  // Mark LOCAL as redundant
    UI.displayRedundancyAlert(entryB.label, entryB.meta, entryA.label, entryA.meta, similarities.max);
  }
  // Case 3: Duplicate Local State (both in U subspace, but correlated)
  else if (roleA === SignalRole.LOCAL && roleB === SignalRole.LOCAL) {
    redundantSet.add(entryA.label);
    redundantSet.add(entryB.label);
    UI.displayRedundancyAlert(entryA.label, entryA.meta, entryB.label, entryB.meta, similarities.max);
  }
};

const detectCausalLeak = (entryA: Entry, entryB: Entry, similarities: Similarities): void => {
  // Skip warnings for high-frequency updates (animations, >VOLATILITY_THRESHOLD updates in buffer)
  // These are intentional and expected to update rapidly
  if (entryA.isVolatile || entryB.isVolatile) return;

  // B leads A: B updated, then A updated next frame (B causes A)
  if (similarities.bA === similarities.max) {
    UI.displayCausalHint(entryB.label, entryB.meta, entryA.label, entryA.meta);
  }
  // A leads B: A updated, then B updated next frame (A causes B)
  else if (similarities.aB === similarities.max) {
    UI.displayCausalHint(entryA.label, entryA.meta, entryB.label, entryB.meta);
  }
};

export const detectSubspaceOverlap = (
  dirtyEntries: Entry[],
  allEntries: Entry[],
  redundantSet: Set<string>,
  dirtyLabels: Set<string>
): number => {
  let compCount = 0;

  for (const entryA of dirtyEntries) {
    for (const entryB of allEntries) {
      if (shouldSkipComparison(entryA, entryB, dirtyLabels)) continue;

      compCount++;
      const similarities = calculateAllSimilarities(entryA, entryB);

      if (similarities.max > SIMILARITY_THRESHOLD) {
        detectRedundancy(entryA, entryB, similarities, redundantSet);
        detectCausalLeak(entryA, entryB, similarities);
      }
    }
  }

  return compCount;
};
