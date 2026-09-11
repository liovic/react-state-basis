// fixtures/intentional-sync/App.tsx

import React from 'react';
import { useState, useEffect } from '../../src/hooks';
import { BasisProvider } from '../../src/context';

export function IntentionalSyncScene() {
    const [isLoading, setIsLoading] = useState(false, 'IntentionalSync.tsx -> isLoading');
    const [isSuccess, setIsSuccess] = useState(false, 'IntentionalSync.tsx -> isSuccess');
    const [isDark, setIsDark] = useState(false, 'IntentionalSync.tsx -> isDark');

    const startFetch = () => {
        setIsLoading((v) => !v);
        setIsSuccess((v) => !v);
    };

    return (
        <div>
            <button onClick={startFetch}>toggle</button>
            <button onClick={() => setIsDark((v) => !v)}>theme</button>
            <span data-testid="isLoading">{String(isLoading)}</span>
            <span data-testid="isSuccess">{String(isSuccess)}</span>
            <span data-testid="isDark">{String(isDark)}</span>
        </div>
    );
}

export function EffectCopiedScene() {
    const [isLoading, setIsLoading] = useState(false, 'EffectCopied.tsx -> isLoading');
    const [isSuccess, setIsSuccess] = useState(false, 'EffectCopied.tsx -> isSuccess');

    useEffect(() => {
        setIsSuccess(isLoading);
    }, [isLoading], 'EffectCopied.tsx -> effect_L1');

    return (
        <div>
            <button onClick={() => setIsLoading((v) => !v)}>toggle</button>
            <span data-testid="isLoading">{String(isLoading)}</span>
            <span data-testid="isSuccess">{String(isSuccess)}</span>
        </div>
    );
}

export function SplitFrameScene() {
    const [isLoading, setIsLoading] = useState(false, 'SplitFrame.tsx -> isLoading');
    const [isSuccess, setIsSuccess] = useState(false, 'SplitFrame.tsx -> isSuccess');

    const startFetch = () => {
        setIsLoading((v) => !v);
        setTimeout(() => {
            setIsSuccess((v) => !v);
        }, 0);
    };

    return (
        <div>
            <button onClick={startFetch}>toggle</button>
        </div>
    );
}

export function NoopPartnerScene() {
    const [isLoading, setIsLoading] = useState(false, 'NoopPartner.tsx -> isLoading');
    const [isSuccess, setIsSuccess] = useState(false, 'NoopPartner.tsx -> isSuccess');

    const startFetch = () => {
        setIsLoading((v) => !v);
        setIsSuccess((v) => v);
    };

    return (
        <div>
            <button onClick={startFetch}>toggle</button>
        </div>
    );
}

export function App({
    scene = 'sync',
}: {
    scene?: 'sync' | 'effect' | 'split' | 'noop';
}) {
    return (
        <BasisProvider debug showHUD={false}>
            {scene === 'effect' && <EffectCopiedScene />}
            {scene === 'split' && <SplitFrameScene />}
            {scene === 'noop' && <NoopPartnerScene />}
            {scene === 'sync' && <IntentionalSyncScene />}
        </BasisProvider>
    );
}