// src/App.ts

import { BasisProvider } from 'react-state-basis'
import { Test } from './Test'

function App() {
  return (
    <BasisProvider debug={true} showHUD={true}>
      <Test />
    </BasisProvider>
  )
}

export default App