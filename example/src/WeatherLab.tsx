import { useState, useEffect } from 'react'

export const WeatherLab = () => {
  const [celsius, setCelsius] = useState(20)
  const [fahrenheit, setFahrenheit] = useState(68)

  useEffect(() => {
    setFahrenheit(celsius * 1.8 + 32)
  }, [celsius])

  return (
    <div className="diagnostic-card causal">
      <div className="card-tag">01 // TEMPORAL_LAG_MONITOR</div>
      <h2>Weather State Synchronization</h2>
      <div className="readout-main">
        {celsius}<span style={{ color: 'var(--zinc-200)' }}>°C</span>
        <span style={{ color: 'var(--cyan)', margin: '0 10px' }}>→</span>
        {fahrenheit.toFixed(1)}<span style={{ color: 'var(--zinc-200)' }}>°F</span>
      </div>
      <div className="status-label">
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)' }} />
        SIGNAL_DETECTED: STABLE_LAG_PATTERN
      </div>
      <button onClick={() => setCelsius(Math.floor(Math.random() * 40))}>
        RANDOMIZE_PROBE_DATA
      </button>
    </div>
  )
}