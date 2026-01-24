// tests/ui.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BasisHUD } from '../src/ui/BasisHUD';
import { history, redundantLabels } from '../src/engine';

class MockPath2D {
    rect = vi.fn();
}
global.Path2D = MockPath2D as any;

const mockCtx = {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    getContext: vi.fn(),
    font: '',
    fillStyle: '',
};

describe('BasisHUD Component (v0.4.2 Optimized)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        history.clear();
        redundantLabels.clear();

        HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as any;

        vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            return setTimeout(() => cb(Date.now()), 16) as any;
        });

        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
            clearTimeout(id as any);
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders in collapsed state by default', () => {
        render(<BasisHUD />);
        expect(screen.getByText(/BASIS ACTIVE/i)).toBeInTheDocument();
    });

    it('expands when clicked and draws', async () => {
        render(<BasisHUD />);
        const trigger = screen.getByText(/BASIS ACTIVE/i);

        fireEvent.click(trigger);

        await act(async () => {
            vi.advanceTimersByTime(20);
        });

        expect(screen.getByText(/STATE BASIS MATRIX/i)).toBeInTheDocument();
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('draws matrix when history has v0.4.2 metadata', async () => {
        history.set('test.tsx -> count', {
            buffer: new Uint8Array(50).fill(1),
            head: 0,
            options: {}
        });

        render(<BasisHUD />);
        fireEvent.click(screen.getByText(/BASIS ACTIVE/i));

        await act(async () => {
            vi.advanceTimersByTime(20);
        });

        expect(mockCtx.fillText).toHaveBeenCalledWith(
            expect.stringContaining('count'),
            expect.any(Number),
            expect.any(Number)
        );

        expect(mockCtx.fill).toHaveBeenCalledWith(expect.any(MockPath2D));
    });

    it('highlights redundant labels and adds "!" prefix', async () => {
        const label = 'test.tsx -> redundantVar';

        history.set(label, {
            buffer: new Uint8Array(50).fill(1),
            head: 0,
            options: {}
        });
        redundantLabels.add(label);

        render(<BasisHUD />);
        fireEvent.click(screen.getByText(/BASIS ACTIVE/i));

        await act(async () => {
            vi.advanceTimersByTime(20);
        });

        expect(mockCtx.fillText).toHaveBeenCalledWith(
            expect.stringContaining('! redundantVar'),
            expect.any(Number),
            expect.any(Number)
        );
    });

    it('collapses back when clicked again', async () => {
        render(<BasisHUD />);
        const trigger = screen.getByText(/BASIS ACTIVE/i);

        fireEvent.click(trigger);
        expect(screen.getByText(/STATE BASIS MATRIX/i)).toBeInTheDocument();

        const expandedHeader = screen.getByText(/STATE BASIS MATRIX/i);
        fireEvent.click(expandedHeader);

        expect(screen.getByText(/BASIS ACTIVE/i)).toBeInTheDocument();
    });
});