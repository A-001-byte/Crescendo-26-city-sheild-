import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, AlertTriangle, CloudRain, Thermometer, Wind } from 'lucide-react'
import { fetchCrisisScore, fetchWeatherDisruption } from '../utils/api'
import CityRiskGauge from '../components/dashboard/CityRiskGauge'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useCrisis } from '../context/CrisisContext'

const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik']

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
}

const severityTone = (level) => {
  const key = String(level || '').toLowerCase()
  if (key === 'red') return { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' }
  if (key === 'orange') return { label: 'Elevated', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  if (key === 'yellow') return { label: 'Guarded', color: '#eab308', bg: 'rgba(234,179,8,0.12)' }
  return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
}

const disruptionTone = (index) => {
  if (index >= 0.7) return { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  if (index >= 0.4) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
}

function CityPanel({
  city,
  onCityChange,
  risk,
  weather,
  loading,
  error,
}) {
  const score = risk?.score ?? risk?.overall_crs
  const alertTone = severityTone(risk?.alert_level)
  const disruptionIndex = Number(weather?.disruption_index)
  const disruption = Number.isFinite(disruptionIndex) ? disruptionTone(disruptionIndex) : null
  const drivers = Array.isArray(weather?.drivers) ? weather.drivers.slice(0, 3) : []
  const affected = Array.isArray(weather?.affected_services) ? weather.affected_services : []

  return (
    <div className="rounded-3xl p-6 space-y-5" style={cardStyle}>
      <div className="flex items-center justify-between">
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="bg-transparent border border-outline-variant/40 rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-primary"
        >
          {CITIES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <span
          className="text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full"
          style={{ color: alertTone.color, background: alertTone.bg }}
        >
          {alertTone.label}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-xs text-secondary">
          <LoadingSpinner size="md" /> Loading city signals...
        </div>
      ) : error ? (
        <div className="text-sm text-error">{error}</div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest font-extrabold text-secondary">Risk Score</div>
              <div className="mt-3">
                <CityRiskGauge score={score} />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-secondary">Disruption Index</span>
                {disruption ? (
                  <span
                    className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full"
                    style={{ color: disruption.color, background: disruption.bg }}
                  >
                    {disruption.label}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-extrabold text-primary">
                  {Number.isFinite(disruptionIndex) ? `${Math.round(disruptionIndex * 100)}%` : 'NA'}
                </div>
                <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: Number.isFinite(disruptionIndex) ? `${Math.round(disruptionIndex * 100)}%` : '0%',
                      background: disruption?.color || '#94a3b8',
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-secondary">{weather?.current?.description || 'No disruption data'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 border border-outline-variant/30">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-secondary font-extrabold">
                <Thermometer className="w-3 h-3" /> Temperature
              </div>
              <div className="text-lg font-extrabold text-primary mt-2">
                {weather?.current?.temperature_c != null ? `${Number(weather.current.temperature_c).toFixed(1)}C` : 'NA'}
              </div>
            </div>
            <div className="rounded-2xl p-4 border border-outline-variant/30">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-secondary font-extrabold">
                <Wind className="w-3 h-3" /> Wind
              </div>
              <div className="text-lg font-extrabold text-primary mt-2">
                {weather?.current?.wind_speed_kph != null ? `${Number(weather.current.wind_speed_kph).toFixed(1)} km/h` : 'NA'}
              </div>
            </div>
            <div className="rounded-2xl p-4 border border-outline-variant/30">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-secondary font-extrabold">
                <CloudRain className="w-3 h-3" /> Rain
              </div>
              <div className="text-lg font-extrabold text-primary mt-2">
                {weather?.current?.precipitation_mm != null ? `${Number(weather.current.precipitation_mm).toFixed(1)} mm` : 'NA'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-4 border border-outline-variant/30">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-secondary font-extrabold">
                <AlertTriangle className="w-3 h-3" /> Drivers
              </div>
              <div className="mt-3 space-y-2">
                {drivers.length === 0 ? (
                  <div className="text-xs text-secondary">No dominant drivers</div>
                ) : drivers.map((driver) => (
                  <div key={driver.key} className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-widest text-primary">{driver.key}</span>
                    <span className="text-secondary truncate flex-1 mx-2">{driver.detail}</span>
                    <span className="font-bold text-primary">{Math.round(Number(driver.score) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-4 border border-outline-variant/30">
              <div className="text-[10px] uppercase tracking-widest text-secondary font-extrabold">Affected Services</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {affected.length === 0 ? (
                  <span className="text-xs text-secondary">None detected</span>
                ) : affected.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ background: 'rgba(15,23,42,0.06)', color: '#0f172a' }}
                  >
                    {service}
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-secondary mt-3">
                Updated {risk?.timestamp ? new Date(risk.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'NA'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function CityCompare() {
  const { selectedCity } = useCrisis()
  const [leftCity, setLeftCity] = useState(selectedCity)
  const [rightCity, setRightCity] = useState('Mumbai')

  const [leftRisk, setLeftRisk] = useState(null)
  const [rightRisk, setRightRisk] = useState(null)
  const [leftWeather, setLeftWeather] = useState(null)
  const [rightWeather, setRightWeather] = useState(null)
  const [leftLoading, setLeftLoading] = useState(true)
  const [rightLoading, setRightLoading] = useState(true)
  const [leftError, setLeftError] = useState('')
  const [rightError, setRightError] = useState('')

  useEffect(() => {
    setLeftCity(selectedCity)
  }, [selectedCity])

  useEffect(() => {
    let mounted = true
    setLeftLoading(true)
    setLeftError('')

    Promise.all([
      fetchCrisisScore({ city: leftCity }),
      fetchWeatherDisruption(leftCity),
    ])
      .then(([risk, weather]) => {
        if (!mounted) return
        setLeftRisk(risk)
        setLeftWeather(weather)
      })
      .catch((err) => {
        if (!mounted) return
        setLeftError(err?.message || 'Unable to load city data')
      })
      .finally(() => {
        if (!mounted) return
        setLeftLoading(false)
      })

    return () => { mounted = false }
  }, [leftCity])

  useEffect(() => {
    let mounted = true
    setRightLoading(true)
    setRightError('')

    Promise.all([
      fetchCrisisScore({ city: rightCity }),
      fetchWeatherDisruption(rightCity),
    ])
      .then(([risk, weather]) => {
        if (!mounted) return
        setRightRisk(risk)
        setRightWeather(weather)
      })
      .catch((err) => {
        if (!mounted) return
        setRightError(err?.message || 'Unable to load city data')
      })
      .finally(() => {
        if (!mounted) return
        setRightLoading(false)
      })

    return () => { mounted = false }
  }, [rightCity])

  const header = useMemo(() => {
    return `${leftCity} vs ${rightCity}`
  }, [leftCity, rightCity])

  return (
    <div className="page-shell">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full border border-outline-variant/40 flex items-center justify-center">
          <ArrowLeftRight className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest font-extrabold text-secondary">City Compare</div>
          <div className="text-2xl font-extrabold text-primary">{header}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CityPanel
          city={leftCity}
          onCityChange={setLeftCity}
          risk={leftRisk}
          weather={leftWeather}
          loading={leftLoading}
          error={leftError}
        />
        <CityPanel
          city={rightCity}
          onCityChange={setRightCity}
          risk={rightRisk}
          weather={rightWeather}
          loading={rightLoading}
          error={rightError}
        />
      </div>
    </div>
  )
}
