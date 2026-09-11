// fixtures/rapid-and-async/expect.ts

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
import { drive, driveTimeout, drivePromise } from './interactions';

describe('fixture: rapid-and-async', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
    });

    afterEach(() => {
        teardownFixture();
    });

    it('groups a same-frame burst under one event, with no causal chain', async () => {
        render(React.createElement(App));
        await drive(harness, 'burst', 5);

        const graph = harness.graph();
        const violations = harness.violations();

        expectSharedEventSource(graph, 'a', 'b');
        expectSharedEventSource(graph, 'a', 'c');
        forbidEdge(graph, 'a', 'b');
        forbidEdge(graph, 'b', 'c');
        forbidEdge(graph, 'a', 'c');
        forbidDiagnostic(violations, { type: 'causal_leak' });

        expectDiagnostic(violations, {
            source: 'a',
            target: 'b',
            type: 'duplicate_state',
        });
    });

    it('does not treat a long gap between A and B as causation', async () => {
        render(React.createElement(App, { scene: 'gap' }));
        await drive(harness, 'bumpA', 5);
        await harness.advance(2000);
        await harness.flushFrame();
        await drive(harness, 'bumpB', 5);

        const graph = harness.graph();
        const violations = harness.violations();

        forbidEdge(graph, 'a', 'b');
        forbidEdge(graph, 'b', 'a');
        forbidSharedEventSource(graph, 'a', 'b');
        forbidDiagnostic(violations, { source: 'a', target: 'b' });
        forbidDiagnostic(violations, { source: 'b', target: 'a' });
        forbidDiagnostic(violations, { type: 'causal_leak' });
    });

    it('does not group a 500ms timeout write onto the original click event', async () => {
        render(React.createElement(App, { scene: 'timeout' }));
        await driveTimeout(harness, 5);

        forbidSharedEventSource(harness.graph(), 'a', 'b');
        forbidEdge(harness.graph(), 'a', 'b');
        forbidDiagnostic(harness.violations(), { type: 'causal_leak' });
    });

    it('keeps a microtask follow-up off the causal_leak path', async () => {
        render(React.createElement(App, { scene: 'promise' }));
        await drivePromise(harness, 5);

        forbidDiagnostic(harness.violations(), { type: 'causal_leak' });
        forbidEdge(harness.graph(), 'a', 'b');
    });
});