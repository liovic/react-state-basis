import { BasisProvider } from 'react-state-basis'
import { useContext } from 'react'
import { AuthProvider, AuthContext } from './AuthContext'
import { ThemeProvider, ThemeContext } from './ThemeContext'
import { WeatherLab } from './WeatherLab'
import { BooleanEntanglement } from './BooleanEntanglement'
import { InfiniteCrashLab } from './InfiniteCrashLab'
import { StressLab } from './StressLab'
import './App.css'
import AnimationTests from './AnimationTests'

function GlobalNeuralController() {
  const { login, logout } = useContext(AuthContext)
  const { setTheme } = useContext(ThemeContext)

  const handleGlobalSync = () => {
    let i = 0;
    const interval = setInterval(() => {
      if (i % 2 === 0) {
        login({ name: 'Admin' });
        setTheme('dark');
      } else {
        logout();
        setTheme('light');
      }
      i++;
      if (i > 10) clearInterval(interval);
    }, 200);
  }

  return (
    <div style={{
      gridColumn: 'span 2',
      marginTop: '20px',
      padding: '24px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div>
        <div className="card-tag">SYSTEM_COMMAND_CENTER</div>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Global Override</h2>
        <p className="mono" style={{ fontSize: '10px', color: 'var(--slate-500)', marginTop: '4px' }}>
          Simulating cross-context entanglement between Auth and Theme providers.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleGlobalSync}
          style={{ background: '#0f172a', color: '#fff', padding: '12px 24px' }}
        >
          INITIATE_SYSTEM_SYNC
        </button>
      </div>
    </div>
  )
}

function Header() {
  return (
    <header>
      <div>
        <h1 className="mono" style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '-1px' }}>
          BASIS<span style={{ color: 'var(--cyan)' }}>_LABS</span>
        </h1>
        <div className="card-tag">TEMPORAL_SIGNAL_CORE</div>
      </div>

      <button className="secondary" style={{ margin: 0 }} onClick={() => (window as any).printBasisReport()}>
        GENERATE_HEALTH_REPORT
      </button>
    </header>
  )
}

export default function App() {
  return (
    <BasisProvider debug={true}>
      <AuthProvider>
        <ThemeProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div className="dashboard-grid">
              <GlobalNeuralController />
              <WeatherLab />
              <BooleanEntanglement />
              <InfiniteCrashLab />
              <StressLab />
              <AnimationTests />
            </div>

            <div style={{ marginTop: 'auto', padding: '20px', textAlign: 'center', opacity: 0.2, fontSize: '8px' }} className="mono">
              [DEBUG_MODE_ACTIVE] // MONITORING_COLLINEAR_STATE_VECTORS
            </div>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </BasisProvider>
  )
}