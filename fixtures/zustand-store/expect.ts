// fixtures/zustand-store/expect.ts

import React from 'react';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SignalRole } from '../../src/core/types';
import { setupFixture, teardownFixture, type FixtureHarness } from '../_harness';
import {
    expectDiagnostic,
    forbidDiagnostic,
    expectNodeRole,
    forbidEdge,
    expectSharedEventSource,
} from '../_harness/assertions';
import { App } from './App';
import { useShopStore } from './store';
import { drive } from './interactions';

describe('fixture: zustand-store', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
        useShopStore.setState({
            theme: 'light',
            count: 0,
            isLoading: false,
            data: null,
        });
    });

    afterEach(() => {
        teardownFixture();
    });

    it('registers changed keys as STORE and ignores untouched keys', async () => {
        render(React.createElement(App));
        await drive(harness, 'theme', 5);

        const graph = harness.graph();

        expectNodeRole(graph, 'theme', SignalRole.STORE);
        expectNodeRole(graph, 'ShopStore', SignalRole.STORE);

        const names = graph.nodes.map((n) => n.name);
        expect(names.includes('count')).toBe(false);
        expect(names.includes('isLoading')).toBe(false);
    });

    it('records both keys from one set() and does not flag two STORE signals as duplicates', async () => {
        render(React.createElement(App));
        await drive(harness, 'fetch', 5);

        const graph = harness.graph();
        const violations = harness.violations();

        expectNodeRole(graph, 'isLoading', SignalRole.STORE);
        expectNodeRole(graph, 'data', SignalRole.STORE);
        expectSharedEventSource(graph, 'isLoading', 'data');

        forbidDiagnostic(violations, {
            source: 'isLoading',
            target: 'data',
            type: 'duplicate_state',
        });
        forbidDiagnostic(violations, { type: 'context_mirror' });
        forbidEdge(graph, 'isLoading', 'data');
    });

    it('does not treat an independent store field as related to theme', async () => {
        render(React.createElement(App));
        await drive(harness, 'theme', 5);
        await drive(harness, 'count', 5);

        const graph = harness.graph();
        forbidEdge(graph, 'theme', 'count');
        forbidEdge(graph, 'count', 'theme');
        forbidDiagnostic(harness.violations(), {
            source: 'theme',
            target: 'count',
        });
    });

    it('flags local state that copies a store field', async () => {
        render(React.createElement(App, { scene: 'mirror' }));
        await drive(harness, 'theme', 5);
        await drive(harness, 'note', 5);

        const violations = harness.violations();

        expectDiagnostic(violations, {
            source: 'theme',
            target: 'localTheme',
            type: 'context_mirror',
        });
        forbidDiagnostic(violations, { source: 'notes' });
        forbidDiagnostic(violations, { target: 'notes' });
    });

    it('does not flag an independent local under the same store', async () => {
        render(React.createElement(App, { scene: 'independent' }));
        await drive(harness, 'theme', 5);
        await drive(harness, 'type', 5);

        forbidDiagnostic(harness.violations(), {
            source: 'theme',
            target: 'draft',
            type: 'context_mirror',
        });
        forbidDiagnostic(harness.violations(), { source: 'draft' });
        forbidDiagnostic(harness.violations(), { target: 'draft' });
    });

    it('does not flag two STORE sources that update in the same click', async () => {
        render(React.createElement(App, { scene: 'two' }));
        await drive(harness, 'both', 5);

        const violations = harness.violations();
        forbidDiagnostic(violations, { type: 'duplicate_state' });
        forbidDiagnostic(violations, { type: 'context_mirror' });
        forbidDiagnostic(violations, { type: 'causal_leak' });
        forbidEdge(harness.graph(), 'theme', 'user');
    });

    it('records an imperative store setState the same as a hook-bound action', async () => {
        render(React.createElement(App, { scene: 'imperative' }));
        await drive(harness, 'imperative', 5);

        expectNodeRole(harness.graph(), 'theme', SignalRole.STORE);
    });
});