// fixtures/_harness/assertions.ts

import { expect } from 'vitest';
import type {
    BasisGraphJSON,
    BasisGraphNode,
    ViolationDetail,
} from '../../src/core/types';
import { INSTANCE_SEP } from '../../src/core/constants';

const nameOfLabel = (label: string): string => {
    const afterArrow = label.includes(' -> ') ? label.split(' -> ').pop()! : label;
    return afterArrow.replace(/##.*$/, '');
};

export const nodesByName = (graph: BasisGraphJSON, name: string): BasisGraphNode[] =>
    graph.nodes.filter((n) => n.name === name);

export const nodeIdsByName = (graph: BasisGraphJSON, name: string): string[] =>
    nodesByName(graph, name).map((n) => n.id);

const resolveIds = (graph: BasisGraphJSON, ref: string): string[] => {
    if (graph.nodes.some((n) => n.id === ref)) return [ref];
    return nodeIdsByName(graph, ref);
};

export const hasEdge = (graph: BasisGraphJSON, source: string, target: string): boolean => {
    const sourceIds = resolveIds(graph, source);
    const targetIds = resolveIds(graph, target);
    if (sourceIds.length === 0 || targetIds.length === 0) return false;
    return graph.edges.some((e) => sourceIds.includes(e.source) && targetIds.includes(e.target));
};

const dumpGraph = (graph: BasisGraphJSON) =>
    `nodes: [${graph.nodes.map((n) => `${n.name}:${n.role}`).join(', ')}] ` +
    `edges: [${graph.edges.map((e) => `${e.source}->${e.target}`).join(', ')}]`;

export const expectEdge = (graph: BasisGraphJSON, source: string, target: string) => {
    expect(hasEdge(graph, source, target), `expected edge ${source} -> ${target}. ${dumpGraph(graph)}`).toBe(
        true
    );
};

export const forbidEdge = (graph: BasisGraphJSON, source: string, target: string) => {
    expect(hasEdge(graph, source, target), `expected NO edge ${source} -> ${target}`).toBe(false);
};

export const expectNodeRole = (
    graph: BasisGraphJSON,
    name: string,
    role: BasisGraphNode['role']
) => {
    const nodes = nodesByName(graph, name);
    expect(nodes.length, `expected at least one node named "${name}". ${dumpGraph(graph)}`).toBeGreaterThan(
        0
    );
    nodes.forEach((n) => expect(n.role, `node "${name}" role`).toBe(role));
};

export const expectSharedEventSource = (
    graph: BasisGraphJSON,
    ...names: string[]
) => {
    const eventIds = new Set(graph.nodes.filter((n) => n.role === 'event').map((n) => n.id));
    const targetIds = names.map((name) => {
        const ids = nodeIdsByName(graph, name);
        expect(ids.length, `expected node "${name}" to exist. ${dumpGraph(graph)}`).toBeGreaterThan(0);
        return ids;
    });

    const shared = [...eventIds].filter((eventId) =>
        targetIds.every((ids) => graph.edges.some((e) => e.source === eventId && ids.includes(e.target)))
    );

    expect(
        shared.length,
        `expected one event node feeding ${names.join(' and ')}. ${dumpGraph(graph)}`
    ).toBeGreaterThan(0);
};

export interface DiagnosticFilter {
    source?: string;
    target?: string;
    type?: ViolationDetail['type'];
}

const matches = (violations: Map<string, ViolationDetail[]>, filter: DiagnosticFilter): boolean => {
    for (const [sourceLabel, details] of violations.entries()) {
        if (filter.source && nameOfLabel(sourceLabel) !== filter.source) continue;
        for (const d of details) {
            if (filter.type && d.type !== filter.type) continue;
            if (filter.target && nameOfLabel(d.target) !== filter.target) continue;
            return true;
        }
    }
    return false;
};

export const expectDiagnostic = (
    violations: Map<string, ViolationDetail[]>,
    filter: DiagnosticFilter
) => {
    expect(
        matches(violations, filter),
        `expected a diagnostic matching ${JSON.stringify(filter)}, found none`
    ).toBe(true);
};

export const forbidDiagnostic = (
    violations: Map<string, ViolationDetail[]>,
    filter: DiagnosticFilter
) => {
    expect(
        matches(violations, filter),
        `expected NO diagnostic matching ${JSON.stringify(filter)}, but one was found`
    ).toBe(false);
};

export const forbidSharedEventSource = (graph: BasisGraphJSON, ...names: string[]) => {
    const eventIds = new Set(graph.nodes.filter((n) => n.role === 'event').map((n) => n.id));
    const targetIds = names.map((name) => nodeIdsByName(graph, name));
    const shared = [...eventIds].filter((eventId) =>
        targetIds.every((ids) => graph.edges.some((e) => e.source === eventId && ids.includes(e.target)))
    );
    expect(shared.length, `expected ${names.join(' and ')} not to share an event source`).toBe(0);
};

const instanceOf = (id: string): string | null => {
    const i = id.lastIndexOf('##');
    return i === -1 ? null : id.slice(i + INSTANCE_SEP.length);
};

export const expectDistinctInstances = (graph: BasisGraphJSON, name: string, count: number) => {
    const nodes = nodesByName(graph, name);
    const instances = new Set(nodes.map((n) => instanceOf(n.id)).filter(Boolean));
    expect(
        instances.size,
        `expected ${count} instances of "${name}", got ${instances.size} (${[...instances].join(', ')})`
    ).toBe(count);
};

export const historyKeysByName = (
    history: Map<string, unknown>,
    name: string
): string[] => [...history.keys()].filter((k) => nameOfLabel(k) === name);

export const expectDistinctHistory = (
    history: Map<string, unknown>,
    name: string,
    count: number
) => {
    const keys = historyKeysByName(history, name);
    expect(
        keys.length,
        `expected ${count} history keys named "${name}", got ${keys.length} (${keys.join(', ')})`
    ).toBe(count);
};

export const forbidEdgesBetweenSameName = (graph: BasisGraphJSON, name: string) => {
    const ids = nodeIdsByName(graph, name);
    for (const a of ids) {
        for (const b of ids) {
            if (a === b) continue;
            expect(
                graph.edges.some((e) => e.source === a && e.target === b),
                `same-name edge ${a} -> ${b}`
            ).toBe(false);
        }
    }
};

export const forbidCrossInstanceEdges = (graph: BasisGraphJSON) => {
    for (const edge of graph.edges) {
        const srcInst = instanceOf(edge.source);
        const tgtInst = instanceOf(edge.target);
        if (!srcInst || !tgtInst) continue;
        expect(
            srcInst === tgtInst,
            `cross-instance edge ${edge.source} -> ${edge.target}`
        ).toBe(true);
    }
};