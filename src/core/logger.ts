// src/core/logger.ts

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const STYLES = {
  basis: "background: #6c5ce7; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
  version: "background: #a29bfe; color: #2d3436; padding: 2px 6px; border-radius: 3px; margin-left: -4px;",

  headerRed: "background: #d63031; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerBlue: "background: #0984e3; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerGreen: "background: #00b894; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",

  label: "background: #dfe6e9; color: #2d3436; padding: 0 4px; border-radius: 3px; font-family: monospace; font-weight: bold; border: 1px solid #b2bec3;",
  location: "color: #0984e3; font-family: monospace; font-weight: bold;",
  math: "color: #636e72; font-style: italic; font-family: serif;",

  codeBlock: `
    background: #1e1e1e; 
    color: #9cdcfe; 
    padding: 8px 12px; 
    display: block; 
    margin: 4px 0; 
    border-left: 3px solid #00b894; 
    font-family: 'Fira Code', monospace; 
    line-height: 1.4; 
    border-radius: 0 3px 3px 0;
  `,

  dim: "color: #e84393; font-weight: bold;",
  bold: "font-weight: bold;",
  subText: "color: #636e72; font-size: 11px;"
};

const parseLabel = (label: string) => {
  const parts = label.split(' -> ');
  return {
    file: parts[0] || "Unknown",
    name: parts[1] || label
  };
};

const logBasis = (message: string, ...styles: string[]) => {
  if (isWeb) {
    console.log(message, ...styles);
  } else {
    console.log(message.replace(/%c/g, ''));
  }
};

export const displayBootLog = (windowSize: number) => {
  logBasis(
    `%cBasis%cAuditor%c Structural Relationship Check | Window: ${windowSize} ticks`,
    STYLES.basis,
    STYLES.version,
    "color: #636e72; font-style: italic; margin-left: 8px;"
  );
};

export const displayRedundancyAlert = (labelA: string, labelB: string, sim: number, totalDimensions: number) => {
  const infoA = parseLabel(labelA);
  const infoB = parseLabel(labelB);
  const isCrossFile = infoA.file !== infoB.file;

  if (isWeb) {
    console.group(`%c 📐 BASIS | REDUNDANT STATE PATTERN `, STYLES.headerRed);
    console.log(`%c📍 Location: %c${isCrossFile ? `${infoA.file} & ${infoB.file}` : infoA.file}`, STYLES.bold, STYLES.location);
    console.log(
      `%cObservation:%c Variables %c${infoA.name}%c and %c${infoB.name}%c are Synchronized.\n` +
      `%cThis means one variable is likely redundant and can be deleted to simplify the component.`,
      STYLES.bold, "", STYLES.label, "", STYLES.label, "",
      STYLES.subText
    );
    console.log(
      `%cHow to fix:%c Refactor %c${infoB.name}%c as a Computed Value (Projection):
%c// 🛠️ Basis Fix: Remove useState, use useMemo
const ${infoB.name} = useMemo(() => deriveFrom(${infoA.name}), [${infoA.name}]);%c`,
      "color: #00b894; font-weight: bold;", "",
      "color: #e84393; font-weight: bold;", "",
      STYLES.codeBlock, ""
    );
    console.groupCollapsed(`%c 🔬 Proof Details (Mathematical Basis) `, "color: #636e72; font-size: 10px; cursor: pointer;");
    console.table({
      "Similarity": `${(sim * 100).toFixed(2)}%`,
      "Condition": "Collinear Vectors (Dimension Collapse)",
      "Rank Impact": `-1 (Rank: ${totalDimensions - 1})`
    });
    console.groupEnd();
    console.groupEnd();
  } else {
    console.log(`[BASIS] REDUNDANCY: ${infoA.name} <-> ${infoB.name} (Synchronized Updates)`);
    console.log(`Location: ${isCrossFile ? `${infoA.file} & ${infoB.file}` : infoA.file}`);
  }
};

export const displayCausalHint = (targetLabel: string, sourceLabel: string) => {
  const target = parseLabel(targetLabel);
  const source = parseLabel(sourceLabel);

  const isCrossFile = target.file !== source.file;
  const locationPath = isCrossFile
    ? `${source.file} ➔ ${target.file}`
    : target.file;

  if (isWeb) {
    console.groupCollapsed(`%c 💡 BASIS | SYNC LEAK (Double Render Cycle) `, STYLES.headerBlue);
    console.log(`%c📍 Location: %c${locationPath}`, STYLES.bold, STYLES.location);
    console.log(
      `%cSequence:%c %c${source.name}%c ➔ Effect ➔ %c${target.name}%c`,
      STYLES.bold, "", STYLES.label, "", STYLES.label, ""
    );
    console.log(
      `%cObservation:%c Variable %c${target.name}%c is being manually synchronized from its source. 
This creates a %cDouble Render Cycle%c (Performance Cost). Consider using useMemo or lifting state.`,
      STYLES.bold, "", STYLES.label, "", "color: #d63031; font-weight: bold;", ""
    );
    console.groupEnd();
  } else {
    console.log(`[BASIS] SYNC LEAK: ${source.name} ➔ ${target.name} (Double Render)`);
  }
};

export const displayInfiniteLoop = (label: string) => {
  const info = parseLabel(label);
  if (isWeb) {
    console.group(`%c 🛑 BASIS CRITICAL | CIRCUIT BREAKER `, STYLES.headerRed);
    console.error(
      `Infinite oscillation detected on: %c${info.name}%c\nExecution halted to prevent browser thread lock. Check for circular useEffect dependencies.`,
      "color: white; background: #d63031; padding: 2px 4px; border-radius: 3px;", ""
    );
    console.groupEnd();
  } else {
    console.log(`[BASIS CRITICAL] CIRCUIT BREAKER: ${info.name}. Execution halted.`);
  }
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