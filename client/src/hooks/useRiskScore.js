import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCrisisScore } from '../utils/api'
import { useWebSocket } from './useWebSocket'
import { getAlertLevelFromScore } from '../utils/riskCalculations'

const FALLBACK = {
  score: 6.4,
  services: {
    fuel: { score: 7.1, trend: [6.5, 6.8, 7.0, 6.9, 7.1, 7.3, 7.1], delta: 0.3 },
    power: { score: 4.3, trend: [5.1, 4.8, 4.6, 4.4, 4.3, 4.2, 4.3], delta: -0.5 },
    food: { score: 5.8, trend: [5.2, 5.4, 5.6, 5.7, 5.8, 5.9, 5.8], delta: 0.2 },
    logistics: { score: 6.2, trend: [6.0, 6.1, 6.2, 6.1, 6.3, 6.2, 6.2], delta: 0.0 },
  },
  wards: [],
  alert_level: 'orange',
}

export function useRiskScore() {
  const [score, setScore] = useState(FALLBACK.score)
  const [services, setServices] = useState(FALLBACK.services)
  const [wards, setWards] = useState(FALLBACK.wards)
  const [alertLevel, setAlertLevel] = useState(FALLBACK.alert_level)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { subscribe } = useWebSocket()
  const pollRef = useRef(null)

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCrisisScore()
      if (data?.score != null) {
        setScore(data.score)
        setServices(data.services || FALLBACK.services)
        setWards(data.wards || [])
        setAlertLevel(data.alert_level || getAlertLevelFromScore(data.score))
        setLastUpdated(new Date().toISOString())
        setError(null)
      }
    } catch (err) {
      setError(err.message)
      // silently use fallback
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    // 60-second polling fallback
    pollRef.current = setInterval(refresh, 60_000)
    return () => clearInterval(pollRef.current)
  }, [refresh])

  useEffect(() => {
    const unsub = subscribe('score_update', (data) => {
      const s = data?.overall_crs ?? data?.score
      if (s != null) {
        setScore(s)
        setServices((prev) => data.services || prev)
        setAlertLevel(data.alert_level || getAlertLevelFromScore(s))
        setLastUpdated(new Date().toISOString())
      }
    })
    return unsub
  }, [subscribe])

  return { score, services, wards, alertLevel, loading, error, lastUpdated, refresh }
}
