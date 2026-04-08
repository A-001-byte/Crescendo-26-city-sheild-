import { useEffect, useMemo, useState } from 'react'
import { CloudRain, Wind, Thermometer, AlertTriangle } from 'lucide-react'
import { useCrisis } from '../context/CrisisContext'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { fetchWeatherDisruption } from '../utils/api'

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
}

const severityTone = (index) => {
  if (index >= 0.7) return { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  if (index >= 0.4) return { label: 'Moderate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  return { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' }
}

export default function Disruptions() {
  const { selectedCity } = useCrisis()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')

    fetchWeatherDisruption(selectedCity)
      .then((payload) => {
        if (!mounted) return
        setData(payload)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err?.message || 'Unable to load disruption data')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => { mounted = false }
  }, [selectedCity])

  const disruptionIndex = Number(data?.disruption_index)
  const severity = Number.isFinite(disruptionIndex) ? severityTone(disruptionIndex) : null

  const drivers = useMemo(() => {
    if (!Array.isArray(data?.drivers)) return []
    return data.drivers.slice(0, 4)
  }, [data])

  const affectedServices = Array.isArray(data?.affected_services) ? data.affected_services : []

  return (
    <div className="page-shell">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-8 space-y-6">
          <div className="rounded-3xl p-6" style={cardStyle}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-secondary font-extrabold">Weather Disruption Index</div>
                <div className="text-2xl font-extrabold text-primary mt-2">
                  {selectedCity}
                </div>
              </div>
              {severity ? (
                <span
                  className="text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full"
                  style={{ color: severity.color, background: severity.bg }}
                >
                  {severity.label}
                </span>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {loading ? (
                <div className="flex items-center gap-3">
                  <LoadingSpinner size="md" />
                  <span className="text-xs text-secondary">Loading weather feeds...</span>
                </div>
              ) : error ? (
                <div className="text-sm text-error">{error}</div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-extrabold text-primary">
                      {Number.isFinite(disruptionIndex) ? `${Math.round(disruptionIndex * 100)}%` : 'NA'}
                    </div>
                    <div className="flex-1 h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: Number.isFinite(disruptionIndex) ? `${Math.round(disruptionIndex * 100)}%` : '0%',
                          background: severity?.color || '#94a3b8',
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-secondary">
                    {data?.current?.description || 'No condition data'} · Updated {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'NA'}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-3xl p-5" style={cardStyle}>
              <div className="flex items-center gap-2 text-secondary text-xs font-extrabold uppercase tracking-widest">
                <Thermometer className="w-4 h-4" /> Temperature
              </div>
              <div className="text-2xl font-extrabold text-primary mt-3">
                {data?.current?.temperature_c != null ? `${Number(data.current.temperature_c).toFixed(1)}C` : 'NA'}
              </div>
            </div>
            <div className="rounded-3xl p-5" style={cardStyle}>
              <div className="flex items-center gap-2 text-secondary text-xs font-extrabold uppercase tracking-widest">
                <Wind className="w-4 h-4" /> Wind Speed
              </div>
              <div className="text-2xl font-extrabold text-primary mt-3">
                {data?.current?.wind_speed_kph != null ? `${Number(data.current.wind_speed_kph).toFixed(1)} km/h` : 'NA'}
              </div>
            </div>
            <div className="rounded-3xl p-5" style={cardStyle}>
              <div className="flex items-center gap-2 text-secondary text-xs font-extrabold uppercase tracking-widest">
                <CloudRain className="w-4 h-4" /> Precipitation
              </div>
              <div className="text-2xl font-extrabold text-primary mt-3">
                {data?.current?.precipitation_mm != null ? `${Number(data.current.precipitation_mm).toFixed(1)} mm` : 'NA'}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 space-y-6">
          <div className="rounded-3xl p-6" style={cardStyle}>
            <div className="flex items-center gap-2 text-secondary text-xs font-extrabold uppercase tracking-widest">
              <AlertTriangle className="w-4 h-4" /> Leading Drivers
            </div>
            <div className="mt-4 space-y-3">
              {drivers.length === 0 ? (
                <div className="text-xs text-secondary">No dominant drivers detected.</div>
              ) : (
                drivers.map((d) => (
                  <div key={d.key} className="flex items-center justify-between gap-4">
                    <div className="text-xs font-semibold text-primary uppercase tracking-widest">{d.key}</div>
                    <div className="text-xs text-secondary flex-1 truncate">{d.detail}</div>
                    <div className="text-xs font-bold text-primary">{Math.round(Number(d.score) * 100)}%</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl p-6" style={cardStyle}>
            <div className="text-secondary text-xs font-extrabold uppercase tracking-widest">Affected Services</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {affectedServices.length === 0 ? (
                <span className="text-xs text-secondary">None detected</span>
              ) : (
                affectedServices.map((service) => (
                  <span
                    key={service}
                    className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest"
                    style={{ background: 'rgba(15,23,42,0.06)', color: '#0f172a' }}
                  >
                    {service}
                  </span>
                ))
              )}
            </div>
            <div className="text-[10px] text-secondary mt-4">Source: {data?.source || 'NA'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
