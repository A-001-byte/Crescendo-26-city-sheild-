import { useEffect, useMemo, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, BarChart,
} from 'recharts'
import { fetchCrisisScore, fetchLatestEvents, fetchOilData } from '../../utils/api'
import { useCrisis } from '../../context/CrisisContext'

const cardStyle = {
  background: '#ffffff',
  border: '1px solid rgba(0,0,0,0.07)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
}

const tooltipStyle = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 12,
    fontSize: 11,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    color: '#1a1c1c',
  },
  labelStyle: { color: '#5e5e5f', fontFamily: '"JetBrains Mono"', fontWeight: 700 },
  itemStyle: { fontFamily: '"JetBrains Mono"' },
}

const axisProps = {
  tick: { fill: '#94a3b8', fontSize: 9 },
  axisLine: false,
  tickLine: false,
}

const FALLBACK_RISK = {
  score: 6.3,
  scores: { fuel: 7.1, power: 5.4, food: 6.0, transport: 6.7 },
}

const FALLBACK_OIL = {
  trend_7d: [86.2, 87.4, 88.1, 87.9, 89.3, 90.5, 89.8],
}

const FALLBACK_EVENTS = [
  { id: 'evt-1', severity: 'high', published_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'evt-2', severity: 'moderate', published_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: 'evt-3', severity: 'low', published_at: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString() },
  { id: 'evt-4', severity: 'critical', published_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() },
  { id: 'evt-5', severity: 'high', published_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
  { id: 'evt-6', severity: 'moderate', published_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString() },
]

function bucketByDay(events) {
  const buckets = {}
  events.forEach((e) => {
    const dt = new Date(e.published_at || Date.now())
    const key = `${dt.getMonth() + 1}/${dt.getDate()}`
    if (!buckets[key]) buckets[key] = { day: key, critical: 0, high: 0, moderate: 0, low: 0 }
    const sev = String(e.severity || '').toLowerCase()
    if (sev === 'critical') buckets[key].critical += 1
    else if (sev === 'high') buckets[key].high += 1
    else if (sev === 'moderate') buckets[key].moderate += 1
    else buckets[key].low += 1
  })
  return Object.values(buckets).slice(-14)
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl p-6" style={cardStyle}>
      <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary mb-0.5">{title}</h3>
      <p className="text-[11px] text-secondary mb-4">{subtitle}</p>
      {children}
    </div>
  )
}

export default function TrendCharts() {
  const [risk, setRisk] = useState(null)
  const [events, setEvents] = useState([])
  const [oil, setOil] = useState(null)
  const { selectedCity } = useCrisis()

  useEffect(() => {
    let mounted = true
    Promise.all([fetchCrisisScore({ city: selectedCity }), fetchLatestEvents(100), fetchOilData()])
      .then(([r, e, o]) => {
        if (!mounted) return
        const nextRisk = r || FALLBACK_RISK
        const nextEvents = Array.isArray(e) && e.length ? e : FALLBACK_EVENTS
        const nextOil = o || FALLBACK_OIL
        setRisk(nextRisk)
        setEvents(nextEvents)
        setOil(nextOil)
      })
      .catch(() => {
        if (!mounted) return
        setRisk(FALLBACK_RISK)
        setEvents(FALLBACK_EVENTS)
        setOil(FALLBACK_OIL)
      })
    return () => { mounted = false }
  }, [selectedCity])

  const oilTrend = Array.isArray(oil?.trend_7d) ? oil.trend_7d : []
  const currentCrs = Number(risk?.score || risk?.overall_crs || 0)

  const oilCrsData = useMemo(() => {
    if (!oilTrend.length) return []
    return oilTrend.map((price, i) => ({
      day: `D${i + 1}`,
      oil: Number(price),
      crs: Number.isFinite(currentCrs) ? currentCrs : 0,
    }))
  }, [oilTrend, currentCrs])

  const serviceData = useMemo(() => {
    const s = risk?.scores || {}
    return [{ day: 'Now', fuel: Number(s.fuel || 0), power: Number(s.power || 0), food: Number(s.food || 0), logistics: Number(s.transport || 0) }]
  }, [risk])

  const alertData = useMemo(() => bucketByDay(events), [events])

  return (
    <div className="space-y-4">
      <ChartCard title="Oil Price vs CRS" subtitle="Latest 7-day oil trend vs current CRS">
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={oilCrsData} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis yAxisId="oil" orientation="left" {...axisProps} />
            <YAxis yAxisId="crs" orientation="right" {...axisProps} domain={[0, 10]} />
            <RechartTooltip {...tooltipStyle} />
            <Bar yAxisId="oil" dataKey="oil" fill="#f97316" fillOpacity={0.25} radius={[3, 3, 0, 0]} name="Brent $/bbl" />
            <Line yAxisId="crs" type="monotone" dataKey="crs" stroke="#3b82f6" strokeWidth={2} dot={false} name="CRS" />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Service Score Distribution" subtitle="Current service risk snapshot">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={serviceData} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis {...axisProps} domain={[0, 10]} />
            <RechartTooltip {...tooltipStyle} />
            <Bar dataKey="fuel"      stackId="a" fill="#ef4444" fillOpacity={0.8} name="Fuel" />
            <Bar dataKey="power"     stackId="a" fill="#f59e0b" fillOpacity={0.8} name="Power" />
            <Bar dataKey="food"      stackId="a" fill="#22c55e" fillOpacity={0.8} name="Food" />
            <Bar dataKey="logistics" stackId="a" fill="#6366f1" fillOpacity={0.8} name="Logistics" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Alert Volume by Severity" subtitle="Derived from live news events">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={alertData} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis dataKey="day" {...axisProps} />
            <YAxis {...axisProps} />
            <RechartTooltip {...tooltipStyle} />
            <Bar dataKey="low"      stackId="a" fill="#22c55e" fillOpacity={0.8} name="Low" />
            <Bar dataKey="moderate" stackId="a" fill="#f59e0b" fillOpacity={0.8} name="Moderate" />
            <Bar dataKey="high"     stackId="a" fill="#ef4444" fillOpacity={0.8} name="High" />
            <Bar dataKey="critical" stackId="a" fill="#dc2626" fillOpacity={0.9} name="Critical" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
