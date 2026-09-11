// fixtures/high-frequency/expect.ts

import React from 'react';
import { describe, it, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { setupFixture, teardownFixture, type FixtureHarness } from '../_harness';
import {
    expectDiagnostic,
    forbidDiagnostic,
    forbidEdge,
} from '../_harness/assertions';
import { App } from './App';
import { driveFrames, driveClicks } from './interactions';

describe('fixture: high-frequency', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
    });

    afterEach(() => {
        teardownFixture();
    });

    it('does not flag a single rAF-driven value as an architectural issue', async () => {
        render(React.createElement(App));
        await driveFrames(harness, 20);

        const violations = harness.violations();
        forbidDiagnostic(violations, { type: 'duplicate_state' });
        forbidDiagnostic(violations, { type: 'causal_leak' });
        forbidDiagnostic(violations, { type: 'context_mirror' });
        forbidDiagnostic(violations, { source: 'frame' });
    });

    it('does not attach animation updates to an unrelated click', async () => {
        render(React.createElement(App));
        await driveFrames(harness, 20);
        await driveClicks(harness, 5);

        const graph = harness.graph();
        const violations = harness.violations();

        forbidDiagnostic(violations, { source: 'clicks' });
        forbidDiagnostic(violations, { target: 'clicks' });
        forbidEdge(graph, 'frame', 'clicks');
        forbidEdge(graph, 'clicks', 'frame');
    });

    it('still reports correlation when two values are written on every frame', async () => {
        render(React.createElement(App, { scene: 'paired' }));
        await driveFrames(harness, 20);

        expectDiagnostic(harness.violations(), {
            source: 'frame',
            target: 'offset',
            type: 'duplicate_state',
        });
    });
});