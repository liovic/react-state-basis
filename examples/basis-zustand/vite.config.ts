import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { basis } from 'react-state-basis/vite'

export default defineConfig({
  plugins: [
    react({
      babel: { plugins: [['react-state-basis/plugin']] }
    }),
    basis()
  ],
})