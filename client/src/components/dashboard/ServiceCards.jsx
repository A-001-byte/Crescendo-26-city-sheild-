const SERVICES = [
  {
    key: 'fuel',
    label: 'Fuel Supply',
    icon: 'local_gas_station',
    defaultScore: 7.1,
  },
  {
    key: 'power',
    label: 'Power Grid',
    icon: 'bolt',
    defaultScore: 4.3,
  },
  {
    key: 'food',
    label: 'Food Chain',
    icon: 'restaurant',
    defaultScore: 5.8,
  },
  {
    key: 'logistics',
    label: 'Logistics',
    icon: 'local_shipping',
    defaultScore: 6.2,
  },
]

function ServiceCard({ service, data }) {
  const score = data?.score ?? service.defaultScore
  const thresholdPct = Math.max(0, Math.min(100, (score / 10) * 100))
  const riskBand = score >= 7 ? 'high' : score > 5 ? 'medium' : 'low'
  const colorToken = riskBand === 'high' ? 'bg-error' : riskBand === 'medium' ? 'bg-tertiary-container' : 'bg-primary'
  const textColor = riskBand === 'high' ? 'text-error' : riskBand === 'medium' ? 'text-tertiary-container' : 'text-primary'
  const riskLabel = riskBand === 'high' ? 'HIGH' : riskBand === 'medium' ? 'MEDIUM' : 'LOW'

  return (
    <div className="space-y-4 pt-4 border-b border-outline-variant/30 pb-6 w-full">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-sm">{service.icon}</span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary">{service.label}</span>
        </div>
        <span className={`text-2xl font-extrabold letter-spacing-tight ${textColor}`}>RISK {riskLabel}</span>
      </div>
      <div className="h-[2px] w-full bg-outline-variant/30 rounded-full overflow-hidden">
        <div className={`h-full ${colorToken} rounded-full`} style={{ width: `${thresholdPct}%` }}></div>
      </div>
    </div>
  )
}

export default function ServiceCards({ data }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
      {SERVICES.map(s => (
        <ServiceCard key={s.key} service={s} data={data?.[s.key]} />
      ))}
    </div>
  )
}
