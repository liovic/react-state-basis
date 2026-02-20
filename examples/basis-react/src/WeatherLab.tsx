import { useState, useEffect } from 'react'

export const WeatherLab = () => {
  const [celsius, setCelsius] = useState(20)
  const [fahrenheit, setFahrenheit] = useState(68)

  useEffect(() => {
    setFahrenheit(celsius * 1.8 + 32)
  }, [celsius])

  return (
    <div className="diagnostic-card causal" style={{ padding: '24px' }}>
      <div className="card-tag" style={{ fontSize: '11px', marginBottom: '12px' }}>
        01 // TEMPORAL_LAG_MONITOR
      </div>
      <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>
        Weather State Synchronization
      </h2>

      <div className="readout-main" style={{
        fontSize: '56px',
        fontWeight: 800,
        margin: '32px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '-2px'
      }}>
        {celsius}<span style={{ fontSize: '24px', color: 'var(--zinc-400)', fontWeight: 400, marginLeft: '4px' }}>°C</span>
        <span style={{ color: 'var(--cyan)', margin: '0 24px', fontSize: '38px', fontWeight: 300 }}>→</span>
        {fahrenheit.toFixed(1)}<span style={{ fontSize: '24px', color: 'var(--zinc-400)', fontWeight: 400, marginLeft: '4px' }}>°F</span>
      </div>

      <div className="status-label" style={{
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '24px',
        color: 'var(--zinc-500)',
        letterSpacing: '0.05em'
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--cyan)',
          boxShadow: '0 0 12px var(--cyan)'
        }} />
        <span className="mono">SIGNAL_DETECTED: STABLE_LAG_PATTERN</span>
      </div>

      <button
        className="primary"
        onClick={() => setCelsius(Math.floor(Math.random() * 40))}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}
      >
        RANDOMIZE_PROBE_DATA
      </button>
    </div>
  )
}