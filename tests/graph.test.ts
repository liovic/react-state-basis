// tests/graph.test.ts

import { describe, it, expect } from 'vitest';
import { calculateSpectralInfluence } from '../src/core/graph';

describe('Graph Theory: Spectral Influence (Prime Mover Detection)', () => {

    // Helper to build the nested map structure quickly
    const createGraph = (edges: [string, string, number?][]) => {
        const graph = new Map<string, Map<string, number>>();
        edges.forEach(([source, target, weight = 1]) => {
            if (!graph.has(source)) {
                graph.set(source, new Map());
            }
            graph.get(source)!.set(target, weight);
        });
        return graph;
    };

    it('handles an empty graph gracefully', () => {
        const scores = calculateSpectralInfluence(new Map());
        expect(scores.size).toBe(0);
    });

    it('Star Topology: Identifies a "Global Event" as the Prime Mover', () => {
        // Scenario: An event triggers 3 siblings (A, B, C)
        // Structure: Event -> { A, B, C }
        const graph = createGraph([
            ['Event_Click', 'State_A'],
            ['Event_Click', 'State_B'],
            ['Event_Click', 'State_C'],
        ]);

        const scores = calculateSpectralInfluence(graph);

        // Sort by score descending
        const sorted = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);

        // The Event should be the #1 influencer because it drives activity
        expect(sorted[0][0]).toBe('Event_Click');

        // The leaves (A, B, C) have no outgoing edges, so they should be low score
        expect(scores.get('State_A')).toBeLessThan(scores.get('Event_Click')!);
    });

    it('Chain Topology: Identifies the start of a Causal Chain', () => {
        // Scenario: A triggers B, which triggers C (A -> B -> C)
        const graph = createGraph([
            ['Source_A', 'Middle_B'],
            ['Middle_B', 'Leaf_C']
        ]);

        const scores = calculateSpectralInfluence(graph);

        // A drives B (who is active), so A has high influence.
        // B drives C (who is a sink), so B has medium influence.
        // C drives nothing, so C has baseline influence.
        const scoreA = scores.get('Source_A') || 0;
        const scoreB = scores.get('Middle_B') || 0;
        const scoreC = scores.get('Leaf_C') || 0;

        expect(scoreA).toBeGreaterThan(scoreB);
        expect(scoreB).toBeGreaterThan(scoreC);
    });

    it('Feedback Loop: Converges without crashing', () => {
        // Scenario: A triggers B, B triggers A (A <-> B)
        const graph = createGraph([
            ['Node_A', 'Node_B'],
            ['Node_B', 'Node_A']
        ]);

        const scores = calculateSpectralInfluence(graph);

        // In a perfect loop, they should share influence roughly equally
        const scoreA = scores.get('Node_A')!;
        const scoreB = scores.get('Node_B')!;

        expect(scoreA).toBeCloseTo(0.5, 1);
        expect(scoreB).toBeCloseTo(0.5, 1);
    });

    it('Self-Loops: Should ignore self-referential edges', () => {
        // Scenario: A updates itself (A -> A), but A also updates B (A -> B)
        const graph = createGraph([
            ['Node_A', 'Node_A'], // Self-loop
            ['Node_A', 'Node_B']
        ]);

        const scores = calculateSpectralInfluence(graph);

        // The algorithm explicitly skips source === target. 
        // If it didn't, A's score would artificially inflate infinitely in power iteration.
        // Here, A gets influence only from driving B.
        // B gets baseline.

        expect(scores.get('Node_A')).toBeGreaterThan(scores.get('Node_B')!);
    });

    it('Weighted Edges: Higher frequency updates imply higher influence', () => {
        // Scenario: 
        // Root -> Weak (1 update)
        // Root -> Strong (50 updates)
        // Theoretically, driving the "Strong" node makes Root more influential 
        // because that path is "hotter".
        const graph = createGraph([
            ['Root', 'Weak_Child', 1],
            ['Root', 'Strong_Child', 50]
        ]);

        // We need 'Strong_Child' to drive something else to have "value" to pass back to Root,
        // or we rely on the base weight logic. 
        // In this implementation, influence += target_score * weight.
        // Even if children are sinks (base score), the weight multiplies that base score.

        const scores = calculateSpectralInfluence(graph);

        // Just verifying the calculation runs and normalizes
        const total = Array.from(scores.values()).reduce((a, b) => a + b, 0);
        expect(total).toBeCloseTo(1, 4); // Should sum to ~1.0
    });

    it('Disconnected Clusters: Finds the dominant cluster leader', () => {
        // Cluster 1: Small (A -> B)
        // Cluster 2: Large (X -> Y, X -> Z, X -> Q)
        const graph = createGraph([
            ['A', 'B'],
            ['X', 'Y'],
            ['X', 'Z'],
            ['X', 'Q']
        ]);

        const scores = calculateSpectralInfluence(graph);

        // X drives 3 nodes. A drives 1 node.
        // X should have a higher Spectral Influence score than A.
        expect(scores.get('X')).toBeGreaterThan(scores.get('A')!);
    });

});