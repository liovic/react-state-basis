// fixtures/effect-chain/expect.ts

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
    forbidSharedEventSource,
} from '../_harness/assertions';
import { App } from './App';
import { driveChain, driveNoise } from './interactions';

describe('fixture: effect-chain', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
    });

    afterEach(() => {
        teardownFixture();
    });

    it('graphs A → effect_B → B → effect_C → C and does not stop at C', async () => {
        render(React.createElement(App));
        await driveChain(harness, 5);
        await driveNoise(harness, 5);

        const graph = harness.graph();
        const violations = harness.violations();

        expectNodeRole(graph, 'a', SignalRole.LOCAL);
        expectNodeRole(graph, 'b', SignalRole.LOCAL);
        expectNodeRole(graph, 'c', SignalRole.LOCAL);
        expectNodeRole(graph, 'noise', SignalRole.LOCAL);

        expectEdge(graph, 'effect_B', 'b');
        expectEdge(graph, 'effect_C', 'c');

        forbidEdge(graph, 'a', 'c');
        forbidEdge(graph, 'noise', 'a');
        forbidEdge(graph, 'noise', 'b');
        forbidEdge(graph, 'noise', 'c');

        expectDiagnostic(violations, {
            source: 'a',
            target: 'b',
            type: 'duplicate_state',
        });
        expectDiagnostic(violations, {
            source: 'b',
            target: 'c',
            type: 'duplicate_state',
        });

        forbidDiagnostic(violations, { source: 'noise' });
        forbidDiagnostic(violations, { target: 'noise' });

        forbidSharedEventSource(graph, 'a', 'b');
        forbidSharedEventSource(graph, 'b', 'c');
    });
});