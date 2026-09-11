// fixtures/intentional-sync/expect.ts

import React from 'react';
import { describe, it, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { setupFixture, teardownFixture, type FixtureHarness } from '../_harness';
import {
    expectDiagnostic,
    forbidDiagnostic,
    forbidEdge,
    expectSharedEventSource,
    forbidSharedEventSource,
} from '../_harness/assertions';
import { App } from './App';
import { driveToggle, driveTheme, driveToggleSplit } from './interactions';

describe('fixture: intentional-sync', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
    });

    afterEach(() => {
        teardownFixture();
    });

    it('treats isLoading/isSuccess as event siblings: correlated, not causal', async () => {
        render(React.createElement(App));
        await driveToggle(harness, 5);

        const graph = harness.graph();
        const violations = harness.violations();

        forbidEdge(graph, 'isLoading', 'isSuccess');
        forbidEdge(graph, 'isSuccess', 'isLoading');
        forbidDiagnostic(violations, { source: 'isLoading', type: 'causal_leak' });
        forbidDiagnostic(violations, { source: 'isSuccess', type: 'causal_leak' });

        expectSharedEventSource(graph, 'isLoading', 'isSuccess');

        expectDiagnostic(violations, {
            source: 'isLoading',
            target: 'isSuccess',
            type: 'duplicate_state',
        });
    });

    it('does not pull an independent flag into the pair', async () => {
        render(React.createElement(App));
        await driveToggle(harness, 5);
        await driveTheme(harness, 5);

        const violations = harness.violations();
        forbidDiagnostic(violations, { source: 'isDark' });
        forbidDiagnostic(violations, { target: 'isDark' });
        forbidEdge(harness.graph(), 'isLoading', 'isDark');
        forbidEdge(harness.graph(), 'isSuccess', 'isDark');
    });

    it('does not look like same-handler sync when success is copied by an effect', async () => {
        render(React.createElement(App, { scene: 'effect' }));
        await driveToggle(harness, 5);

        const graph = harness.graph();
        const violations = harness.violations();

        expectDiagnostic(violations, {
            source: 'isLoading',
            target: 'isSuccess',
            type: 'duplicate_state',
        });
        forbidDiagnostic(violations, { type: 'causal_leak' });
        forbidSharedEventSource(graph, 'isLoading', 'isSuccess');
    });

    it('still records a setter call even when React bails out on a no-op', async () => {
        render(React.createElement(App, { scene: 'noop' }));
        await driveToggle(harness, 5);

        expectDiagnostic(harness.violations(), {
            source: 'isLoading',
            target: 'isSuccess',
            type: 'duplicate_state',
        });
    });

    it('records split-frame handler writes as separate paints', async () => {
        render(React.createElement(App, { scene: 'split' }));
        await driveToggleSplit(harness, 5);

        forbidSharedEventSource(harness.graph(), 'isLoading', 'isSuccess');
    });
});