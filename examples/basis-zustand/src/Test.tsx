// src/ComplexTest.tsx

import { useState, useEffect } from 'react'
import { useSettingsStore } from './store'

export const Test = () => {
  const globalTheme = useSettingsStore((s) => s.theme)
  const toggleGlobal = useSettingsStore((s) => s.toggleTheme)

  const [activeTheme, setActiveTheme] = useState(globalTheme)
  const [isChanging, setIsChanging] = useState(false)
  const [isSaved, setIsSaved] = useState(true)

  useEffect(() => {
    setActiveTheme(globalTheme)
  }, [globalTheme])

  const handleThemeSwitch = () => {
    
    toggleGlobal();
    setIsChanging(true);
    setIsSaved(false);
    
    setTimeout(() => {
        setIsChanging(false);
        setIsSaved(true);
    }, 500);
  }

  return (
    <div style={{ padding: 20, border: '2px dashed purple', margin: 20 }}>
      <h3>Test</h3>
      <div>Global Store: <strong>{globalTheme}</strong></div>
      <div>Local Shadow: <strong>{activeTheme}</strong></div>
      
      <div style={{ marginTop: 10 }}>
         Status: {isChanging ? 'Wait...' : 'Ready'} | Saved: {isSaved ? 'Yes' : 'No'}
      </div>

      <button 
        onClick={handleThemeSwitch}
        style={{ marginTop: 20, padding: 10, fontSize: 16 }}
      >
        Trigger "Split State" Event
      </button>
    </div>
  )
}