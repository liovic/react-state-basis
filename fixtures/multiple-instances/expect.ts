// fixtures/multiple-instances/expect.ts

import React from 'react';
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { render } from '@testing-library/react';
import { setupFixture, teardownFixture, type FixtureHarness } from '../_harness';
import {
  expectDiagnostic,
  forbidDiagnostic,
  expectDistinctHistory,
  forbidEdgesBetweenSameName,
  nodesByName,
} from '../_harness/assertions';
import { App } from './App';
import { driveRename } from './interactions';

describe('fixture: multiple-instances', () => {
  let harness: FixtureHarness;

  beforeEach(() => {
    harness = setupFixture();
  });

  afterEach(() => {
    teardownFixture();
  });

  it('keeps two live rings for the same call-site label', async () => {
    render(React.createElement(App));
    await driveRename(harness, 'a', 5);
    await driveRename(harness, 'b', 5);

    const { history } = harness.instance;
    expectDistinctHistory(history, 'firstName', 2);
    expectDistinctHistory(history, 'fullName', 2);

    forbidEdgesBetweenSameName(harness.graph(), 'firstName');
    forbidEdgesBetweenSameName(harness.graph(), 'fullName');

    expect(nodesByName(harness.graph(), 'effect_L1').length).toBe(2);
  });

  it('does not pair row A with row B', async () => {
    render(React.createElement(App));
    await driveRename(harness, 'a', 5);
    await driveRename(harness, 'b', 5);

    const violations = harness.violations();

    expectDiagnostic(violations, {
      source: 'firstName',
      target: 'fullName',
      type: 'duplicate_state',
    });
    forbidDiagnostic(violations, { source: 'firstName', target: 'firstName' });
    forbidDiagnostic(violations, { source: 'fullName', target: 'fullName' });
    forbidEdgesBetweenSameName(harness.graph(), 'firstName');
    forbidEdgesBetweenSameName(harness.graph(), 'fullName');
  });

  it('driving only A still leaves B registered', async () => {
    render(React.createElement(App));
    await driveRename(harness, 'a', 5);

    expectDistinctHistory(harness.instance.history, 'firstName', 2);
    expectDistinctHistory(harness.instance.history, 'fullName', 2);

    expectDiagnostic(harness.violations(), {
      source: 'firstName',
      target: 'fullName',
      type: 'duplicate_state',
    });
    forbidEdgesBetweenSameName(harness.graph(), 'firstName');
  });
});