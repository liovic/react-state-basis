// fixtures/context-mirror/App.tsx

import React from 'react';
import {
    useState,
    useEffect,
    createContext,
    useContext,
} from '../../src/hooks';
import { BasisProvider } from '../../src/context';

const ThemeContext = createContext('light', 'ContextMirror.tsx -> theme');

function ThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [theme, setTheme] = useState('light', 'ContextMirror.tsx -> themeState');

    return (
        <ThemeContext.Provider value={theme}>
            <button onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}>
                toggleTheme
            </button>
            {children}
        </ThemeContext.Provider>
    );
}

export function MirrorScene() {
    const theme = useContext(ThemeContext);
    const [localTheme, setLocalTheme] = useState('light', 'ContextMirror.tsx -> localTheme');
    const [clicks, setClicks] = useState(0, 'ContextMirror.tsx -> clicks');

    useEffect(() => {
        setLocalTheme(theme);
    }, [theme], 'ContextMirror.tsx -> effect_mirror');

    return (
        <div>
            <button onClick={() => setClicks((n) => n + 1)}>click</button>
            <span data-testid="theme">{theme}</span>
            <span data-testid="localTheme">{localTheme}</span>
            <span data-testid="clicks">{clicks}</span>
        </div>
    );
}

export function IndependentLocalScene() {
    const theme = useContext(ThemeContext);
    const [draft, setDraft] = useState('', 'ContextMirror.tsx -> draft');

    return (
        <div>
            <button onClick={() => setDraft((d) => d + 'x')}>type</button>
            <span data-testid="theme">{theme}</span>
            <span data-testid="draft">{draft}</span>
        </div>
    );
}

export function App({ scene = 'mirror' }: { scene?: 'mirror' | 'independent' }) {
    return (
        <BasisProvider debug showHUD={false}>
            <ThemeProvider>
                {scene === 'mirror' && <MirrorScene />}
                {scene === 'independent' && <IndependentLocalScene />}
            </ThemeProvider>
        </BasisProvider>
    );
}