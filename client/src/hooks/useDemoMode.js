import { useEffect, useRef, useCallback } from 'react'

const DEMO_EVENTS = [
  '🛢️ Brent Crude +3.2% — Strait of Hormuz shipping corridor disrupted',
  '⚡ Maharashtra grid demand spikes — peak load 218 GW reported',
  '🌾 Wheat futures +4.1% — Black Sea export ban extended 30 days',
  '🚢 Red Sea rerouting adds 14 days — container freight +22%',
  '🔴 OPEC+ emergency cut: 1.5M bbl/day reduction announced',
  '⚠️ India crude stockpile: 18-day buffer — OMC advance mode active',
  '🛒 Panic buying reported in 3 Pune wards — advisory issued',
  '🏭 Haldia refinery output reduced 15% — maintenance shutdown',
]

const DEMO_ALERTS = [
  { id: 'demo-1', severity: 'critical', message: 'CRITICAL: Fuel buffer < 18h in Hadapsar & Katraj — emergency procurement initiated', ward: 'Hadapsar', service: 'fuel', created_at: new Date().toISOString() },
  { id: 'demo-2', severity: 'high', message: 'HIGH: Logistics disruption on NH-48 — fuel tanker routes severely impacted', ward: 'All Wards', service: 'logistics', created_at: new Date(Date.now() - 2 * 60000).toISOString() },
  { id: 'demo-3', severity: 'high', message: 'HIGH: Grid demand at 97% capacity — load shedding protocol T-24 activated', ward: 'Pimpri', service: 'power', created_at: new Date(Date.now() - 4 * 60000).toISOString() },
  { id: 'demo-4', severity: 'moderate', message: 'ADVISORY: Food grain distribution delayed — PDS outlets on alternate-day schedule', ward: 'Swargate', service: 'food', created_at: new Date(Date.now() - 6 * 60000).toISOString() },
]

/**
 * Demo mode: Ctrl+Shift+D activates a 4-minute crisis escalation scenario.
 * Calls setters from CrisisContext to simulate live updates.
 */
export function useDemoMode({ setScore, setServices, setAlerts, setEvents, setDemoActive } = {}) {
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const phaseRef = useRef(0)
  const audioCtxRef = useRef(null)

  const playTone = useCallback((frequency = 440, duration = 0.15, volume = 0.05) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = frequency
      osc.type = 'sine'
      gain.gain.setValueAtTime(volume, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + duration)
    } catch (_) {
      // Audio not available — silent
    }
  }, [])

  const stopDemo = useCallback(() => {
    clearInterval(intervalRef.current)
    clearTimeout(timeoutRef.current)
    phaseRef.current = 0
    setDemoActive?.(false)
  }, [setDemoActive])

  const startDemo = useCallback(() => {
    setDemoActive?.(true)
    phaseRef.current = 0

    const PHASES = [
      // Phase 0-14: Escalation (0→8.5 over ~120s, 8s steps)
      { score: 4.0, fuel: 5.5, power: 4.0, food: 4.2, logistics: 4.8 },
      { score: 4.6, fuel: 6.2, power: 4.3, food: 4.5, logistics: 5.1 },
      { score: 5.2, fuel: 6.8, power: 4.7, food: 5.0, logistics: 5.5 },
      { score: 5.8, fuel: 7.3, power: 5.1, food: 5.4, logistics: 5.9 },
      { score: 6.3, fuel: 7.7, power: 5.5, food: 5.8, logistics: 6.2 },
      { score: 6.8, fuel: 8.1, power: 5.9, food: 6.1, logistics: 6.6 },
      { score: 7.2, fuel: 8.4, power: 6.3, food: 6.4, logistics: 7.0 },
      { score: 7.6, fuel: 8.6, power: 6.7, food: 6.8, logistics: 7.4 },
      { score: 7.9, fuel: 8.8, power: 7.0, food: 7.1, logistics: 7.6 },
      { score: 8.2, fuel: 9.0, power: 7.3, food: 7.3, logistics: 7.8 },
      { score: 8.5, fuel: 9.2, power: 7.5, food: 7.5, logistics: 8.0 },
      // Phase 11-14: Hold at peak
      { score: 8.5, fuel: 9.2, power: 7.5, food: 7.5, logistics: 8.0 },
      { score: 8.5, fuel: 9.1, power: 7.5, food: 7.4, logistics: 7.9 },
      { score: 8.4, fuel: 9.0, power: 7.4, food: 7.3, logistics: 7.8 },
      // Phase 14-20: Recovery
      { score: 8.1, fuel: 8.7, power: 7.1, food: 7.0, logistics: 7.5 },
      { score: 7.7, fuel: 8.3, power: 6.8, food: 6.7, logistics: 7.1 },
      { score: 7.2, fuel: 7.8, power: 6.4, food: 6.3, logistics: 6.7 },
      { score: 6.6, fuel: 7.2, power: 6.0, food: 5.9, logistics: 6.2 },
      { score: 6.0, fuel: 6.6, power: 5.5, food: 5.4, logistics: 5.7 },
      { score: 5.5, fuel: 6.1, power: 5.0, food: 5.0, logistics: 5.3 },
      { score: 5.0, fuel: 5.6, power: 4.6, food: 4.7, logistics: 4.9 },
    ]

    // Alert injection schedule (phase index → alert)
    const ALERT_AT = { 3: DEMO_ALERTS[0], 6: DEMO_ALERTS[1], 8: DEMO_ALERTS[2], 10: DEMO_ALERTS[3] }
    // Event injection schedule
    const EVENT_AT = {
      1: DEMO_EVENTS[0], 3: DEMO_EVENTS[1], 5: DEMO_EVENTS[2],
      7: DEMO_EVENTS[3], 9: DEMO_EVENTS[4], 11: DEMO_EVENTS[5],
      13: DEMO_EVENTS[6], 15: DEMO_EVENTS[7],
    }

    intervalRef.current = setInterval(() => {
      const phase = phaseRef.current
      if (phase >= PHASES.length) {
        stopDemo()
        return
      }

      const p = PHASES[phase]
      setScore?.(p.score)
      setServices?.({
        fuel: { score: p.fuel, trend: 'up', delta: 0.3 },
        power: { score: p.power, trend: phase < 11 ? 'up' : 'down', delta: 0.2 },
        food: { score: p.food, trend: phase < 11 ? 'up' : 'down', delta: 0.1 },
        logistics: { score: p.logistics, trend: phase < 11 ? 'up' : 'down', delta: 0.2 },
      })

      if (ALERT_AT[phase]) {
        const newAlert = { ...ALERT_AT[phase], created_at: new Date().toISOString() }
        setAlerts?.((prev) => [newAlert, ...(prev || [])].slice(0, 30))
        playTone(880, 0.2, 0.06)
      }

      if (EVENT_AT[phase]) {
        const newEvent = {
          id: `demo-event-${phase}`,
          title: EVENT_AT[phase],
          source: 'Demo Feed',
          published_at: new Date().toISOString(),
          severity: phase >= 8 ? 'critical' : phase >= 5 ? 'high' : 'moderate',
          combined_severity: 0.5 + phase * 0.04,
          affected_services: ['fuel', 'logistics'],
          summary: EVENT_AT[phase],
        }
        setEvents?.((prev) => [newEvent, ...(prev || [])].slice(0, 30))
      }

      // Sound feedback on escalation
      if (phase < 11 && p.score >= 7 && PHASES[phase - 1]?.score < 7) {
        playTone(220, 0.5, 0.08) // low boom when entering danger zone
      }

      phaseRef.current += 1
    }, 8000)

    // Auto-stop after all phases complete (~168s = 21 phases * 8s)
    timeoutRef.current = setTimeout(stopDemo, PHASES.length * 8000 + 500)
  }, [setScore, setServices, setAlerts, setEvents, playTone, stopDemo])

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        if (phaseRef.current > 0) {
          stopDemo()
        } else {
          startDemo()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      stopDemo()
    }
  }, [startDemo, stopDemo])

  return { startDemo, stopDemo }
}
