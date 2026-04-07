import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, Legend, BarChart
} from 'recharts'

// 30-day oil vs CRS data
const OIL_CRS_DATA = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1
  const oil = 78 + Math.sin(i * 0.4) * 8 + (i > 20 ? (i - 20) * 0.4 : 0)
  const crs = 4.5 + Math.sin(i * 0.4 + 0.5) * 1.5 + (i > 20 ? (i - 20) * 0.08 : 0)
  return {
    day: `D${day}`,
    oil: parseFloat(oil.toFixed(2)),
    crs: parseFloat(Math.min(10, crs).toFixed(2)),
  }
})

// 14-day service distribution
const SERVICE_DATA = Array.from({ length: 14 }, (_, i) => {
  const day = i + 1
  return {
    day: `D${day}`,
    fuel: parseFloat((5 + Math.sin(i * 0.5) * 2 + (i > 9 ? 1.5 : 0)).toFixed(1)),
    power: parseFloat((3.5 + Math.cos(i * 0.4) * 1).toFixed(1)),
    food: parseFloat((4.8 + Math.sin(i * 0.3 + 1) * 0.8).toFixed(1)),
    logistics: parseFloat((5.5 + Math.cos(i * 0.6) * 1.2).toFixed(1)),
  }
})

// 14-day alert volume
const ALERT_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  critical: Math.floor(Math.random() * 3),
  high: Math.floor(Math.random() * 6 + 1),
  moderate: Math.floor(Math.random() * 8 + 2),
  low: Math.floor(Math.random() * 5 + 1),
}))

const tooltipStyle = {
  contentStyle: { background: '#1A1F2E', border: '1px solid #2A3142', borderRadius: 8, fontSize: 11 },
  labelStyle: { color: '#94A3B8', fontFamily: '"JetBrains Mono"' },
  itemStyle: { fontFamily: '"JetBrains Mono"' },
}

export default function TrendCharts() {
  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Oil Price vs CRS */}
      <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-lg">
        <h3 className="font-heading font-semibold text-text-primary text-sm mb-1">Oil Price vs CRS</h3>
        <p className="text-xs text-text-muted mb-3">30-day correlation</p>
        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={OIL_CRS_DATA} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3142" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis yAxisId="oil" orientation="left" tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} domain={[60, 100]} />
            <YAxis yAxisId="crs" orientation="right" tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 10]} />
            <RechartTooltip {...tooltipStyle} />
            <Bar yAxisId="oil" dataKey="oil" fill="#F97316" fillOpacity={0.3} radius={[2, 2, 0, 0]} name="Brent $/bbl" />
            <Line yAxisId="crs" type="monotone" dataKey="crs" stroke="#3B82F6" strokeWidth={2} dot={false} name="CRS" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Service Score Distribution */}
      <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-lg">
        <h3 className="font-heading font-semibold text-text-primary text-sm mb-1">Service Score Distribution</h3>
        <p className="text-xs text-text-muted mb-3">14-day stacked</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={SERVICE_DATA} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3142" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} domain={[0, 10]} />
            <RechartTooltip {...tooltipStyle} />
            <Bar dataKey="fuel" stackId="a" fill="#F97316" fillOpacity={0.8} name="Fuel" radius={[0,0,0,0]} />
            <Bar dataKey="power" stackId="a" fill="#FACC15" fillOpacity={0.8} name="Power" />
            <Bar dataKey="food" stackId="a" fill="#22C55E" fillOpacity={0.8} name="Food" />
            <Bar dataKey="logistics" stackId="a" fill="#6366F1" fillOpacity={0.8} name="Logistics" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alert Volume */}
      <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-lg">
        <h3 className="font-heading font-semibold text-text-primary text-sm mb-1">Alert Volume by Severity</h3>
        <p className="text-xs text-text-muted mb-3">14-day stacked</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={ALERT_DATA} margin={{ top: 4, right: 8, bottom: 4, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A3142" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: '#64748B', fontSize: 9 }} axisLine={false} tickLine={false} />
            <RechartTooltip {...tooltipStyle} />
            <Bar dataKey="low" stackId="a" fill="#10B981" fillOpacity={0.8} name="Low" />
            <Bar dataKey="moderate" stackId="a" fill="#F59E0B" fillOpacity={0.8} name="Moderate" />
            <Bar dataKey="high" stackId="a" fill="#EF4444" fillOpacity={0.8} name="High" />
            <Bar dataKey="critical" stackId="a" fill="#DC2626" fillOpacity={0.9} name="Critical" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
