// fixtures/multiple-instances/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

export async function driveRename(
    harness: FixtureHarness,
    row: 'a' | 'b',
    times = 5
) {
    const button = screen.getByText(`${row}-rename`);
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
        await harness.flushFrame();
    }
}