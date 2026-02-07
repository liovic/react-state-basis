// tests/ranker.test.ts

import { describe, it, expect } from 'vitest';
import { identifyTopIssues } from '../src/core/ranker';
import { RingBufferMetadata, SignalRole } from '../src/core/types';

describe('Ranker: Issue Identification & Prioritization', () => {

    // Helper to create mock metadata easily
    const createMeta = (role: SignalRole, density = 10): RingBufferMetadata => ({
        role,
        density,
        buffer: new Uint8Array(50),
        head: 0,
        options: {}
    });

    // Helper to create a basic graph
    const createGraph = (edges: [string, string][]) => {
        const graph = new Map<string, Map<string, number>>();
        edges.forEach(([source, target]) => {
            if (!graph.has(source)) graph.set(source, new Map());
            graph.get(source)!.set(target, 1);
        });
        return graph;
    };

    it('SCENARIO A: Aggregates multiple Event Ticks into a single Global Event issue', () => {
        // Scenario: User clicked a button 3 times. Each time, 'User' and 'Theme' updated.
        // The graph sees 3 distinct Event Nodes. The Ranker must merge them.
        const graph = createGraph([
            ['Event_Tick_1', 'App.tsx -> User'],
            ['Event_Tick_1', 'App.tsx -> Theme'],

            ['Event_Tick_2', 'App.tsx -> User'],
            ['Event_Tick_2', 'App.tsx -> Theme'],

            ['Event_Tick_3', 'App.tsx -> User'],
            ['Event_Tick_3', 'App.tsx -> Theme'],
        ]);

        const history = new Map<string, RingBufferMetadata>();
        history.set('App.tsx -> User', createMeta(SignalRole.LOCAL));
        history.set('App.tsx -> Theme', createMeta(SignalRole.LOCAL));

        const issues = identifyTopIssues(graph, history, new Set(), new Map());

        // Should result in ONE issue, not three
        expect(issues.length).toBe(1);

        const issue = issues[0];
        // Check formatting logic: "File -> Global Event (VarName)"
        expect(issue.label).toContain('App.tsx -> Global Event');
        expect(issue.metric).toBe('influence');
        // Check counting logic
        expect(issue.reason).toContain('Occurred 3 times');
        // Check impact list
        expect(issue.violations.length).toBe(2); // User and Theme
    });

    it('SCENARIO A (Noise Filter): Ignores Events that only touch 1 variable', () => {
        // Scenario: A simple setState(true). This is normal React behavior, not a "Cluster".
        const graph = createGraph([
            ['Event_Tick_1', 'App.tsx -> Counter'],
        ]);

        const history = new Map<string, RingBufferMetadata>();
        history.set('App.tsx -> Counter', createMeta(SignalRole.LOCAL));

        const issues = identifyTopIssues(graph, history, new Set(), new Map());

        // Should be empty because length <= 1 is filtered out
        expect(issues.length).toBe(0);
    });

    it('SCENARIO B: Identifies Side-Effect Drivers', () => {
        // Scenario: An effect triggers a state update (Double Render)
        const graph = createGraph([
            ['App.tsx -> effect_L5', 'App.tsx -> Data'],
        ]);

        const history = new Map<string, RingBufferMetadata>();
        history.set('App.tsx -> effect_L5', createMeta(SignalRole.LOCAL)); // Effects usually look like locals or aren't in history
        history.set('App.tsx -> Data', createMeta(SignalRole.LOCAL));

        const issues = identifyTopIssues(graph, history, new Set(), new Map());

        expect(issues.length).toBe(1);
        expect(issues[0].reason).toContain('Side-Effect Driver');
    });

    it('SCENARIO C: Identifies State Cascades (Prime Movers)', () => {
        // Scenario: A state update triggers another state update (via un-instrumented path or chain)
        // A -> B -> C
        const graph = createGraph([
            ['App.tsx -> Source', 'App.tsx -> Middle'],
            ['App.tsx -> Middle', 'App.tsx -> End'],
        ]);

        const history = new Map<string, RingBufferMetadata>();
        history.set('App.tsx -> Source', createMeta(SignalRole.LOCAL));
        history.set('App.tsx -> Middle', createMeta(SignalRole.LOCAL));
        history.set('App.tsx -> End', createMeta(SignalRole.LOCAL));

        const issues = identifyTopIssues(graph, history, new Set(), new Map());

        // Source drives the chain, so it should be the top issue
        expect(issues[0].label).toBe('App.tsx -> Source');
        expect(issues[0].reason).toContain('Sync Driver');
    });

    it('Filtering: Contexts should not be listed as Prime Movers', () => {
        // Scenario: Context updates Local state. This is normal.
        // Graph: Context -> Local
        const graph = createGraph([
            ['AuthContext', 'App.tsx -> User'],
        ]);

        const history = new Map<string, RingBufferMetadata>();
        history.set('AuthContext', createMeta(SignalRole.CONTEXT));
        history.set('App.tsx -> User', createMeta(SignalRole.LOCAL));

        const issues = identifyTopIssues(graph, history, new Set(), new Map());

        // Contexts are anchors, not refactor targets.
        expect(issues.length).toBe(0);
    });

    it('Fallback: Uses Density if Graph is empty', () => {
        const graph = new Map();
        const history = new Map<string, RingBufferMetadata>();

        // Volatile variable
        history.set('App.tsx -> Scroll', createMeta(SignalRole.LOCAL, 60)); // Density 60

        const issues = identifyTopIssues(graph, history, new Set(), new Map());

        expect(issues.length).toBe(1);
        expect(issues[0].label).toBe('App.tsx -> Scroll');
        expect(issues[0].metric).toBe('density');
        expect(issues[0].reason).toContain('High Frequency');
    });

    it('Formatting: Handles anonymous/fallback labels in Global Events', () => {
        const graph = createGraph([
            ['Event_Tick_1', 'anon_state_0'],
            ['Event_Tick_1', 'anon_state_1'],
        ]);

        const history = new Map<string, RingBufferMetadata>();
        history.set('anon_state_0', createMeta(SignalRole.LOCAL));
        history.set('anon_state_1', createMeta(SignalRole.LOCAL));

        const issues = identifyTopIssues(graph, history, new Set(), new Map());

        expect(issues[0].label).toContain('anon_state_0');
        expect(issues[0].label).toContain('Global Event');
    });

});
