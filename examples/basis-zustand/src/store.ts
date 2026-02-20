// src/store.ts

import { create } from 'zustand'
import { basisLogger } from 'react-state-basis/zustand'

interface UserSettings {
  theme: 'dark' | 'light'
  notificationsEnabled: boolean
  toggleTheme: () => void
  toggleNotifications: () => void
}

export const useSettingsStore = create<UserSettings>()(
  basisLogger((set) => ({
    theme: 'light',
    notificationsEnabled: true,
    
    toggleTheme: () => set((state) => ({ 
      theme: state.theme === 'light' ? 'dark' : 'light' 
    })),
    
    toggleNotifications: () => set((state) => ({ 
      notificationsEnabled: !state.notificationsEnabled 
    })),
  }), 'GlobalSettingsStore') // <--- Naming the store node, basis need this
)