const NODES = [
  {
    id: 'geo',
    title: 'Geopolitical Event',
    subtitle: '3 active crises',
    metric: 'Strait of Hormuz',
    color: '#EF4444',
    icon: '🌍',
  },
  {
    id: 'oil',
    title: 'Oil Market',
    subtitle: 'Brent: $87.40',
    metric: '+3.2% today',
    color: '#F97316',
    icon: '📈',
  },
  {
    id: 'import',
    title: 'India Import',
    subtitle: '85% dependency',
    metric: '4.2 mb/d crude',
    color: '#F59E0B',
    icon: '🚢',
  },
  {
    id: 'omc',
    title: 'OMC Response',
    subtitle: 'Advance payment mode',
    metric: 'IOC / BPCL / HPCL',
    color: '#3B82F6',
    icon: '🏛️',
  },
  {
    id: 'ward',
    title: 'Ward Impact',
    subtitle: 'Avg buffer: 42h',
    metric: '15 wards monitored',
    color: '#8B5CF6',
    icon: '📍',
  },
]

const LINE_STYLE = `
  @keyframes flowLine {
    0% { stroke-dashoffset: 24; }
    100% { stroke-dashoffset: 0; }
  }
`

export default function SupplyChainFlow() {
  const nodeW = 130
  const nodeH = 90
  const gapX = 60
  const totalW = NODES.length * nodeW + (NODES.length - 1) * gapX
  const svgH = nodeH + 40

  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-lg">
      <h3 className="font-heading font-semibold text-text-primary text-sm mb-4">Supply Chain Flow</h3>
      <p className="text-xs text-text-muted mb-4">How global events cascade to Pune ward level</p>
      <div className="overflow-x-auto">
        <style>{LINE_STYLE}</style>
        <svg width={totalW} height={svgH + 20} viewBox={`0 0 ${totalW} ${svgH + 20}`}>
          {/* Connecting lines */}
          {NODES.slice(0, -1).map((node, i) => {
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
                  stroke={NODES[i + 1].color}
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  opacity={0.6}
                  style={{ animation: 'flowLine 1s linear infinite' }}
                />
                <polygon
                  points={`${x2 - 8},${y - 5} ${x2},${y} ${x2 - 8},${y + 5}`}
                  fill={NODES[i + 1].color}
                  opacity={0.8}
                />
              </g>
            )
          })}

          {/* Nodes */}
          {NODES.map((node, i) => {
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
