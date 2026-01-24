// src/core/logger.ts

import { calculateCosineSimilarity } from "./math";

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

interface RingBufferMetadata {
  buffer: Uint8Array;
  head: number;
  options: any;
}

const LAST_LOG_TIMES = new Map<string, number>();
const LOG_COOLDOWN = 5000; // 5 seconds suppression between identical alerts

const STYLES = {
  basis: "background: #6c5ce7; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
  version: "background: #a29bfe; color: #2d3436; padding: 2px 6px; border-radius: 3px; margin-left: -4px;",
  headerRed: "background: #d63031; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerBlue: "background: #0984e3; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerGreen: "background: #00b894; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  label: "background: #dfe6e9; color: #2d3436; padding: 0 4px; border-radius: 3px; font-family: monospace; font-weight: bold; border: 1px solid #b2bec3;",
  location: "color: #0984e3; font-family: monospace; font-weight: bold;",
  impact: "background: #f1f2f6; color: #2f3542; padding: 0 4px; border-radius: 3px; font-weight: bold;",
  subText: "color: #636e72; font-size: 11px;",
  bold: "font-weight: bold;",
  actionMemo: "color: #00b894; font-weight: bold; border: 1px solid #00b894; padding: 0 4px; border-radius: 3px;",
  actionDelete: "color: #d63031; font-weight: bold; border: 1px solid #d63031; padding: 0 4px; border-radius: 3px;"
};

const parseLabel = (label: string) => {
  const parts = label.split(' -> ');
  return { file: parts[0] || "Unknown", name: parts[1] || label };
};

const shouldLog = (key: string) => {
  const now = Date.now();
  const last = LAST_LOG_TIMES.get(key) || 0;

  if (now - last > LOG_COOLDOWN) {
    LAST_LOG_TIMES.set(key, now);

    // Garbage collection for log times
    if (LAST_LOG_TIMES.size > 100) {
      const cutoff = now - 3600000; // 1 hour
      for (const [k, v] of LAST_LOG_TIMES.entries()) {
        if (v < cutoff) LAST_LOG_TIMES.delete(k);
      }
    }
    return true;
  }
  return false;
};

export const displayBootLog = (windowSize: number) => {
  if (!isWeb) return;
  console.log(
    `%cBasis%cAuditor%c | Temporal Analysis Active (Window: ${windowSize})`,
    STYLES.basis, STYLES.version, "color: #636e72; font-style: italic; margin-left: 8px;"
  );
};

export const displayRedundancyAlert = (labelA: string, labelB: string, sim: number) => {
  if (!isWeb || !shouldLog(`redundant-${labelA}-${labelB}`)) return;

  const infoA = parseLabel(labelA);
  const infoB = parseLabel(labelB);

  console.group(`%c ♊ BASIS | TWIN STATE DETECTED `, STYLES.headerRed);
  console.log(`%c📍 Location: %c${infoA.file}`, STYLES.bold, STYLES.location);

  console.log(
    `%cThe Rhythm:%c %c${infoA.name}%c and %c${infoB.name}%c are moving in perfect sync.\n` +
    `%cThis indicates that one is a redundant shadow of the other. Confidence: ${(sim * 100).toFixed(0)}%`,
    STYLES.bold, "", STYLES.label, "", STYLES.label, "", STYLES.subText
  );

  console.log(
    `%cRecommended Fix:%c Derive %c${infoB.name}%c from %c${infoA.name}%c during the render pass.`,
    STYLES.bold, "", STYLES.actionMemo, "", STYLES.bold, ""
  );
  console.groupEnd();
};

export const displayCausalHint = (targetLabel: string, sourceLabel: string, method: 'math' | 'tracking' = 'math') => {
  const key = `causal-${sourceLabel}-${targetLabel}`;
  if (!isWeb || !shouldLog(key)) return;

  const target = parseLabel(targetLabel);
  const source = parseLabel(sourceLabel);

  console.groupCollapsed(
    `%c ⚡ BASIS | DOUBLE RENDER CYCLE `,
    STYLES.headerBlue
  );
  console.log(`%c📍 Location: %c${target.file}`, STYLES.bold, STYLES.location);
  console.log(
    `%cThe Rhythm:%c %c${source.name}%c pulses, then %c${target.name}%c pulses one frame later.`,
    STYLES.bold, "", STYLES.label, "", STYLES.label, ""
  );
  console.log(
    `%cThe Impact:%c You are forcing %c2 render passes%c for a single logical change.`,
    STYLES.bold, "", STYLES.impact, ""
  );
  console.log(
    `%cRecommended Fix:%c Remove the useEffect. Calculate %c${target.name}%c as a derived value or projection.`,
    STYLES.bold, "", STYLES.actionDelete, ""
  );
  console.groupEnd();
};

export const displayViolentBreaker = (label: string, count: number, threshold: number) => {
  if (!isWeb) return;
  const parts = label.split(' -> ');

  console.group(
    `%c ⚠️  CRITICAL SYSTEM ALERT | BASIS ENGINE `,
    'background: #dc2626; color: white; font-weight: bold; padding: 8px 16px; font-size: 14px;'
  );
  console.error(
    `%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    'color: #dc2626; font-weight: bold;'
  );
  console.error(
    `%cINFINITE LOOP DETECTED\n\n` +
    `%cVariable: %c${parts[1] || label}\n` +
    `%cUpdate Frequency: %c${count} updates/sec\n` +
    `%cExpected Maximum: %c${threshold} updates\n\n` +
    `%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    'color: #dc2626; font-size: 16px; font-weight: bold;',
    'color: #71717a; font-weight: bold;', `color: white; background: #dc2626; padding: 2px 8px;`,
    'color: #71717a; font-weight: bold;', `color: #fbbf24; font-weight: bold;`,
    'color: #71717a; font-weight: bold;', `color: #fbbf24; font-weight: bold;`,
    'color: #dc2626; font-weight: bold;'
  );
  console.log(
    `%cDIAGNOSTICS:\n` +
    `1. Check for setState inside the render body.\n` +
    `2. Verify useEffect dependencies (missing or unstable refs).\n` +
    `3. Look for circular chains (State A -> B -> A).\n\n` +
    `%cSYSTEM ACTION: Update BLOCKED. Fix your code to resume monitoring.`,
    'color: #71717a;', 'color: #dc2626; font-weight: bold;'
  );
  console.groupEnd();
};

export const displayHealthReport = (history: Map<string, RingBufferMetadata>, threshold: number) => {
  const entries = Array.from(history.entries());
  const totalVars = entries.length;
  if (totalVars === 0) return;

  const clusters: string[][] = [];
  const processed = new Set<string>();
  let independentCount = 0;

  // Decompose subspaces
  entries.forEach(([labelA, metaA]) => {
    if (processed.has(labelA)) return;
    const currentCluster = [labelA];
    processed.add(labelA);
    entries.forEach(([labelB, metaB]) => {
      if (labelA === labelB || processed.has(labelB)) return;
      const sim = calculateCosineSimilarity(metaA.buffer, metaB.buffer);
      if (sim > threshold) {
        currentCluster.push(labelB);
        processed.add(labelB);
      }
    });
    if (currentCluster.length > 1) clusters.push(currentCluster); else independentCount++;
  });

  const systemRank = independentCount + clusters.length;
  const healthScore = (systemRank / totalVars) * 100;

  if (isWeb) {
    console.group(`%c 📊 BASIS | ARCHITECTURAL HEALTH REPORT `, STYLES.headerGreen);
    console.log(
      `%cSystem Efficiency: %c${healthScore.toFixed(1)}% %c(Basis Vectors: ${systemRank} / Total Hooks: ${totalVars})`,
      STYLES.bold,
      `color: ${healthScore > 85 ? '#00b894' : '#d63031'}; font-size: 16px; font-weight: bold;`,
      "color: #636e72; font-style: italic;"
    );

    if (clusters.length > 0) {
      console.log(`%cDetected ${clusters.length} Entangled Clusters:`, "font-weight: bold; color: #e17055; margin-top: 10px;");
      clusters.forEach((cluster, idx) => {
        const names = cluster.map(l => parseLabel(l).name).join(' ⟷ ');
        console.log(` %c${idx + 1}%c ${names}`, "background: #e17055; color: white; border-radius: 50%; padding: 0 5px;", "font-family: monospace;");
      });
      console.log("%c💡 Analysis: These variables are mirrored. Storing them separately creates unnecessary work for React.", STYLES.subText);
    } else {
      console.log("%c✨ All state variables are independent. Your architectural Basis is healthy.", "color: #00b894; font-weight: bold; margin-top: 10px;");
    }

    if (totalVars > 0 && totalVars < 20) {
      console.groupCollapsed("%cView Full Correlation Matrix", "color: #636e72; font-size: 11px;");
      const matrix: any = {};
      entries.forEach(([labelA, metaA]) => {
        const nameA = parseLabel(labelA).name;
        matrix[nameA] = {};
        entries.forEach(([labelB, metaB]) => {
          const nameB = parseLabel(labelB).name;
          const sim = calculateCosineSimilarity(metaA.buffer, metaB.buffer);
          matrix[nameA][nameB] = sim > threshold ? `❌ ${(sim * 100).toFixed(0)}%` : `✅`;
        });
      });
      console.table(matrix);
      console.groupEnd();
    }
    console.groupEnd();
  }
};