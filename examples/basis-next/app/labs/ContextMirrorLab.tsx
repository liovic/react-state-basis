'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext('light');

function Mirror() {
  const theme = useContext(ThemeContext);
  const [localTheme, setLocalTheme] = useState(theme);

  useEffect(() => {
    const id = setTimeout(() => setLocalTheme(theme), 0);
    return () => clearTimeout(id);
  }, [theme]);

  return <p>context={theme} local={localTheme}</p>;
}

export function ContextMirrorLab() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <section className="card">
        <h2>Context mirror</h2>
        <button
          type="button"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          Toggle theme
        </button>
        <Mirror />
      </section>
    </ThemeContext.Provider>
  );
}