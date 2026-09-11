// fixtures/zustand-store/App.tsx

import React from 'react';
import { useState, useEffect } from '../../src/hooks';
import { BasisProvider } from '../../src/context';
import { useAuthStore, useShopStore } from './store';

export function StoreOnlyScene() {
    const theme = useShopStore((s) => s.theme);
    const count = useShopStore((s) => s.count);
    const toggleTheme = useShopStore((s) => s.toggleTheme);
    const increment = useShopStore((s) => s.increment);
    const fetchAll = useShopStore((s) => s.fetchAll);

    return (
        <div>
            <button onClick={toggleTheme}>theme</button>
            <button onClick={increment}>count</button>
            <button onClick={fetchAll}>fetch</button>
            <span data-testid="theme">{theme}</span>
            <span data-testid="count">{count}</span>
        </div>
    );
}

export function MirrorScene() {
    const theme = useShopStore((s) => s.theme);
    const toggleTheme = useShopStore((s) => s.toggleTheme);
    const [localTheme, setLocalTheme] = useState('light', 'ZustandApp.tsx -> localTheme');
    const [notes, setNotes] = useState('', 'ZustandApp.tsx -> notes');

    useEffect(() => {
        setLocalTheme(theme);
    }, [theme], 'ZustandApp.tsx -> effect_mirror');

    return (
        <div>
            <button onClick={toggleTheme}>theme</button>
            <button onClick={() => setNotes((n) => n + 'x')}>note</button>
            <span data-testid="localTheme">{localTheme}</span>
        </div>
    );
}

export function IndependentLocalScene() {
    const theme = useShopStore((s) => s.theme);
    const toggleTheme = useShopStore((s) => s.toggleTheme);
    const [draft, setDraft] = useState('', 'ZustandApp.tsx -> draft');

    return (
        <div>
            <button onClick={toggleTheme}>theme</button>
            <button onClick={() => setDraft((d) => d + 'x')}>type</button>
            <span data-testid="theme">{theme}</span>
            <span data-testid="draft">{draft}</span>
        </div>
    );
}

export function TwoStoresScene() {
    const toggleTheme = useShopStore((s) => s.toggleTheme);
    const login = useAuthStore((s) => s.login);

    return (
        <div>
            <button
                onClick={() => {
                    toggleTheme();
                    login();
                }}
            >
                both
            </button>
        </div>
    );
}

export function ImperativeScene() {
    const theme = useShopStore((s) => s.theme);
    return (
        <div>
            <button onClick={() => useShopStore.getState().toggleTheme()}>imperative</button>
            <span data-testid="theme">{theme}</span>
        </div>
    );
}

export function App({
    scene = 'store',
}: {
    scene?: 'store' | 'mirror' | 'independent' | 'two' | 'imperative';
}) {
    return (
        <BasisProvider debug showHUD={false}>
            {scene === 'store' && <StoreOnlyScene />}
            {scene === 'mirror' && <MirrorScene />}
            {scene === 'independent' && <IndependentLocalScene />}
            {scene === 'two' && <TwoStoresScene />}
            {scene === 'imperative' && <ImperativeScene />}
        </BasisProvider>
    );
}