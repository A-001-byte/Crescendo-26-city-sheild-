import { useEffect, useState } from 'react'
import { Shield, Server, Bell, Sliders, Info, CheckCircle } from 'lucide-react'
import {
  fetchCityConfig,
  fetchCrisisScore,
  fetchLatestEvents,
  fetchOilData,
  fetchWards,
} from '../utils/api'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/30 bg-surface-container-low/50">
        <Icon className="w-4 h-4 text-accent-blue" />
        <h3 className="font-heading font-semibold text-text-primary text-sm">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Slider({ label, value, onChange, min = 0, max = 10, step = 0.1, color = '#3B82F6' }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-32">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-blue-500"
        style={{ accentColor: color }}
      />
      <span className="text-xs font-mono w-10 text-right text-text-primary">{value.toFixed(1)}</span>
    </div>
  )
}

export default function Settings() {
  const [city, setCity] = useState('Pune')
  const [wardList, setWardList] = useState([])
  const [enabledWards, setEnabledWards] = useState(new Set())
  const [thresholds, setThresholds] = useState({ yellow: 5, orange: 7, red: 9 })
  const [apiKeys, setApiKeys] = useState({ events: '', oil: '', risk: '' })
  const [tested, setTested] = useState({})
  const [notifications, setNotifications] = useState({ sms: true, push: true, email: false, whatsapp: false })
  const [quietStart, setQuietStart] = useState('22')
  const [quietEnd, setQuietEnd] = useState('07')
  const [weights, setWeights] = useState({ fuel: 0.35, power: 0.25, food: 0.20, logistics: 0.20 })

  useEffect(() => {
    let mounted = true

    const loadSettings = async () => {
      try {
        const [wardData, cfg] = await Promise.all([fetchWards(), fetchCityConfig()])
        if (!mounted) return

        const names = Array.isArray(wardData) ? wardData.map((w) => w.name).filter(Boolean) : []
        setWardList(names)
        setEnabledWards(new Set(names))

        if (cfg?.city) setCity(cfg.city)

        if (cfg?.service_weights) {
          setWeights({
            fuel: Number(cfg.service_weights.fuel ?? 0.35),
            power: Number(cfg.service_weights.power ?? 0.25),
            food: Number(cfg.service_weights.food ?? 0.20),
            logistics: Number(cfg.service_weights.logistics ?? 0.20),
          })
        }

        if (cfg?.alert_thresholds) {
          setThresholds({
            yellow: Number(cfg.alert_thresholds.yellow?.min ?? 5),
            orange: Number(cfg.alert_thresholds.orange?.min ?? 7),
            red: Number(cfg.alert_thresholds.red?.min ?? 9),
          })
        }
      } catch {
        if (!mounted) return
        setWardList([])
        setEnabledWards(new Set())
      }
    }

    loadSettings()
    return () => { mounted = false }
  }, [])

  const weightsSum = Object.values(weights).reduce((a, b) => a + b, 0)

  const testApi = async (key) => {
    setTested(t => ({ ...t, [key]: 'testing' }))
    try {
      if (key === 'events') await fetchLatestEvents(1)
      if (key === 'oil') await fetchOilData()
      if (key === 'risk') await fetchCrisisScore({ city })
      setTested(t => ({ ...t, [key]: 'ok' }))
    } catch {
      setTested(t => ({ ...t, [key]: 'error' }))
    }
  }

  const toggleWard = (w) => {
    setEnabledWards(prev => {
      const s = new Set(prev)
      if (s.has(w)) s.delete(w); else s.add(w)
      return s
    })
  }

  const setWeight = (key, val) => {
    setWeights(w => ({ ...w, [key]: parseFloat(val.toFixed(2)) }))
  }

  return (
    <div className="page-shell space-y-4 max-w-5xl">
      {/* City Config */}
      <Section icon={Shield} title="City Configuration">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-xs text-text-secondary w-24">Active City</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="bg-bg-elevated border border-border-default text-text-secondary text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-border-active"
            >
              {['Pune', 'Mumbai', 'Nagpur', 'Nashik'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <div className="text-xs text-text-muted mb-2">Ward Monitoring</div>
            <div className="flex flex-wrap gap-1.5">
              {wardList.map(w => (
                <button
                  key={w}
                  onClick={() => toggleWard(w)}
                  className="px-2.5 py-1 rounded-lg text-xs border transition-all"
                  style={{
                    borderColor: enabledWards.has(w) ? '#3B82F6' : '#2A3142',
                    backgroundColor: enabledWards.has(w) ? '#3B82F620' : 'transparent',
                    color: enabledWards.has(w) ? '#93C5FD' : '#64748B',
                  }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted mb-3">Alert Thresholds</div>
            <div className="space-y-3">
              <Slider label="Yellow Alert (⚠️)" value={thresholds.yellow} onChange={v => setThresholds(t => ({...t, yellow: v}))} color="#F59E0B" />
              <Slider label="Orange Alert (🔶)" value={thresholds.orange} onChange={v => setThresholds(t => ({...t, orange: v}))} color="#F97316" />
              <Slider label="Red Alert (🔴)" value={thresholds.red} onChange={v => setThresholds(t => ({...t, red: v}))} color="#EF4444" />
            </div>
          </div>
        </div>
      </Section>

      {/* API Config */}
      <Section icon={Server} title="API Configuration">
        <div className="space-y-3">
          {[
            { key: 'events', label: 'Events Feed (/api/events/latest)', placeholder: 'Connected to backend' },
            { key: 'oil', label: 'Oil Tracker (/api/events/oil)', placeholder: 'Connected to backend' },
            { key: 'risk', label: 'Risk Engine (/api/risk/city-score)', placeholder: 'Connected to backend' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-xs text-text-secondary w-36">{label}</label>
              <input
                type="text"
                value={apiKeys[key]}
                onChange={e => setApiKeys(k => ({ ...k, [key]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 bg-bg-elevated border border-border-default text-text-secondary text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-border-active font-mono"
                disabled
              />
              <button
                onClick={() => { void testApi(key) }}
                className="px-3 py-1.5 text-xs rounded-lg border border-border-default text-text-secondary hover:border-border-active hover:text-text-primary transition-colors"
              >
                {tested[key] === 'testing' ? '...' : tested[key] === 'ok' ? 'OK' : tested[key] === 'error' ? 'Error' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Notifications */}
      <Section icon={Bell} title="Notification Preferences">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {Object.keys(notifications).map(ch => (
              <label key={ch} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[ch]}
                  onChange={() => setNotifications(n => ({ ...n, [ch]: !n[ch] }))}
                  className="accent-blue-500"
                  style={{ accentColor: '#3B82F6' }}
                />
                <span className="text-sm text-text-secondary capitalize">{ch}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted">Quiet Hours</span>
            <select
              value={quietStart}
              onChange={e => setQuietStart(e.target.value)}
              className="bg-bg-elevated border border-border-default text-text-secondary text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              {Array.from({length: 24}, (_, i) => i).map(h => (
                <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
            <span className="text-xs text-text-muted">to</span>
            <select
              value={quietEnd}
              onChange={e => setQuietEnd(e.target.value)}
              className="bg-bg-elevated border border-border-default text-text-secondary text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              {Array.from({length: 24}, (_, i) => i).map(h => (
                <option key={h} value={String(h).padStart(2, '0')}>{String(h).padStart(2,'0')}:00</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* CRS Weights */}
      <Section icon={Sliders} title="CRS Weight Configuration">
        <div className="space-y-3">
          <div
            className={`text-xs font-mono mb-2 ${Math.abs(weightsSum - 1) < 0.01 ? 'text-risk-low' : 'text-risk-high'}`}
          >
            Sum: {weightsSum.toFixed(2)} {Math.abs(weightsSum - 1) < 0.01 ? '✓ Valid' : '✗ Must equal 1.0'}
          </div>
          {[
            { key: 'fuel', label: 'Fuel Weight', color: '#F97316' },
            { key: 'power', label: 'Power Weight', color: '#FACC15' },
            { key: 'food', label: 'Food Weight', color: '#22C55E' },
            { key: 'logistics', label: 'Logistics Weight', color: '#6366F1' },
          ].map(({ key, label, color }) => (
            <Slider
              key={key}
              label={label}
              value={weights[key]}
              onChange={v => setWeight(key, v)}
              min={0}
              max={1}
              step={0.05}
              color={color}
            />
          ))}
        </div>
      </Section>

      {/* About */}
      <Section icon={Info} title="About">
        <div className="space-y-1 text-sm text-text-secondary">
          <div className="flex gap-3"><span className="text-text-muted w-28">Version</span><span className="font-mono">1.0.0-hackathon</span></div>
          <div className="flex gap-3"><span className="text-text-muted w-28">Build</span><span className="font-mono">2025.04.05</span></div>
          <div className="flex gap-3"><span className="text-text-muted w-28">Model</span><span className="font-mono">CRS v2.1</span></div>
          <div className="flex gap-3"><span className="text-text-muted w-28">Coverage</span><span>{city} Metropolitan Area</span></div>
          <div className="flex gap-3"><span className="text-text-muted w-28">Data Sources</span><span>Backend events, oil tracker, risk engine</span></div>
          <p className="text-xs text-text-muted mt-3 pt-3 border-t border-border-default">
            CityShield uses AI-driven geopolitical signal analysis to compute real-time city risk scores and enable proactive supply chain management.
          </p>
        </div>
      </Section>
    </div>
  )
}
