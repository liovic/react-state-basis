// fixtures/_harness/index.ts

import { vi } from 'vitest';
import { __testEngine__ } from '../../src/engine';
import type { BasisGraphJSON, ViolationDetail } from '../../src/core/types';

export interface FixtureHarness {
    flushFrame: () => Promise<void>;
    advance: (ms: number) => Promise<void>;
    graph: () => BasisGraphJSON;
    violations: () => Map<string, ViolationDetail[]>;
    instance: typeof __testEngine__.instance;
}

let rafQueue: { id: number; cb: FrameRequestCallback }[] = [];
let nextRafId = 1;

const deterministicRandom = () => {
    let seed = 42;
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};

const resetEngine = (instance: typeof __testEngine__.instance) => {
    instance.history.clear();
    instance.graph.clear();
    instance.violationMap.clear();
    instance.redundantLabels.clear();
    instance.loopCounters.clear();
    instance.pausedVariables.clear();
    instance.currentTickBatch.clear();
    instance.tick = 0;
    instance.isBatching = false;
    instance.currentEffectSource = null;
    instance.lastStateUpdate = null;
    instance.booted = false;
    instance.alertCount = 0;
    instance.metrics.lastAnalysisTimeMs = 0;
    instance.metrics.comparisonCount = 0;
    instance.metrics.lastAnalysisTimestamp = 0;
    instance.metrics.systemEntropy = 0;
};

export function setupFixture(): FixtureHarness {
    rafQueue = [];
    nextRafId = 1;

    const { instance } = __testEngine__;
    resetEngine(instance);

    vi.useFakeTimers({
        toFake: ['Date', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
    });

    instance.lastCleanup = Date.now();

    vi.spyOn(Math, 'random').mockImplementation(deterministicRandom());

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
        const id = nextRafId++;
        rafQueue.push({ id, cb });
        return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
        rafQueue = rafQueue.filter((entry) => entry.id !== id);
    });
    vi.stubGlobal('requestIdleCallback', (cb: (deadline: IdleDeadline) => void) =>
        cb({ timeRemaining: () => 10, didTimeout: false } as IdleDeadline)
    );

    __testEngine__.configureBasis({ debug: true });

    const flushFrame = async () => {
        const due = rafQueue.splice(0);
        due.forEach((entry) => entry.cb(performance.now()));
        await vi.runAllTimersAsync();
    };

    const advance = async (ms: number) => {
        vi.advanceTimersByTime(ms);
        await vi.runAllTimersAsync();
    };

    return {
        flushFrame,
        advance,
        graph: () => __testEngine__.getBasisGraph(),
        violations: () => instance.violationMap,
        instance,
    };
}

export function teardownFixture() {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
}