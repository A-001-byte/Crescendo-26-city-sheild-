import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRiskScore } from '../hooks/useRiskScore'
import { useWebSocket } from '../hooks/useWebSocket'
import { useDemoMode } from '../hooks/useDemoMode'
import { fetchAlerts, fetchLatestEvents } from '../utils/api'
import sampleEvents from '../data/sampleEvents.json'

const CrisisContext = createContext(null)

const SAMPLE_ALERTS = [
  { id: 'a1', severity: 'high', message: 'Fuel buffer critically low in Katraj ward — 22h remaining', ward: 'Katraj', service: 'fuel', created_at: new Date(Date.now() - 8 * 60000).toISOString(), channels: ['sms', 'push'] },
  { id: 'a2', severity: 'high', message: 'Transport strike disrupting fuel delivery routes — Hadapsar affected', ward: 'Hadapsar', service: 'logistics', created_at: new Date(Date.now() - 25 * 60000).toISOString(), channels: ['sms', 'whatsapp'] },
  { id: 'a3', severity: 'moderate', message: 'Swargate distribution center operating at 60% capacity', ward: 'Swargate', service: 'food', created_at: new Date(Date.now() - 55 * 60000).toISOString(), channels: ['push'] },
  { id: 'a4', severity: 'moderate', message: 'Pimpri grid load at 94% — demand management advisory issued', ward: 'Pimpri', service: 'power', created_at: new Date(Date.now() - 2 * 3600000).toISOString(), channels: ['push', 'iccc'] },
  { id: 'a5', severity: 'low', message: 'IOC Pune terminal delivery scheduled — Kothrud buffer to be replenished', ward: 'Kothrud', service: 'fuel', created_at: new Date(Date.now() - 4 * 3600000).toISOString(), channels: ['iccc'] },
]

export function CrisisProvider({ children }) {
  const {
    score: liveScore,
    services: liveServices,
    wards,
    alertLevel,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useRiskScore()
  const { connected: wsConnected, subscribe } = useWebSocket()

  const [score, setScore] = useState(null)
  const [services, setServices] = useState(null)
  const [alerts, setAlerts] = useState(SAMPLE_ALERTS)
  const [events, setEvents] = useState(sampleEvents)
  const [selectedCity, setSelectedCity] = useState('Pune')
  const [demoActive, setDemoActive] = useState(false)

  // Sync live data into local state (demo mode can override these)
  useEffect(() => {
    if (!demoActive && liveScore != null) setScore(liveScore)
  }, [liveScore, demoActive])

  useEffect(() => {
    if (!demoActive && liveServices) setServices(liveServices)
  }, [liveServices, demoActive])

  // Load alerts from API
  useEffect(() => {
    fetchAlerts().then((data) => {
      if (data?.length) {
        const normalized = data.map(a => ({
          ...a,
          created_at: a.created_at || a.timestamp,
        }))
        setAlerts(normalized)
      }
    }).catch(() => {})
  }, [])

  // Load events from API
  useEffect(() => {
    fetchLatestEvents(20).then((data) => {
      if (data?.length) setEvents(data)
    }).catch(() => {})
  }, [])

  // WebSocket subscriptions
  useEffect(() => {
    const unsubAlert = subscribe('alert_new', (data) => {
      setAlerts((prev) => [{ ...data, created_at: data.created_at || data.timestamp || new Date().toISOString() }, ...prev].slice(0, 100))
    })
    const unsubEvent = subscribe('event_new', (data) => {
      setEvents((prev) => [data, ...prev].slice(0, 50))
    })
    return () => {
      unsubAlert?.()
      unsubEvent?.()
    }
  }, [subscribe])

  // Demo mode — Ctrl+Shift+D
  useDemoMode({
    setScore,
    setServices,
    setAlerts,
    setEvents,
    setDemoActive,
  })

  const value = {
    score: score ?? liveScore,
    services: services ?? liveServices,
    wards,
    alertLevel,
    loading,
    error,
    lastUpdated,
    refresh,
    alerts,
    events,
    wsConnected,
    selectedCity,
    setSelectedCity,
    demoActive,
  }

  return <CrisisContext.Provider value={value}>{children}</CrisisContext.Provider>
}

export function useCrisis() {
  const ctx = useContext(CrisisContext)
  if (!ctx) throw new Error('useCrisis must be used within CrisisProvider')
  return ctx
}
