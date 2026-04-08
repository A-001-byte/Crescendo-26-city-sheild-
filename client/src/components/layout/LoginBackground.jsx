import { useEffect, useRef } from 'react'

const DOT_SPACING = 30
const DOT_BASE_RADIUS = 1.4
const DOT_HIGHLIGHT_RADIUS = 4.5
const CURSOR_RADIUS = 140
const REPEL_STRENGTH = 0.22
const SPRING = 0.1
const FRICTION = 0.74

export default function LoginBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let rafId = null
    let dots = []
    let mouse = { x: -9999, y: -9999 }
    let w = 0
    let h = 0
    let dpr = 1

    const init = () => {
      dpr = window.devicePixelRatio || 1
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      dots = []
      const cols = Math.ceil(w / DOT_SPACING) + 2
      const rows = Math.ceil(h / DOT_SPACING) + 2
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const ox = c * DOT_SPACING - DOT_SPACING / 2
          const oy = r * DOT_SPACING - DOT_SPACING / 2
          dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 })
        }
      }
    }

    const onMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    const onMouseLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const animate = () => {
      // Gradient background
      ctx.fillStyle = '#06060e'
      ctx.fillRect(0, 0, w, h)

      // Subtle radial glow near top-left (brand accent)
      const glow = ctx.createRadialGradient(w * 0.08, h * 0.12, 0, w * 0.08, h * 0.12, w * 0.55)
      glow.addColorStop(0, 'rgba(56, 130, 246, 0.07)')
      glow.addColorStop(1, 'rgba(6,6,14,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      for (const d of dots) {
        // Repulsion from cursor
        const dxM = d.ox - mouse.x
        const dyM = d.oy - mouse.y
        const distM = Math.hypot(dxM, dyM)

        if (distM < CURSOR_RADIUS && distM > 0.5) {
          const falloff = 1 - distM / CURSOR_RADIUS
          const force = falloff * falloff * REPEL_STRENGTH * DOT_SPACING
          d.vx += (dxM / distM) * force
          d.vy += (dyM / distM) * force
        }

        // Spring to origin
        d.vx += (d.ox - d.x) * SPRING
        d.vy += (d.oy - d.y) * SPRING
        d.vx *= FRICTION
        d.vy *= FRICTION
        d.x += d.vx
        d.y += d.vy

        // Highlight based on displaced distance from origin
        const displaced = Math.hypot(d.x - d.ox, d.y - d.oy)
        const maxDisplace = REPEL_STRENGTH * DOT_SPACING
        const t = Math.min(displaced / maxDisplace, 1)

        // Dot near cursor also reacts to cursor proximity directly
        const curDist = Math.hypot(d.x - mouse.x, d.y - mouse.y)
        const proximity = Math.max(0, 1 - curDist / (CURSOR_RADIUS * 1.1))

        const highlight = Math.max(t, proximity * 0.9)
        const radius = DOT_BASE_RADIUS + highlight * (DOT_HIGHLIGHT_RADIUS - DOT_BASE_RADIUS)
        const alpha = 0.13 + highlight * 0.72

        ctx.beginPath()
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2)

        if (highlight > 0.08) {
          // Cyan-blue glow
          ctx.shadowBlur = highlight * 14
          ctx.shadowColor = `rgba(96, 165, 250, ${highlight * 0.9})`
          // Interpolate from dim white to vivid cyan
          const r = Math.round(255 * (1 - highlight) + 96 * highlight)
          const g = Math.round(255 * (1 - highlight) + 165 * highlight)
          const b = 250
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        } else {
          ctx.shadowBlur = 0
          ctx.fillStyle = `rgba(200,210,255,${alpha})`
        }

        ctx.fill()
        ctx.shadowBlur = 0
      }

      rafId = requestAnimationFrame(animate)
    }

    init()
    animate()
    window.addEventListener('resize', init)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseleave', onMouseLeave)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('resize', init)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
