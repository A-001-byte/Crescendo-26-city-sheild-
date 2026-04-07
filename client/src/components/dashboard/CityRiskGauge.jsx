import { useEffect, useRef, useState } from 'react'
import { getRiskColor, getRiskLabel, scoreToAngle } from '../../utils/riskCalculations'

const RADIUS = 90
const CENTER_X = 150
const CENTER_Y = 160
const STROKE_WIDTH = 22
const START_ANGLE_DEG = 210
const SWEEP_DEG = 240

function degToRad(deg) {
  return (deg * Math.PI) / 180
}

function arcPath(cx, cy, r, startDeg, sweepDeg) {
  const startRad = degToRad(startDeg)
  const endRad = degToRad(startDeg + sweepDeg)
  const x1 = cx + r * Math.cos(startRad)
  const y1 = cy + r * Math.sin(startRad)
  const x2 = cx + r * Math.cos(endRad)
  const y2 = cy + r * Math.sin(endRad)
  const largeArc = sweepDeg > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
}

function getArcLength(r, sweepDeg) {
  return (sweepDeg / 360) * 2 * Math.PI * r
}

export default function CityRiskGauge({ score = 6.4 }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const frameRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const target = Math.max(1, Math.min(10, score))
    const duration = 1500

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(eased * target)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    startRef.current = null
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [score])

  const color = getRiskColor(animatedScore)
  const label = getRiskLabel(score)

  const totalArcLen = getArcLength(RADIUS, SWEEP_DEG)
  const fillRatio = scoreToAngle(animatedScore) / SWEEP_DEG
  const fillLen = totalArcLen * fillRatio
  const gapLen = totalArcLen - fillLen

  const bgPath = arcPath(CENTER_X, CENTER_Y, RADIUS, START_ANGLE_DEG, SWEEP_DEG)
  const fgPath = arcPath(CENTER_X, CENTER_Y, RADIUS, START_ANGLE_DEG, SWEEP_DEG)

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="relative">
        <svg viewBox="0 0 300 210" width="100%" style={{ maxWidth: 280, display: 'block' }}>
          {/* Track */}
          <path
            d={bgPath}
            fill="none"
            stroke="#D1D5DB"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="butt"
          />

          {/* Fill arc */}
          <path
            d={fgPath}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="butt"
            strokeDasharray={`${fillLen} ${gapLen + 1}`}
            style={{ transition: 'stroke 0.5s' }}
          />

          {/* Score */}
          <text
            x={CENTER_X}
            y={CENTER_Y - 12}
            textAnchor="middle"
            className="font-mono"
            style={{
              fontSize: 52,
              fontWeight: 700,
              fill: color,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {animatedScore.toFixed(1)}
          </text>

          {/* Label */}
          <text
            x={CENTER_X}
            y={CENTER_Y + 18}
            textAnchor="middle"
            style={{
              fontSize: 12,
              fill: color,
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 600,
              letterSpacing: '0.1em',
            }}
          >
            {label}
          </text>

          {/* CRS label */}
          <text
            x={CENTER_X}
            y={CENTER_Y + 38}
            textAnchor="middle"
            style={{
              fontSize: 10,
              fill: '#64748B',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
            }}
          >
            City Risk Score
          </text>

          {/* Scale labels */}
          {[1, 5, 10].map((v) => {
            const angleDeg = START_ANGLE_DEG + scoreToAngle(v)
            const rad = degToRad(angleDeg)
            const labelR = RADIUS + 16
            return (
              <text
                key={v}
                x={CENTER_X + labelR * Math.cos(rad)}
                y={CENTER_Y + labelR * Math.sin(rad)}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: 9, fill: '#64748B', fontFamily: '"JetBrains Mono", monospace' }}
              >
                {v}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
