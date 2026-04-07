import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend
} from 'recharts'
import { fetchScoreHistory } from '../../utils/api'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const DATA = [
  { day: 'Mon', fuel: 5.8, power: 3.9, food: 4.8, logistics: 5.5 },
  { day: 'Tue', fuel: 6.1, power: 4.1, food: 5.0, logistics: 5.7 },
  { day: 'Wed', fuel: 6.5, power: 4.4, food: 5.2, logistics: 5.9 },
  { day: 'Thu', fuel: 6.9, power: 4.2, food: 5.5, logistics: 6.1 },
  { day: 'Fri', fuel: 7.1, power: 4.3, food: 5.8, logistics: 6.2 },
  { day: 'Sat', fuel: 7.3, power: 4.6, food: 5.6, logistics: 6.4 },
  { day: 'Sun', fuel: 7.1, power: 4.3, food: 5.8, logistics: 6.2 },
]

const SERVICES = [
  { key: 'fuel', color: '#F97316', label: 'Fuel' },
  { key: 'power', color: '#FACC15', label: 'Power' },
  { key: 'food', color: '#22C55E', label: 'Food' },
  { key: 'logistics', color: '#6366F1', label: 'Logistics' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl p-3 shadow-xl text-xs" style={{ background: '#FFFFFF', border: '1px solid #DBEAFE' }}>
      <p className="font-mono mb-2" style={{ color: '#475569' }}>{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span style={{ color: '#475569' }}>{p.name}</span>
          </div>
          <span className="font-mono font-bold" style={{ color: p.color }}>{p.value.toFixed(1)}</span>
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
  if (!Array.isArray(raw) || !raw.length) return DATA

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
      fuel: toScore(entry?.fuel ?? services?.fuel?.score ?? services?.fuel, DATA[idx % DATA.length].fuel),
      power: toScore(entry?.power ?? services?.power?.score ?? services?.power, DATA[idx % DATA.length].power),
      food: toScore(entry?.food ?? services?.food?.score ?? services?.food, DATA[idx % DATA.length].food),
      logistics: toScore(
        entry?.logistics ??
        entry?.transport ??
        services?.logistics?.score ??
        services?.logistics ??
        services?.transport?.score ??
        services?.transport,
        DATA[idx % DATA.length].logistics
      ),
    }
  })

  return parsed.slice(-7)
}

export default function RiskTimeline() {
  const [chartData, setChartData] = useState(DATA)

  useEffect(() => {
    let mounted = true

    fetchScoreHistory(7)
      .then((res) => {
        if (!mounted) return
        setChartData(normalizeHistory(res))
      })
      .catch(() => {
        if (!mounted) return
        setChartData(DATA)
      })

    return () => { mounted = false }
  }, [])

  return (
    <div className="rounded-2xl p-4 shadow-lg h-full flex flex-col" style={{ background: '#FFFFFF', border: '1px solid #DBEAFE' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-text-primary text-sm">7-Day Risk Trend</h3>
        <div className="flex items-center gap-3">
          {SERVICES.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <defs>
              {SERVICES.map(s => (
                <linearGradient key={s.key} id={`tg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            {/* Risk zones */}
            <ReferenceArea y1={1} y2={3} fill="#10B981" fillOpacity={0.04} />
            <ReferenceArea y1={3} y2={6} fill="#F59E0B" fillOpacity={0.04} />
            <ReferenceArea y1={6} y2={10} fill="#EF4444" fillOpacity={0.04} />

            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#64748B', fontSize: 11, fontFamily: '"Plus Jakarta Sans"' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[1, 10]}
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: '"JetBrains Mono"' }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <RechartTooltip content={<CustomTooltip />} />
            {SERVICES.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#tg-${s.key})`}
                dot={false}
                activeDot={{ r: 4, fill: s.color }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
