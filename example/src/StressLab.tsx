import { useState, useEffect } from 'react-state-basis'

const StressNode = ({ index }: { index: number }) => {
  const [val, setVal] = useState(0, `stress_node_${index}`)

  useEffect(() => {
    const id = setInterval(() => setVal(v => v + 1), 100)
    return () => clearInterval(id)
  }, [])

  return null
}

export const StressLab = () => {
  const [active, setActive] = useState(false)

  return (
    <div style={{ padding: '15px', border: '1px solid #00ff41', margin: '10px', gridColumn: 'span 2' }}>
      <h4 style={{ color: '#00ff41' }}>⚡ 4. Performance Stress Lab</h4>
      <p>Status: {active ? "RUNNING 100 ACTIVE HOOKS" : "IDLE"}</p>
      <button 
        onClick={() => setActive(!active)}
        style={{ background: active ? '#ff4757' : '#00ff41', color: 'black' }}
      >
        {active ? "STOP STRESS TEST" : "START 100-HOOK STRESS TEST"}
      </button>
      
      {active && Array.from({ length: 100 }).map((_, i) => (
        <StressNode key={i} index={i} />
      ))}

      <p style={{ fontSize: '10px', color: '#888', marginTop: '10px' }}>
        When active, Basis is performing ~5,000 pairwise comparisons every 100ms.
        Check Chrome Performance tab to verify &lt; 1% CPU impact.
      </p>
    </div>
  )
}