// fixtures/strict-mode/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

export async function settle(harness: FixtureHarness) {
    await harness.flushFrame();
    await harness.flushFrame();
}

export async function driveRename(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('rename');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
        await harness.flushFrame();
    }
}

export async function driveBirthday(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('birthday');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
    }
}