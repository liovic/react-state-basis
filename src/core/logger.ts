// src/core/logger.ts

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const LAST_LOG_TIMES = new Map<string, number>();
const LOG_COOLDOWN = 5000; // 5 seconds between same alerts

const STYLES = {
  basis: "background: #6c5ce7; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
  version: "background: #a29bfe; color: #2d3436; padding: 2px 6px; border-radius: 3px; margin-left: -4px;",
  headerRed: "background: #d63031; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerBlue: "background: #0984e3; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerGreen: "background: #00b894; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  label: "background: #dfe6e9; color: #2d3436; padding: 0 4px; border-radius: 3px; font-family: monospace; font-weight: bold; border: 1px solid #b2bec3;",
  location: "color: #0984e3; font-family: monospace; font-weight: bold;",
  codeBlock: "background: #1e1e1e; color: #9cdcfe; padding: 8px 12px; display: block; margin: 4px 0; border-left: 3px solid #00b894; font-family: monospace; line-height: 1.4; border-radius: 0 3px 3px 0;",
  subText: "color: #636e72; font-size: 11px;",
  bold: "font-weight: bold;"
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

  console.group(`%c 📐 BASIS | REDUNDANT PATTERN `, STYLES.headerRed);
  console.log(`%c📍 Location: %c${infoA.file}`, STYLES.bold, STYLES.location);

  console.log(
    `%cObservation:%c %c${infoA.name}%c and %c${infoB.name}%c move together.\n` +
    `%cOne is likely a direct mirror of the other. Confidence: ${(sim * 100).toFixed(0)}%`,
    STYLES.bold,
    "",
    STYLES.label,
    "",
    STYLES.label,
    "",
    STYLES.subText
  );

  console.log(
    `%cAction:%c Refactor %c${infoB.name}%c to useMemo.`,
    "color: #00b894; font-weight: bold;", "", "color: #e84393; font-weight: bold;", ""
  );
  console.groupEnd();
};

export const displayCausalHint = (targetLabel: string, sourceLabel: string, method: 'math' | 'tracking' = 'math') => {
  const key = `causal-${sourceLabel}-${targetLabel}`;
  if (!isWeb || !shouldLog(key)) return;

  const target = parseLabel(targetLabel);
  const source = parseLabel(sourceLabel);

  console.groupCollapsed(
    `%c 💡 BASIS | ${method === 'math' ? 'DETECTED' : 'TRACKED'} SYNC LEAK `,
    STYLES.headerBlue
  );
  console.log(`%c📍 Location: %c${target.file}`, STYLES.bold, STYLES.location);
  console.log(
    `%cFlow:%c %c${source.name}%c ➔ Effect ➔ %c${target.name}%c`,
    STYLES.bold, "", STYLES.label, "", STYLES.label, ""
  );
  console.log(
    `%cContext:%c ${method === 'math'
      ? 'The engine detected a consistent 20ms lag between these updates.'
      : 'This was caught during React effect execution.'}\n` +
    `%cResult:%c This creates a %cDouble Render Cycle%c.`,
    STYLES.bold, "", STYLES.bold, "", "color: #d63031; font-weight: bold;", ""
  );
  console.groupEnd();
};

export const displayInfiniteLoop = (label: string) => {
  if (!isWeb) return;
  const info = parseLabel(label);
  console.group(`%c 🛑 BASIS CRITICAL | CIRCUIT BREAKER `, STYLES.headerRed);
  console.error(`Infinite oscillation on: %c${info.name}%c`, "color: white; background: #d63031; padding: 2px 4px;", "");
  console.groupEnd();
};

export const displayHealthReport = (
  history: Map<string, number[]>,
  similarityFn: (A: number[], B: number[]) => number,
  threshold: number
) => {
  const entries = Array.from(history.entries());
  const totalVars = entries.length;
  if (totalVars === 0) return;

  const clusters: string[][] = [];
  const processed = new Set<string>();
  let independentCount = 0;

  entries.forEach(([labelA, vecA]) => {
    if (processed.has(labelA)) return;
    const currentCluster = [labelA];
    processed.add(labelA);
    entries.forEach(([labelB, vecB]) => {
      if (labelA === labelB || processed.has(labelB)) return;
      const sim = similarityFn(vecA, vecB);
      if (sim > threshold) {
        currentCluster.push(labelB);
        processed.add(labelB);
      }
    });
    if (currentCluster.length > 1) {
      clusters.push(currentCluster);
    } else {
      independentCount++;
    }
  });

  const systemRank = independentCount + clusters.length;
  const healthScore = (systemRank / totalVars) * 100;

  if (isWeb) {
    console.group(`%c 📊 BASIS | ARCHITECTURAL HEALTH REPORT `, STYLES.headerGreen);
    console.log(
      `%cArchitectural Health Score: %c${healthScore.toFixed(1)}% %c(State Distribution: ${systemRank}/${totalVars})`,
      STYLES.bold,
      `color: ${healthScore > 85 ? '#00b894' : '#d63031'}; font-size: 16px; font-weight: bold;`,
      "color: #636e72; font-style: italic;"
    );

    if (clusters.length > 0) {
      console.log(`%cDetected ${clusters.length} Synchronized Update Clusters:`, "font-weight: bold; color: #e17055; margin-top: 10px;");
      clusters.forEach((cluster, idx) => {
        const names = cluster.map(l => parseLabel(l).name).join(' ⟷ ');
        console.log(` %c${idx + 1}%c ${names}`, "background: #e17055; color: white; border-radius: 50%; padding: 0 5px;", "font-family: monospace;");
      });
      console.log("%c💡 Action: Variables in a cluster move together. Try refactoring them into a single state object or use useMemo for derived values.", STYLES.subText);
    } else {
      console.log("%c✨ All state variables have optimal distribution. Your Basis is healthy.", "color: #00b894; font-weight: bold; margin-top: 10px;");
    }

    if (totalVars > 0 && totalVars < 15) {
      console.groupCollapsed("%cView Full Correlation Matrix", "color: #636e72; font-size: 11px;");
      const matrix: any = {};
      entries.forEach(([labelA]) => {
        const nameA = parseLabel(labelA).name;
        matrix[nameA] = {};
        entries.forEach(([labelB]) => {
          const nameB = parseLabel(labelB).name;
          const sim = similarityFn(history.get(labelA)!, history.get(labelB)!);
          matrix[nameA][nameB] = sim > threshold ? `❌ ${(sim * 100).toFixed(0)}%` : `✅`;
        });
      });
      console.table(matrix);
      console.groupEnd();
    }
    console.groupEnd();
  } else {
    console.log(`[BASIS HEALTH] Score: ${healthScore.toFixed(1)}% (State Distribution: ${systemRank}/${totalVars})`);
  }
};