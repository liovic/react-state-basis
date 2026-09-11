// src/core/logger.ts

import { countOverlapsCircular, isSignificantOverlap } from "./math";
import { identifyTopIssues } from "./ranker";
import {
  RingBufferMetadata,
  SignalRole,
  RankedIssue,
  ViolationDetail,
  BasisGraphJSON,
  BasisGraphNode,
  BasisGraphEdge,
  OverlapStats,
} from "./types";
import { instance } from "../engine";
import { parseLabel, isEffectLabel } from "./label";

const isWeb = typeof window !== "undefined" && typeof window.document !== "undefined";
const LAST_LOG_TIMES = new Map<string, number>();
const LOG_COOLDOWN = 3000;

const THEME = {
  identity: "#6C5CE7",
  problem: "#D63031",
  solution: "#FBC531",
  context: "#0984E3",
  muted: "#9AA0A6",
  border: "#2E2E35",
  success: "#00b894",
};

const STYLES = {
  basis: `background: ${THEME.identity}; color: white; font-weight: bold; padding: 2px 6px; border-radius: 3px;`,
  headerIdentity: `background: ${THEME.identity}; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;`,
  headerProblem: `background: ${THEME.problem}; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;`,
  version: `background: #a29bfe; color: #2d3436; padding: 2px 6px; border-radius: 3px; margin-left: -4px;`,
  actionLabel: `color: ${THEME.solution}; font-weight: bold;`,
  actionPill: `color: ${THEME.solution}; font-weight: bold; border: 1px solid ${THEME.solution}; padding: 0 4px; border-radius: 3px;`,
  impactLabel: `color: ${THEME.context}; font-weight: bold;`,
  location: `color: ${THEME.context}; font-family: monospace; font-weight: bold;`,
  subText: `color: ${THEME.muted}; font-size: 11px;`,
  bold: "font-weight: bold;",
  label:
    "background: #dfe6e9; color: #2d3436; padding: 0 4px; border-radius: 3px; font-family: monospace; font-weight: bold; border: 1px solid #b2bec3;",
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

const isBooleanLike = (name: string) =>
  /^(is|has|can|should|did|will|show|hide)(?=[A-Z_])/.test(name);

const displayName = (raw: string) => {
  const { name } = parseLabel(raw);
  return name.replace(/:\d+$/, "");
};

const areSyncSignificant = (metaA: RingBufferMetadata, metaB: RingBufferMetadata): boolean => {
  const { kSync, densityA, densityB } = countOverlapsCircular(
    metaA.buffer,
    metaA.head,
    metaB.buffer,
    metaB.head
  );
  return isSignificantOverlap(kSync, densityA, densityB, metaA.buffer.length);
};

const getSuggestedFix = (issue: RankedIssue, info: { name: string }): string => {
  if (issue.label.includes("Global Event")) {
    return `One interaction is updating state in several places. If that is really one transition, put it in one %cstore / reducer%c. If it is intentional, ignore this.`;
  }

  const violations = issue.violations || [];
  const leaks = violations.filter((v) => v.type === "causal_leak");
  const mirrors = violations.filter((v) => v.type === "context_mirror");
  const duplicates = violations.filter((v) => v.type === "duplicate_state");

  if (mirrors.length > 0) {
    return `A local hook is only tracking context or a store. If it is not a draft, delete it and read the %ccontext / store%c in render.`;
  }

  if (leaks.length > 0) {
    const targetName = displayName(leaks[0].target);
    if (issue.label.includes("effect")) {
      return `An effect is calling setState on ${targetName}, which paints again. If you can compute ${targetName} while rendering, drop the %ceffect%c.`;
    }
    return `${info.name} updates, then ${targetName} updates on the next frame. If they are one fact, write them in the same %csetState%c.`;
  }

  if (duplicates.length > 0) {
    if (isBooleanLike(info.name)) {
      return `Several flags move together. One %cstatus%c value avoids impossible combinations.`;
    }
    return `These hooks move together. If one is just the other in another shape, compute it while %crendering%c.`;
  }

  if (issue.metric === "density") {
    return `This hook updates faster than a frame. %cDebounce%c it or keep it in a ref if the UI does not need every pulse.`;
  }

  return `Inspect ${info.name} and what updates with it.`;
};

export const displayHealthReport = (
  history: Map<string, RingBufferMetadata>,
  violationMap: Map<string, ViolationDetail[]>
) => {
  if (!isWeb) return;
  const entries = Array.from(history.entries());
  if (entries.length === 0) return;

  const topIssues = identifyTopIssues(instance.graph, history, instance.redundantLabels, violationMap);

  console.group(`%c BASIS | report `, STYLES.headerIdentity);

  if (topIssues.length > 0) {
    console.log(`%cStart here`, `font-weight: bold; color: ${THEME.identity}; margin-top: 10px;`);

    topIssues.forEach((issue, idx) => {
      const info = parseLabel(issue.label);
      const icon = issue.metric === "influence" ? "→" : "•";
      const pColor = idx === 0 ? THEME.problem : idx === 1 ? THEME.solution : THEME.identity;

      console.group(
        ` %c${idx + 1}%c ${icon} ${displayName(issue.label)} %c(${info.file})`,
        `background: ${pColor}; color: ${idx === 1 ? "black" : "white"}; border-radius: 50%; padding: 0 5px;`,
        "font-family: monospace; font-weight: 700;",
        `color: ${THEME.muted}; font-size: 10px; font-weight: normal;`
      );

      console.log(`%c${issue.reason}`, `color: ${THEME.muted};`);

      if (issue.violations.length > 0) {
        const byFile = new Map<string, string[]>();

        issue.violations.forEach((v) => {
          if (issue.label.includes("Global Event") && v.type === "context_mirror") return;
          const { file, name } = parseLabel(v.target);
          if (!byFile.has(file)) byFile.set(file, []);
          byFile.get(file)!.push(name.replace(/:\d+$/, ""));
        });

        const impactParts: string[] = [];
        byFile.forEach((vars, file) => {
          impactParts.push(`${file} (${vars.join(", ")})`);
        });

        if (impactParts.length > 0) {
          console.log(`%cAlso updates: %c${impactParts.join(" · ")}`, STYLES.impactLabel, "");
        }
      }

      const fix = getSuggestedFix(issue, info);
      const fixParts = fix.split("%c");

      if (fixParts.length === 3) {
        console.log(
          `%cTry: %c${fixParts[0]}%c${fixParts[1]}%c${fixParts[2]}`,
          STYLES.actionLabel,
          "",
          STYLES.actionPill,
          ""
        );
      } else {
        console.log(`%cTry: %c${fix}`, STYLES.actionLabel, "");
      }

      console.groupEnd();
    });
    console.log("\n");
  }

  const clusters: string[][] = [];
  const processed = new Set<string>();
  let independentCount = 0;

  entries.forEach(([labelA, metaA]) => {
    if (processed.has(labelA)) return;
    const currentCluster = [labelA];
    processed.add(labelA);
    entries.forEach(([labelB, metaB]) => {
      if (labelA === labelB || processed.has(labelB)) return;
      if (!areSyncSignificant(metaA, metaB)) return;
      if (metaA.role === SignalRole.CONTEXT && metaB.role === SignalRole.CONTEXT) return;
      currentCluster.push(labelB);
      processed.add(labelB);
    });
    if (currentCluster.length > 1) clusters.push(currentCluster);
    else independentCount++;
  });

  const totalVars = entries.length;

  console.log(
    `%c${independentCount + clusters.length} of ${totalVars} instrumented hooks look independent in this window.`,
    STYLES.subText
  );

  if (clusters.length > 0) {
    console.log(
      `%c${clusters.length} group${clusters.length === 1 ? "" : "s"} that keep updating together:`,
      `font-weight: bold; color: ${THEME.problem}; margin-top: 10px;`
    );

    clusters.forEach((cluster, idx) => {
      const clusterMetas = cluster.map((l) => ({
        label: l,
        meta: history.get(l)!,
        name: displayName(l),
      }));
      const hasCtx = clusterMetas.some(
        (c) => c.meta.role === SignalRole.CONTEXT || c.meta.role === SignalRole.STORE
      );

      const names = clusterMetas.map((c) => c.name).join(", ");

      console.group(
        ` %c${idx + 1}%c ${names}`,
        `background: ${THEME.problem}; color: white; border-radius: 50%; padding: 0 5px;`,
        "font-family: monospace; font-weight: bold;"
      );

      if (hasCtx) {
        const hasStore = clusterMetas.some((c) => c.meta.role === SignalRole.STORE);
        const sourceType = hasStore ? "a store" : "context";
        console.log(`A local hook is only following ${sourceType}.`);
        console.log(
          `%cTry:%c Read ${sourceType} in render if the local value is not a draft.`,
          STYLES.actionLabel,
          ""
        );
      } else {
        const boolKeywords = [
          "is",
          "has",
          "can",
          "should",
          "loading",
          "success",
          "error",
          "active",
          "enabled",
          "open",
          "visible",
        ];
        const boolCount = clusterMetas.filter((c) =>
          boolKeywords.some((kw) => c.name.toLowerCase().startsWith(kw))
        ).length;

        if (cluster.length > 2 && boolCount / cluster.length > 0.5) {
          console.log(`These flags move together.`);
          console.log(
            `%cTry:%c One %cstatus%c instead of several booleans.`,
            STYLES.actionLabel,
            "",
            STYLES.actionPill,
            ""
          );
        } else if (cluster.length > 2) {
          console.log(`These hooks move on the same frames. Often the same click or fetch.`);
          console.log(
            `%cTry:%c Leave it if that is intentional. Otherwise one %creducer%c.`,
            STYLES.actionLabel,
            "",
            STYLES.actionPill,
            ""
          );
        } else {
          console.log(`These two hooks keep updating in the same frame.`);
          console.log(
            `%cTry:%c If one is derived, compute it while %crendering%c.`,
            STYLES.actionLabel,
            "",
            STYLES.actionPill,
            ""
          );
        }
      }
      console.groupEnd();
    });
  } else {
    console.log(
      "%cNo hooks were updating in lockstep in this window.",
      `color: ${THEME.success}; font-weight: bold;`
    );
  }
  console.groupEnd();
};

export const displayRedundancyAlert = (
  labelA: string,
  metaA: RingBufferMetadata,
  labelB: string,
  metaB: RingBufferMetadata,
  overlap: OverlapStats
) => {
  if (!isWeb || !shouldLog(`redundant-${labelA}-${labelB}`)) return;

  const infoA = parseLabel(labelA);
  const nameA = displayName(labelA);
  const nameB = displayName(labelB);

  const isContextMirror =
    (metaA.role === SignalRole.LOCAL && metaB.role === SignalRole.CONTEXT) ||
    (metaB.role === SignalRole.LOCAL && metaA.role === SignalRole.CONTEXT);

  const isStoreMirror =
    (metaA.role === SignalRole.LOCAL && metaB.role === SignalRole.STORE) ||
    (metaB.role === SignalRole.LOCAL && metaA.role === SignalRole.STORE);

  const alertType = isContextMirror
    ? "local state follows context"
    : isStoreMirror
      ? "local state follows a store"
      : "hooks moving together";

  const times = overlap.kSync === 1 ? "time" : "times";

  console.group(`%c BASIS | ${alertType} `, STYLES.headerProblem);
  console.log(`%c${infoA.file}`, STYLES.location);
  console.log(
    `%c${nameA}%c and %c${nameB}%c updated in the same frame ${overlap.kSync} ${times}.`,
    STYLES.label,
    "",
    STYLES.label,
    ""
  );

  if (isContextMirror || isStoreMirror) {
    const sourceType = isStoreMirror ? "store" : "context";
    console.log(
      `%cTry:%c If this is not a draft, delete the local hook and read the %c${sourceType}%c in render.`,
      STYLES.bold,
      "",
      STYLES.actionPill,
      ""
    );
  } else if (isBooleanLike(nameA) || isBooleanLike(nameB)) {
    console.log(
      `%cTry:%c One %cstatus%c instead of several flags.`,
      STYLES.bold,
      "",
      STYLES.actionPill,
      ""
    );
  } else {
    console.log(
      `%cTry:%c If %c${nameB}%c is just %c${nameA}%c in another shape, compute it while rendering.`,
      STYLES.bold,
      "",
      STYLES.label,
      "",
      STYLES.label,
      ""
    );
  }
  console.groupEnd();
};

export const displayCausalHint = (
  targetLabel: string,
  _targetMeta: RingBufferMetadata,
  sourceLabel: string,
  sourceMeta: RingBufferMetadata
) => {
  if (!isWeb || !shouldLog(`causal-${sourceLabel}-${targetLabel}`)) return;

  const target = parseLabel(targetLabel);
  const sourceName = displayName(sourceLabel);
  const targetName = displayName(targetLabel);

  const headerType =
    sourceMeta.role === SignalRole.CONTEXT
      ? "extra render from context"
      : sourceMeta.role === SignalRole.STORE
        ? "extra render from a store"
        : "extra render";

  const isEffect = sourceLabel.includes("effect") || sourceLabel.includes("useLayoutEffect");

  console.groupCollapsed(`%c BASIS | ${headerType} `, STYLES.headerProblem);
  console.log(`%c${target.file}`, STYLES.location);
  console.log(
    `%c${sourceName}%c updates %c${targetName}%c on the next frame.`,
    STYLES.label,
    "",
    STYLES.label,
    ""
  );

  if (isEffect) {
    console.log(
      `%cTry:%c If %c${targetName}%c can be computed while rendering, drop the extra setState.`,
      STYLES.bold,
      "",
      STYLES.label,
      ""
    );
  } else {
    console.log(
      `%cTry:%c Write %c${targetName}%c in the same update as %c${sourceName}%c if they are one fact.`,
      STYLES.bold,
      "",
      STYLES.label,
      "",
      STYLES.label,
      ""
    );
  }
  console.groupEnd();
};

const splitHookLine = (raw: string): { hook: string; line?: number } => {
  const m = raw.match(/^(.*):(\d+)$/);
  if (!m) return { hook: raw };
  return { hook: m[1], line: Number(m[2]) };
};

const formatHook = (raw: string): string => {
  const { hook } = splitHookLine(raw);
  if (!isEffectLabel(hook)) return hook;
  const lineMatch = hook.match(/L(\d+)$/);
  return lineMatch ? `effect @ L${lineMatch[1]}` : "effect (anonymous)";
};

const formatNode = (node?: BasisGraphNode, fallbackId = "?"): string => {
  if (!node) return fallbackId;
  if (node.role === "event") return "Event";
  const hook = formatHook(node.name || node.id);
  if (node.file && hook) return `${node.file} → ${hook}`;
  return hook || node.id;
};

export const displayGraphReport = (graph: BasisGraphJSON) => {
  if (!isWeb) return;
  if (graph.nodes.length === 0) {
    console.log(
      `%c BASIS | update graph %c(nothing recorded yet)`,
      STYLES.headerIdentity,
      `color: ${THEME.muted}; font-style: italic;`
    );
    return;
  }

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, BasisGraphEdge[]>();
  graph.edges.forEach((e) => {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e);
  });

  type Group = {
    sourceIds: string[];
    sourceNode: BasisGraphNode | undefined;
    edges: BasisGraphEdge[];
    occurrences: number;
  };

  const eventGroups: Group[] = graph.eventGroups.map((g) => ({
    sourceIds: g.sourceIds,
    sourceNode: nodeById.get(g.sourceIds[0]),
    edges: g.edges,
    occurrences: g.occurrences,
  }));

  const groupedSourceIds = new Set(graph.eventGroups.flatMap((g) => g.sourceIds));
  const nonEventGroups: Group[] = Array.from(outgoing.keys())
    .filter((id) => !groupedSourceIds.has(id))
    .map((id) => ({
      sourceIds: [id],
      sourceNode: nodeById.get(id),
      edges: outgoing.get(id)!,
      occurrences: 1,
    }));

  const groups: Group[] = [...eventGroups, ...nonEventGroups].sort(
    (a, b) => b.edges.length - a.edges.length || b.occurrences - a.occurrences
  );

  console.group(
    `%c BASIS | update graph %c${graph.nodes.length} nodes · ${graph.edges.length} edges · ${groups.length} sources · last ${graph.bufferWindowSize} frames`,
    STYLES.headerIdentity,
    `color: ${THEME.muted}; font-weight: normal;`
  );
  console.log(
    `%cparent → child = what we saw cause an update. (×N) = times in this window. Repeat clicks with the same targets are grouped.`,
    STYLES.subText
  );

  groups.forEach((group) => {
    const isEvent = group.sourceNode?.role === "event";
    const isCtx = group.sourceNode?.role === SignalRole.CONTEXT;
    const isFx = group.sourceNode?.role === "effect";
    const isUnknown = group.sourceNode?.role === "unknown";
    const icon = isEvent ? "•" : isCtx ? "ctx" : isFx ? "fx" : isUnknown ? "?" : "•";
    const color = isEvent ? THEME.solution : isCtx ? THEME.context : THEME.identity;

    const fanout = group.edges.length;
    const hits = group.occurrences;
    const hitLabel = hits > 1 ? ` · ×${hits}` : "";

    const title = isEvent
      ? `click / event · ${fanout} update${fanout === 1 ? "" : "s"}${hitLabel}`
      : formatNode(group.sourceNode, group.sourceIds[0]);

    console.groupCollapsed(
      `%c${icon} %c${title}`,
      `color: ${color};`,
      "font-family: monospace; font-weight: 600;"
    );

    group.edges
      .slice()
      .sort((a, b) => b.weight - a.weight)
      .forEach((edge) => {
        const target = nodeById.get(edge.target);
        const label = formatNode(target, edge.target);
        const weight = edge.weight > 1 ? ` (×${edge.weight})` : "";
        if (target?.redundant) {
          console.log(
            `%c  ${label}%c${weight} %cmoving with another hook`,
            `color: ${THEME.muted}; font-family: monospace;`,
            `color: ${THEME.muted};`,
            `color: ${THEME.problem}; font-weight: bold;`
          );
        } else {
          console.log(
            `%c  ${label}%c${weight}`,
            `color: ${THEME.muted}; font-family: monospace;`,
            `color: ${THEME.muted};`
          );
        }
      });

    console.groupEnd();
  });

  console.groupEnd();
};

export const displayViolentBreaker = (label: string, count: number, _threshold: number) => {
  if (!isWeb) return;
  const name = displayName(label);
  console.group(`%c BASIS | loop guard `, STYLES.headerProblem);
  console.error(
    `${name} updated ${count} times in one second. Basis stopped analyzing this path. React will keep applying updates.`
  );
  console.log(
    `%cReact may still error on its own. Fix the effect that writes a value it also lists as a dependency.`,
    `color: ${THEME.muted};`
  );
  console.groupEnd();
};

export const displayBootLog = (windowSize: number) => {
  if (!isWeb) return;
  console.log(
    `%cBasis%c watching updates (${windowSize}-frame window)`,
    STYLES.basis,
    `color: ${THEME.muted}; margin-left: 8px;`
  );
};