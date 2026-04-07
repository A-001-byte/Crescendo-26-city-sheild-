import { useEffect, useRef, useState } from 'react'

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

  // Map 1-10 to angle mapping inside the simplistic half-circle SVG bounding box we adopted
  // viewBox: 0 0 100 50
  // Arc starts at 10 50 (left) and ends at 90 50 (right)
  // R = 40, Center = 50, 50
  const normalizedValue = (animatedScore - 1) / 9 // 0 to 1
  const angleRad = Math.PI - (normalizedValue * Math.PI)
  
  const endX = 50 + 40 * Math.cos(angleRad)
  const endY = 50 - 40 * Math.sin(angleRad)

  // Use a small epsilon so the path doesn't break at exact zero calculation
  const sweepFlag = 0

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm">
      <div className="w-full flex items-center justify-center pt-2">
        <svg className="w-full h-auto overflow-visible" viewBox="0 0 100 55">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e2e2" strokeLinecap="round" strokeWidth="8"></path>
          <path d={`M 10 50 A 40 40 0 0 1 ${endX} ${Math.max(endY, 10)}`} fill="none" stroke="#000000" strokeLinecap="round" strokeWidth="8"></path>
        </svg>
      </div>
      <div className="mt-4">
        <span className="text-6xl font-extrabold letter-spacing-tight tracking-tighter text-primary">
          {animatedScore.toFixed(1)}
        </span>
      </div>
    </div>
  )
}
