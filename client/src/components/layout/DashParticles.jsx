import { useEffect, useRef } from 'react'

const MIN_PARTICLES = 20
const MAX_PARTICLES = 40
const POINTER_RADIUS = 160
const POINTER_FORCE = 0.055
const BASE_DRIFT = 0.028
const RETURN_STRENGTH = 0.0038
const FRICTION = 0.95
const PARALLAX_FACTOR = 0.03

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function createParticles(width, height) {
  const area = width * height
  const estimate = Math.floor(area / 42000)
  const count = clamp(estimate, MIN_PARTICLES, MAX_PARTICLES)

  return Array.from({ length: count }, () => {
    const x = Math.random() * width
    const y = Math.random() * height
    const angle = Math.random() * Math.PI * 2
    const speed = (Math.random() * 0.4 + 0.6) * BASE_DRIFT
    return {
      x,
      y,
      homeX: x,
      homeY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      capsule: Math.random() > 0.28,
      depth: Math.random() * 0.8 + 0.2,
      length: Math.random() * 3 + 7,
      width: Math.random() * 1.2 + 1.6,
      angle,
      turnSeed: Math.random() * 1000,
      alpha: Math.random() * 0.04 + 0.08,
    }
  })
}

export default function DashParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let rafId = null
    let particles = []
    let width = 0
    let height = 0
    let dpr = 1
    let lastTime = performance.now()
    const pointer = { x: -9999, y: -9999, active: false }
    let scrollY = window.scrollY || 0

    const resize = () => {
      dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = createParticles(width, height)
    }

    const onPointerMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
    }

    const onPointerLeave = () => {
      pointer.active = false
      pointer.x = -9999
      pointer.y = -9999
    }

    const onScroll = () => {
      scrollY = window.scrollY || 0
    }

    const animate = (time) => {
      const dt = clamp((time - lastTime) / 16.67, 0.5, 1.8)
      lastTime = time
      const parallaxY = scrollY * PARALLAX_FACTOR
      const breath = 1 + Math.sin(time * 0.0006) * 0.02

      ctx.clearRect(0, 0, width, height)
      ctx.save()
      ctx.translate(0, -parallaxY)

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]

        const dxHome = p.homeX - p.x
        const dyHome = p.homeY - p.y
        p.vx += dxHome * RETURN_STRENGTH * p.depth * dt
        p.vy += dyHome * RETURN_STRENGTH * p.depth * dt

        // Very soft random steering to avoid rigid linear drift.
        p.turnSeed += 0.009 * dt
        p.angle += Math.sin(p.turnSeed) * 0.004 * dt
        p.vx += Math.cos(p.angle) * 0.0009 * dt
        p.vy += Math.sin(p.angle) * 0.0009 * dt

        if (pointer.active) {
          const dx = p.x - pointer.x
          const dy = p.y - pointer.y
          const dist = Math.hypot(dx, dy)
          if (dist < POINTER_RADIUS && dist > 0.001) {
            const falloff = 1 - dist / POINTER_RADIUS
            const force = POINTER_FORCE * falloff * falloff * dt
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }

        p.vx *= FRICTION
        p.vy *= FRICTION

        p.x += p.vx * dt
        p.y += p.vy * dt

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        const renderX = p.x
        const renderY = p.y
        const alpha = clamp(p.alpha * p.depth, 0.08, 0.12)

        ctx.save()
        ctx.translate(renderX, renderY)
        ctx.rotate(p.angle)
        ctx.globalAlpha = alpha

        if (p.depth < 0.45) {
          ctx.filter = 'blur(0.7px)'
        } else {
          ctx.filter = 'none'
        }

        if (p.capsule) {
          const rw = p.length * breath
          const rh = p.width * breath
          const radius = rh / 2
          ctx.beginPath()
          ctx.roundRect(-rw / 2, -rh / 2, rw, rh, radius)
          ctx.fillStyle = '#000000'
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, (p.width * 0.7 + 0.8) * breath, 0, Math.PI * 2)
          ctx.fillStyle = '#000000'
          ctx.fill()
        }

        ctx.restore()
      }

      ctx.restore()
      rafId = window.requestAnimationFrame(animate)
    }

    resize()
    rafId = window.requestAnimationFrame(animate)
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('mouseleave', onPointerLeave)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseleave', onPointerLeave)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-[-2] bg-surface-container-lowest"></div>
      <div className="fixed top-0 right-0 w-[50%] md:w-[35%] h-full bg-surface-container-low/50 z-[-2] skew-x-[-15deg] translate-x-32 hidden sm:block"></div>
      <canvas ref={canvasRef} className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden="true" />
    </>
  )
}
