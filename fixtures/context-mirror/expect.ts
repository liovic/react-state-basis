// fixtures/context-mirror/expect.ts

import React from 'react';
import { describe, it, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { SignalRole } from '../../src/core/types';
import { setupFixture, teardownFixture, type FixtureHarness } from '../_harness';
import {
    expectDiagnostic,
    forbidDiagnostic,
    expectNodeRole,
    forbidEdge,
} from '../_harness/assertions';
import { App } from './App';
import { driveTheme, driveClicks, driveType } from './interactions';

describe('fixture: context-mirror', () => {
    let harness: FixtureHarness;

    beforeEach(() => {
        harness = setupFixture();
    });

    afterEach(() => {
        teardownFixture();
    });

    it('flags localTheme as a mirror of context theme, and leaves clicks alone', async () => {
        render(React.createElement(App));
        await driveTheme(harness, 5);
        await driveClicks(harness, 5);

        const graph = harness.graph();
        const violations = harness.violations();

        expectNodeRole(graph, 'theme', SignalRole.CONTEXT);
        expectNodeRole(graph, 'localTheme', SignalRole.LOCAL);
        expectNodeRole(graph, 'clicks', SignalRole.LOCAL);
        expectDiagnostic(violations, {
            source: 'theme',
            target: 'localTheme',
            type: 'context_mirror',
        });

        forbidDiagnostic(violations, { source: 'clicks' });
        forbidDiagnostic(violations, { target: 'clicks' });
        forbidDiagnostic(violations, {
            source: 'theme',
            target: 'clicks',
            type: 'context_mirror',
        });

        forbidEdge(graph, 'clicks', 'localTheme');
        forbidEdge(graph, 'clicks', 'theme');
    });

    it('does not treat an independent local as a context mirror', async () => {
        render(React.createElement(App, { scene: 'independent' }));
        await driveTheme(harness, 5);
        await driveType(harness, 5);

        const violations = harness.violations();

        forbidDiagnostic(violations, {
            source: 'theme',
            target: 'draft',
            type: 'context_mirror',
        });
        forbidDiagnostic(violations, { source: 'draft' });
        forbidDiagnostic(violations, { target: 'draft' });
    });
});