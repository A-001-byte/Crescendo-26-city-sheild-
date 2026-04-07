import { createContext, useContext, useState, useEffect } from 'react'
import { useRiskScore } from '../hooks/useRiskScore'
import { useWebSocket } from '../hooks/useWebSocket'
import { fetchAlerts, fetchLatestEvents } from '../utils/api'

const CrisisContext = createContext(null)

const severityFromMessage = (message = '') => {
  const m = String(message).toUpperCase()
  if (m.includes('CRITICAL')) return 'critical'
  if (m.includes('WARNING') || m.includes('HIGH')) return 'high'
  if (m.includes('ALERT') || m.includes('MODERATE')) return 'moderate'
  return 'low'
}

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
  const [alerts, setAlerts] = useState([])
  const [events, setEvents] = useState([])
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
    const unsubSnapshot = subscribe('update', (snapshot) => {
      const now = new Date().toISOString()
      const liveAlerts = Array.isArray(snapshot?.crs?.alerts)
        ? snapshot.crs.alerts.map((msg, idx) => ({
          id: `ws-alert-${Date.now()}-${idx}`,
          severity: severityFromMessage(msg),
          message: msg,
          ward: 'All Wards',
          service: snapshot?.crs?.primary_risk?.category || 'fuel',
          created_at: now,
        }))
        : []

      if (liveAlerts.length) {
        setAlerts((prev) => [...liveAlerts, ...(prev || [])].slice(0, 100))
      }

      const liveEvents = Array.isArray(snapshot?.signals?.critical_events)
        ? snapshot.signals.critical_events.map((e, idx) => ({
          ...e,
          id: e.id || `ws-event-${Date.now()}-${idx}`,
          severity: e.severity || e.crisis_level || 'high',
        }))
        : []

      if (liveEvents.length) {
        setEvents((prev) => [...liveEvents, ...(prev || [])].slice(0, 50))
      }
    })

    const unsubAlert = subscribe('alert_new', (data) => {
      setAlerts((prev) => [{ ...data, created_at: data.created_at || data.timestamp || new Date().toISOString() }, ...prev].slice(0, 100))
    })
    const unsubEvent = subscribe('event_new', (data) => {
      setEvents((prev) => [data, ...prev].slice(0, 50))
    })
    return () => {
      unsubSnapshot?.()
      unsubAlert?.()
      unsubEvent?.()
    }
  }, [subscribe])

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
