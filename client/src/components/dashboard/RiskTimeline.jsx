import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, ReferenceArea
} from 'recharts'
import { fetchScoreHistory } from '../../utils/api'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const toUpperTick = (label) => String(label ?? '').toUpperCase()

const SERVICES = [
  { key: 'fuel', color: '#ba1a1a', label: 'Fuel' },
  { key: 'power', color: '#000000', label: 'Power' },
  { key: 'food', color: '#22c55e', label: 'Food' },
  { key: 'logistics', color: '#c6c6c6', label: 'Logistics' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="p-6 rounded-[2rem] bg-surface-container-lowest border border-outline-variant/30 shadow-2xl">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-secondary mb-4">{label} METRICS</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-8 mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[10px]" style={{ color: p.color }}>circle</span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{p.name}</span>
          </div>
          <span className="font-extrabold text-lg letter-spacing-tight" style={{ color: p.color }}>{p.value != null ? p.value.toFixed(1) : '—'}</span>
        </div>
      ))}
    </div>
  )
}

function toScore(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeHistory(raw) {
  if (!Array.isArray(raw) || !raw.length) return []

  const parsed = raw.map((entry, idx) => {
    const services = entry?.services || entry?.scores || {}
    const day =
      entry?.day ||
      entry?.label ||
      (entry?.timestamp || entry?.date
        ? new Date(entry.timestamp || entry.date).toLocaleDateString('en-US', { weekday: 'short' })
        : DAYS[idx % DAYS.length])

    return {
      day,
      fuel: toScore(entry?.fuel ?? services?.fuel?.score ?? services?.fuel, 0),
      power: toScore(entry?.power ?? services?.power?.score ?? services?.power, 0),
      food: toScore(entry?.food ?? services?.food?.score ?? services?.food, 0),
      logistics: toScore(
        entry?.logistics ??
        entry?.transport ??
        services?.logistics?.score ??
        services?.logistics ??
        services?.transport?.score ??
        services?.transport,
        0
      ),
    }
  })

  return parsed.slice(-7)
}

export default function RiskTimeline() {
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    let mounted = true

    fetchScoreHistory(7)
      .then((res) => {
        if (!mounted) return
        setChartData(normalizeHistory(res))
      })
      .catch(() => {
        if (!mounted) return
        setChartData([])
      })

    return () => { mounted = false }
  }, [])

  return (
    <div className="h-full flex flex-col relative overflow-hidden isolate max-h-[220px]">
      <div className="flex-1 min-h-0 relative -mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 0, bottom: 0, left: -20 }}>
            <ReferenceArea y1={7} y2={10} fill="#ba1a1a" fillOpacity={0.03} />

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#777777', fontSize: 10, fontFamily: '"Plus Jakarta Sans"', fontWeight: 800 }}
              tickFormatter={toUpperTick}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              domain={[1, 10]}
              tick={{ fill: '#777777', fontSize: 10, fontFamily: '"Plus Jakarta Sans"', fontWeight: 800 }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
              dx={-10}
            />
            <RechartTooltip content={<CustomTooltip />} cursor={{ stroke: '#c6c6c6', strokeWidth: 1, strokeDasharray: '4 4' }} />
            {SERVICES.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={3}
                fill={s.color}
                fillOpacity={0.05}
                dot={false}
                activeDot={{ r: 6, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
