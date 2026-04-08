import { useEffect, useMemo, useState } from 'react'
import { fetchCrisisScore, fetchLatestEvents, fetchOilData, fetchSignals, fetchWards } from '../../utils/api'
import { useCrisis } from '../../context/CrisisContext'

const LINE_STYLE = `
  @keyframes flowLine {
    0% { stroke-dashoffset: 24; }
    100% { stroke-dashoffset: 0; }
  }
`

export default function SupplyChainFlow() {
  const [oil, setOil] = useState(null)
  const [signals, setSignals] = useState(null)
  const [risk, setRisk] = useState(null)
  const [events, setEvents] = useState([])
  const [wards, setWards] = useState([])
  const { selectedCity } = useCrisis()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [oilData, signalData, riskData, eventData, wardData] = await Promise.all([
          fetchOilData(),
          fetchSignals(),
          fetchCrisisScore({ city: selectedCity }),
          fetchLatestEvents(40),
          fetchWards(),
        ])
        if (!mounted) return
        setOil(oilData)
        setSignals(signalData)
        setRisk(riskData)
        setEvents(Array.isArray(eventData) ? eventData : [])
        setWards(Array.isArray(wardData) ? wardData : [])
      } catch {
        if (!mounted) return
        setOil(null)
        setSignals(null)
        setRisk(null)
        setEvents([])
        setWards([])
      }
    }

    load()
    return () => { mounted = false }
  }, [selectedCity])

  const nodes = useMemo(() => {
    const latestOil = Number(oil?.current_price ?? 0)
    const prevOil = Number(oil?.previous_close ?? latestOil)
    const oilDelta = prevOil > 0 ? ((latestOil - prevOil) / prevOil) * 100 : 0
    const sevCounts = events.reduce((acc, e) => {
      const k = String(e?.severity || 'low').toLowerCase()
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    const activeCrises = Number(sevCounts.critical || 0) + Number(sevCounts.high || 0)
    const fuelSignal = Number(signals?.fuel || 0)
    const powerSignal = Number(signals?.power || 0)
    const avgWardRisk = Number(risk?.score || risk?.overall_crs || 0)

    return [
      {
        id: 'geo',
        title: 'Geopolitical Event',
        subtitle: `${activeCrises} high-severity signals`,
        metric: `${events.length} live articles`,
        color: '#EF4444',
        icon: '🌍',
      },
      {
        id: 'oil',
        title: 'Oil Market',
        subtitle: `Brent: $${latestOil.toFixed(2)}`,
        metric: `${oilDelta >= 0 ? '+' : ''}${oilDelta.toFixed(1)}% vs prev close`,
        color: '#F97316',
        icon: '📈',
      },
      {
        id: 'import',
        title: 'Supply Signal',
        subtitle: `Fuel ${fuelSignal.toFixed(1)} / 10`,
        metric: `Power ${powerSignal.toFixed(1)} / 10`,
        color: '#F59E0B',
        icon: '🚢',
      },
      {
        id: 'omc',
        title: 'System Response',
        subtitle: `${Number(risk?.prediction_confidence || 0).toFixed(0)}% confidence`,
        metric: `CRS ${avgWardRisk.toFixed(1)} / 10`,
        color: '#3B82F6',
        icon: '🏛️',
      },
      {
        id: 'ward',
        title: 'Ward Impact',
        subtitle: `${wards.length} wards monitored`,
        metric: `${risk?.trigger_level || 'Normal'} trigger`,
        color: '#8B5CF6',
        icon: '📍',
      },
    ]
  }, [events, oil, risk, signals, wards])

  const nodeW = 130
  const nodeH = 90
  const gapX = 60
  const totalW = nodes.length * nodeW + (nodes.length - 1) * gapX
  const svgH = nodeH + 40

  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-lg">
      <h3 className="font-heading font-semibold text-text-primary text-sm mb-4">Supply Chain Flow</h3>
      <p className="text-xs text-text-muted mb-4">How global events cascade to Pune ward level</p>
      <div className="overflow-x-auto">
        <style>{LINE_STYLE}</style>
        <svg width={totalW} height={svgH + 20} viewBox={`0 0 ${totalW} ${svgH + 20}`}>
          {/* Connecting lines */}
          {nodes.slice(0, -1).map((node, i) => {
            const x1 = i * (nodeW + gapX) + nodeW
            const x2 = (i + 1) * (nodeW + gapX)
            const y = nodeH / 2 + 10
            return (
              <g key={`line-${i}`}>
                <line
                  x1={x1} y1={y} x2={x2} y2={y}
                  stroke="#2A3142"
                  strokeWidth={2}
                />
                <line
                  x1={x1} y1={y} x2={x2} y2={y}
                  stroke={nodes[i + 1].color}
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  opacity={0.6}
                  style={{ animation: 'flowLine 1s linear infinite' }}
                />
                <polygon
                  points={`${x2 - 8},${y - 5} ${x2},${y} ${x2 - 8},${y + 5}`}
                  fill={nodes[i + 1].color}
                  opacity={0.8}
                />
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const x = i * (nodeW + gapX)
            return (
              <g key={node.id} transform={`translate(${x}, 10)`}>
                <rect
                  x={0} y={0} width={nodeW} height={nodeH}
                  rx={10} ry={10}
                  fill="#1A1F2E"
                  stroke={node.color}
                  strokeWidth={1.5}
                  opacity={0.9}
                />
                <rect
                  x={0} y={0} width={nodeW} height={4}
                  rx={2} ry={2}
                  fill={node.color}
                  opacity={0.8}
                />
                <text x={nodeW / 2} y={24} textAnchor="middle" style={{ fontSize: 18 }}>
                  {node.icon}
                </text>
                <text x={nodeW / 2} y={50} textAnchor="middle" style={{ fill: '#F1F5F9', fontSize: 10, fontWeight: 700, fontFamily: '"Outfit",sans-serif' }}>
                  {node.title}
                </text>
                <text x={nodeW / 2} y={64} textAnchor="middle" style={{ fill: node.color, fontSize: 9, fontFamily: '"JetBrains Mono",monospace' }}>
                  {node.metric}
                </text>
                <text x={nodeW / 2} y={78} textAnchor="middle" style={{ fill: '#64748B', fontSize: 8.5, fontFamily: '"Plus Jakarta Sans",sans-serif' }}>
                  {node.subtitle}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
