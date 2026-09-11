// fixtures/strict-mode/expect.ts

import React from 'react';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SignalRole } from '../../src/core/types';
import { setupFixture, teardownFixture, type FixtureHarness } from '../_harness';
import {
    expectDiagnostic,
    forbidDiagnostic,
    expectEdge,
    forbidEdge,
    expectNodeRole,
    nodesByName,
} from '../_harness/assertions';
import { App } from './App';
import { settle, driveRename, driveBirthday } from './interactions';

describe('fixture: strict-mode', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
    });

    afterEach(() => {
        teardownFixture();
    });

    it('does not invent a hit from Strict Mode mount/remount alone', async () => {
        render(React.createElement(App));
        await settle(harness);

        forbidDiagnostic(harness.violations(), { type: 'duplicate_state' });
        forbidDiagnostic(harness.violations(), { type: 'causal_leak' });
    });

    it('still reports the real copy, once, after user updates', async () => {
        render(React.createElement(App));
        await settle(harness);
        await driveRename(harness, 5);
        await driveBirthday(harness, 5);

        const graph = harness.graph();
        const violations = harness.violations();

        expectNodeRole(graph, 'firstName', SignalRole.LOCAL);
        expectNodeRole(graph, 'fullName', SignalRole.LOCAL);

        expectEdge(graph, 'effect_L1', 'fullName');
        forbidEdge(graph, 'firstName', 'age');
        forbidEdge(graph, 'fullName', 'age');

        expectDiagnostic(violations, {
            source: 'firstName',
            target: 'fullName',
            type: 'duplicate_state',
        });
        forbidDiagnostic(violations, { source: 'age' });
        forbidDiagnostic(violations, { target: 'age' });
    });

    it('does not leave a second live firstName from the discarded Strict Mode mount', async () => {
        render(React.createElement(App));
        await settle(harness);
        await driveRename(harness, 5);

        const live = nodesByName(harness.graph(), 'firstName').filter((n) =>
            harness.graph().edges.some((e) => e.source === n.id || e.target === n.id)
        );

        expect(live.length).toBeLessThanOrEqual(1);
    });
});