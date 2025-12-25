// src/core/logger.ts

const STYLES = {
  // Brand Colors
  basis: "background: #6c5ce7; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
  version: "background: #a29bfe; color: #2d3436; padding: 2px 6px; border-radius: 3px; margin-left: -4px;",

  // Headers
  headerRed: "background: #d63031; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerBlue: "background: #0984e3; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerGreen: "background: #00b894; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",

  // Elements
  label: "background: #dfe6e9; color: #2d3436; padding: 0 4px; border-radius: 3px; font-family: monospace; font-weight: bold; border: 1px solid #b2bec3;",
  location: "color: #0984e3; font-family: monospace; font-weight: bold;",
  math: "color: #636e72; font-style: italic; font-family: serif;",

  // Code Block
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

  // Highlights
  dim: "color: #e84393; font-weight: bold;",
  bold: "font-weight: bold;"
};

const parseLabel = (label: string) => {
  const parts = label.split(' -> ');
  return {
    file: parts[0] || "Unknown",
    name: parts[1] || label
  };
};

export const displayBootLog = (windowSize: number) => {
  console.log(
    `%cBasis%cAuditor v0.1.0%c Monitoring State Space | Window: ${windowSize} ticks`,
    STYLES.basis,
    STYLES.version,
    "color: #636e72; font-style: italic; margin-left: 8px;"
  );
};

export const displayRedundancyAlert = (labelA: string, labelB: string, sim: number, totalDimensions: number) => {
  const infoA = parseLabel(labelA);
  const infoB = parseLabel(labelB);
  const isCrossFile = infoA.file !== infoB.file;

  console.group(`%c 📐 BASIS | DIMENSION COLLAPSE DETECTED `, STYLES.headerRed);

  console.log(`%c📍 Location: %c${isCrossFile ? `${infoA.file} & ${infoB.file}` : infoA.file}`, STYLES.bold, STYLES.location);

  console.log(
    `%cAnalysis:%c Vectors %c${infoA.name}%c and %c${infoB.name}%c are collinear (redundant).`,
    STYLES.bold, "", STYLES.label, "", STYLES.label, ""
  );

  console.log(
    `%cHow to fix:%c Project %c${infoB.name}%c as a derived value:
%c// 🛠️ Basis Fix: Remove useState, use useMemo
const ${infoB.name} = useMemo(() => deriveFrom(${infoA.name}), [${infoA.name}]);%c`,
    "color: #00b894; font-weight: bold;", "",
    "color: #e84393; font-weight: bold;", "",
    STYLES.codeBlock, ""
  );

  console.groupCollapsed(`%c 🔬 Proof Details `, "color: #636e72; font-size: 10px; cursor: pointer;");
  console.table({
    "Similarity": `${(sim * 100).toFixed(2)}%`,
    "Linear Dependency": "TRUE",
    "Rank": totalDimensions - 1
  });
  console.groupEnd();
  console.groupEnd();
};

export const displayCausalHint = (targetLabel: string, sourceLabel: string) => {
  const target = parseLabel(targetLabel);
  const source = parseLabel(sourceLabel);

  const isCrossFile = target.file !== source.file;
  const locationPath = isCrossFile
    ? `${source.file} ➔ ${target.file}`
    : target.file;

  console.groupCollapsed(`%c 💡 BASIS | CAUSALITY (Sequential Update) `, STYLES.headerBlue);

  console.log(`%c📍 Location: %c${locationPath}`, STYLES.bold, STYLES.location);

  console.log(
    `%cSequence:%c %c${source.name}%c ➔ Effect ➔ %c${target.name}%c`,
    STYLES.bold, "",
    STYLES.label, "",
    STYLES.label, ""
  );

  console.log(
    `%cObservation:%c Variable %c${target.name}%c is being manually synchronized.
This creates a %c"Double Render Cycle"%c.`,
    STYLES.bold, "", STYLES.label, "",
    "color: #d63031; font-weight: bold;", ""
  );

  console.log(
    `%cHow to fix:%c Use %cuseMemo%c to calculate %c${target.name}%c during render:
%cconst ${target.name} = useMemo(() => computeFrom(${source.name.includes('effect') ? 'source' : source.name}), [${source.name.includes('effect') ? 'source' : source.name}]);%c`,
    "color: #00b894; font-weight: bold;", "",
    "color: #0984e3; font-weight: bold;", "",
    "color: #e84393; font-weight: bold;", "",
    STYLES.codeBlock, ""
  );

  console.groupEnd();
};

export const displayInfiniteLoop = (label: string) => {
  const info = parseLabel(label);
  console.group(`%c 🛑 BASIS CRITICAL | CIRCUIT BREAKER `, STYLES.headerRed);
  console.error(
    `Infinite oscillation detected on: %c${info.name}%c
Execution halted to prevent browser thread lock. Check your dependency arrays.`,
    "color: white; background: #d63031; padding: 2px 4px; border-radius: 3px;", ""
  );
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
  const efficiency = (systemRank / totalVars) * 100;

  console.group(`%c 📊 BASIS | SYSTEM HEALTH REPORT `, STYLES.headerGreen);

  console.log(
    `%cBasis Efficiency: %c${efficiency.toFixed(1)}% %c(Rank: ${systemRank}/${totalVars})`,
    STYLES.bold,
    `color: ${efficiency > 85 ? '#00b894' : '#d63031'}; font-size: 16px; font-weight: bold;`,
    "color: #636e72; font-style: italic;"
  );

  if (clusters.length > 0) {
    console.log(`%cDetected ${clusters.length} Redundancy Clusters:`, "font-weight: bold; color: #e17055; margin-top: 10px;");

    clusters.forEach((cluster, idx) => {
      const names = cluster.map(l => parseLabel(l).name).join(' ⟷ ');
      console.log(` %c${idx + 1}%c ${names}`, "background: #e17055; color: white; border-radius: 50%; padding: 0 5px;", "font-family: monospace;");
    });
  } else {
    console.log("%c✨ All state variables are linearly independent. Your Basis is optimal.", "color: #00b894; font-weight: bold; margin-top: 10px;");
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
  } else {
    console.log("%c[Note] Matrix hidden due to high dimensionality. Focus on clusters above.", "color: #636e72; font-size: 10px; font-style: italic;");
  }

  console.groupEnd();
};