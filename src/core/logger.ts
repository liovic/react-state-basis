// src/core/logger.ts

import { calculateCosineSimilarity } from "./math";

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

interface RingBufferMetadata {
  buffer: Uint8Array;
  head: number;
  options: any;
  role: 'local' | 'context' | 'proj';
}

const LAST_LOG_TIMES = new Map<string, number>();
const LOG_COOLDOWN = 3000; // 3 second suppression for identical alerts

const STYLES = {
  basis: "background: #6c5ce7; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
  version: "background: #a29bfe; color: #2d3436; padding: 2px 6px; border-radius: 3px; margin-left: -4px;",
  headerRed: "background: #d63031; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerBlue: "background: #0984e3; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  headerGreen: "background: #00b894; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
  label: "background: #dfe6e9; color: #2d3436; padding: 0 4px; border-radius: 3px; font-family: monospace; font-weight: bold; border: 1px solid #b2bec3;",
  location: "color: #0984e3; font-family: monospace; font-weight: bold;",
  subText: "color: #636e72; font-size: 11px;",
  bold: "font-weight: bold;",
  action: "color: #00b894; font-weight: bold; border: 1px solid #00b894; padding: 0 4px; border-radius: 3px;",
  warning: "color: #d63031; font-weight: bold; border: 1px solid #d63031; padding: 0 4px; border-radius: 3px;"
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
    return true;
  }
  return false;
};

export const displayRedundancyAlert = (labelA: string, metaA: RingBufferMetadata, labelB: string, metaB: RingBufferMetadata, sim: number) => {
  if (!isWeb || !shouldLog(`redundant-${labelA}-${labelB}`)) return;

  const infoA = parseLabel(labelA);
  const infoB = parseLabel(labelB);

  const isContextMirror = (metaA.role === 'local' && metaB.role === 'context') || (metaB.role === 'local' && metaA.role === 'context');
  const local = metaA.role === 'local' ? infoA : infoB;
  const context = metaA.role === 'context' ? infoA : infoB;

  console.group(`%c ♊ BASIS | ${isContextMirror ? 'CONTEXT MIRRORING' : 'DUPLICATE STATE'} `, STYLES.headerRed);
  console.log(`%c📍 Location: %c${infoA.file}`, STYLES.bold, STYLES.location);

  if (isContextMirror) {
    console.log(
      `%cIssue:%c Local variable %c${local.name}%c is just a copy of Global Context %c${context.name}%c.\n` +
      `%cConfidence: ${(sim * 100).toFixed(0)}%`,
      STYLES.bold, "", STYLES.label, "", STYLES.label, "", STYLES.subText
    );
    console.log(`%cFix:%c Use the context value directly to avoid state drift.`, STYLES.bold, STYLES.warning);
  } else {
    console.log(
      `%cIssue:%c %c${infoA.name}%c and %c${infoB.name}%c are synchronized (${(sim * 100).toFixed(0)}% correlation).`,
      STYLES.bold, "", STYLES.label, "", STYLES.label, ""
    );
    console.log(
      `%cFix:%c Merge states or calculate %c${infoB.name}%c from %c${infoA.name}%c via %cuseMemo%c.`,
      STYLES.bold, "", STYLES.label, "", STYLES.label, "", STYLES.action, ""
    );
  }
  console.groupEnd();
};

export const displayHealthReport = (history: Map<string, RingBufferMetadata>, threshold: number) => {
  if (!isWeb) return;
  const entries = Array.from(history.entries());
  const totalVars = entries.length;
  if (totalVars === 0) return;

  const clusters: string[][] = [];
  const processed = new Set<string>();
  let independentCount = 0;

  entries.forEach(([labelA, metaA]) => {
    if (processed.has(labelA)) return;
    const currentCluster = [labelA];
    processed.add(labelA);

    entries.forEach(([labelB, metaB]) => {
      if (labelA === labelB || processed.has(labelB)) return;
      const sim = calculateCosineSimilarity(metaA.buffer, metaB.buffer);
      if (sim > threshold) {
        if (metaA.role === 'context' && metaB.role === 'context') return;
        currentCluster.push(labelB);
        processed.add(labelB);
      }
    });
    if (currentCluster.length > 1) clusters.push(currentCluster); else independentCount++;
  });

  const systemRank = independentCount + clusters.length;
  const healthScore = (systemRank / totalVars) * 100;

  console.group(`%c 📊 BASIS | ARCHITECTURAL HEALTH REPORT `, STYLES.headerGreen);
  console.log(
    `%cEfficiency: %c${healthScore.toFixed(1)}% %c(${systemRank}/${totalVars} Sources of Truth)`,
    STYLES.bold, `color: ${healthScore > 85 ? '#00b894' : '#d63031'}; font-weight: bold;`, STYLES.subText
  );

  if (clusters.length > 0) {
    console.log(`%cDetected ${clusters.length} Sync Issues:`, "font-weight: bold; color: #e17055; margin-top: 10px;");

    clusters.forEach((cluster, idx) => {
      const clusterMetas = cluster.map(l => ({ label: l, meta: history.get(l)!, info: parseLabel(l) }));
      const contexts = clusterMetas.filter(c => c.meta.role === 'context');
      const locals = clusterMetas.filter(c => c.meta.role === 'local');
      const names = clusterMetas.map(c => `${c.meta.role === 'context' ? 'Ω ' : ''}${c.info.name}`).join(' ⟷ ');

      console.group(` %c${idx + 1}%c ${names}`, "background: #e17055; color: white; border-radius: 50%; padding: 0 5px;", "font-family: monospace; font-weight: bold;");

      if (contexts.length > 0) {
        const ctxNames = contexts.map(c => c.info.name).join(', ');
        console.log(`%cDiagnosis:%c Context Mirroring. Variables are copying from %c${ctxNames}%c.`, STYLES.bold, "", STYLES.label, "");
        console.log(`%cSolution:%c Use the context directly to avoid state drift.`, STYLES.bold, STYLES.action);
      } else {
        const isExplosion = locals.length > 2;
        if (isExplosion) {
          console.log(`%cDiagnosis:%c Boolean Explosion. Multiple states updating in sync.`, STYLES.bold, "");
          console.log(`%cSolution:%c Combine into a single %cstatus%c string or a %creducer%c.`, STYLES.bold, "", STYLES.label, "", STYLES.label, "");
        } else {
          console.log(`%cDiagnosis:%c Redundant State. Variables always change together.`, STYLES.bold, "");
          console.log(`%cSolution:%c Derive one from the other via %cuseMemo%c.`, STYLES.bold, "", STYLES.label, "");
        }
      }
      console.groupEnd();
    });
  } else {
    console.log("%c✨ Your architecture is clean. No redundant state detected.", "color: #00b894; font-weight: bold;");
  }
  console.groupEnd();
};

export const displayCausalHint = (targetLabel: string, targetMeta: RingBufferMetadata, sourceLabel: string, sourceMeta: RingBufferMetadata) => {
  if (!isWeb || !shouldLog(`causal-${sourceLabel}-${targetLabel}`)) return;

  const target = parseLabel(targetLabel);
  const source = parseLabel(sourceLabel);
  const isContextTrigger = sourceMeta.role === 'context';

  console.groupCollapsed(`%c ⚡ BASIS | ${isContextTrigger ? 'CONTEXT SYNC LEAK' : 'DOUBLE RENDER'} `, STYLES.headerBlue);
  console.log(`%c📍 Location: %c${target.file}`, STYLES.bold, STYLES.location);

  if (isContextTrigger) {
    console.log(`%cIssue:%c Context %c${source.name}%c updated, then local %c${target.name}%c followed 1 frame later.`, STYLES.bold, "", STYLES.label, "", STYLES.label, "");
    console.log(`%cImpact: This forces React to render the component twice for every change.`, STYLES.subText);
  } else {
    console.log(`%cIssue:%c %c${source.name}%c triggers %c${target.name}%c in a separate frame.`, STYLES.bold, "", STYLES.label, "", STYLES.label, "");
  }

  console.log(`%cFix:%c Derive %c${target.name}%c during the first render.`, STYLES.bold, STYLES.action, STYLES.label, "");
  console.groupEnd();
};

export const displayViolentBreaker = (label: string, count: number, threshold: number) => {
  if (!isWeb) return;
  const parts = label.split(' -> ');
  console.group(`%c 🛑 BASIS CRITICAL | CIRCUIT BREAKER `, 'background: #dc2626; color: white; font-weight: bold; padding: 8px 16px;');
  console.error(`INFINITE LOOP DETECTED\nVariable: ${parts[1] || label}\nFrequency: ${count} updates/sec`);
  console.log(`%cACTION: Update BLOCKED to prevent browser freeze.`, 'color: #dc2626; font-weight: bold;');
  console.groupEnd();
};

export const displayBootLog = (windowSize: number) => {
  if (!isWeb) return;
  console.log(`%cBasis%cAuditor%c | v0.5.x Architectural Forensics Active (Window: ${windowSize})`, STYLES.basis, STYLES.version, "color: #636e72; font-style: italic; margin-left: 8px;");
};
