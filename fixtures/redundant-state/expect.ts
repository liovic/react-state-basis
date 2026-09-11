// fixtures/redundant-state/expect.ts

import React from 'react';
import { describe, it, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SignalRole } from '../../src/core/types';
import { setupFixture, teardownFixture, type FixtureHarness } from '../_harness';
import {
    expectDiagnostic,
    forbidDiagnostic,
    expectEdge,
    forbidEdge,
    expectNodeRole,
    expectDistinctInstances,
} from '../_harness/assertions';
import { App } from './App';
import { driveRename, driveBirthday, driveRemount } from './interactions';

describe('fixture: redundant-state', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
    });

    afterEach(() => {
        teardownFixture();
    });

    it('flags fullName as a duplicate of firstName, and leaves age alone', async () => {
        render(React.createElement(App));

        await driveRename(harness, 5);
        await driveBirthday(harness, 5);

        const graph = harness.graph();
        const violations = harness.violations();

        expectNodeRole(graph, 'firstName', SignalRole.LOCAL);
        expectNodeRole(graph, 'fullName', SignalRole.LOCAL);
        expectNodeRole(graph, 'age', SignalRole.LOCAL);
        expectNodeRole(graph, 'effect_L1', 'effect');

        expectEdge(graph, 'effect_L1', 'fullName');
        forbidEdge(graph, 'firstName', 'age');
        forbidEdge(graph, 'fullName', 'age');
        forbidEdge(graph, 'age', 'firstName');
        forbidEdge(graph, 'age', 'fullName');

        expectDiagnostic(violations, {
            source: 'firstName',
            target: 'fullName',
            type: 'duplicate_state',
        });
        expectDiagnostic(violations, {
            source: 'fullName',
            target: 'firstName',
            type: 'duplicate_state',
        });

        forbidDiagnostic(violations, { source: 'age' });
        forbidDiagnostic(violations, { target: 'age' });
    });

    it('does not flag after a single rename (below the observation window)', async () => {
        render(React.createElement(App));
        await driveRename(harness, 1);

        forbidDiagnostic(harness.violations(), {
            source: 'firstName',
            target: 'fullName',
            type: 'duplicate_state',
        });
    });

    it('does not flag when only the independent control moves', async () => {
        render(React.createElement(App));
        await driveBirthday(harness, 5);

        forbidDiagnostic(harness.violations(), { type: 'duplicate_state' });
    });

    it('stays quiet when fullName is derived during render', async () => {
        render(React.createElement(App, { scene: 'derived' }));
        await driveRename(harness, 5);
        await driveBirthday(harness, 5);

        const violations = harness.violations();
        forbidDiagnostic(violations, { type: 'duplicate_state' });
        forbidDiagnostic(violations, { type: 'causal_leak' });
    });

    it('does not keep the unmounted instance on the graph', async () => {
        render(React.createElement(App, { scene: 'remount' }));
        await driveRename(harness, 5);
        await driveRemount(harness);
        await driveRename(harness, 5);

        expectDistinctInstances(harness.graph(), 'firstName', 1);
        expectDistinctInstances(harness.graph(), 'fullName', 1);
    });
});