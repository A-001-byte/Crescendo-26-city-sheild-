import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchCrisisScore } from '../utils/api'
import { useWebSocket } from './useWebSocket'
import { getAlertLevelFromScore } from '../utils/riskCalculations'

export function useRiskScore() {
  const [score, setScore] = useState(null)
  const [services, setServices] = useState(null)
  const [wards, setWards] = useState([])
  const [alertLevel, setAlertLevel] = useState('green')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const { subscribe } = useWebSocket()
  const pollRef = useRef(null)

  const applyRiskData = useCallback((data) => {
    if (!data?.scores) {
      setError('Invalid risk payload')
      return
    }

    const nextScore = data.score != null
      ? Number(data.score)
      : [data.scores.fuel, data.scores.food, data.scores.transport, data.scores.power]
        .filter((v) => Number.isFinite(Number(v)))
        .reduce((sum, v, _, arr) => sum + Number(v) / arr.length, 0)

    setScore(nextScore)
    setServices({
      fuel: { score: Number(data.scores.fuel) },
      food: { score: Number(data.scores.food) },
      logistics: { score: Number(data.scores.transport) },
      power: { score: Number(data.scores.power) },
    })

    if (Array.isArray(data.wards)) {
      setWards(data.wards)
    } else if (data.ward_scores && typeof data.ward_scores === 'object') {
      setWards(Object.entries(data.ward_scores).map(([name, score]) => ({ name, score })))
    } else {
      setWards([])
    }

    setAlertLevel(data.alert_level || getAlertLevelFromScore(nextScore))
    setLastUpdated(new Date().toISOString())
    setError(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const data = await fetchCrisisScore()
      console.log(data)
      applyRiskData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [applyRiskData])

  useEffect(() => {
    refresh()

    // 60-second polling
    pollRef.current = setInterval(refresh, 60_000)
    return () => clearInterval(pollRef.current)
  }, [refresh])

  useEffect(() => {
    const handleSnapshot = (snapshot) => {
      const risk = snapshot?.crs || snapshot
      if (risk) applyRiskData(risk)
    }

    const unsubInitial = subscribe('initial_data', handleSnapshot)
    const unsubUpdate = subscribe('update', handleSnapshot)
    const unsubLegacy = subscribe('score_update', (data) => applyRiskData(data))

    return () => {
      unsubInitial?.()
      unsubUpdate?.()
      unsubLegacy?.()
    }
  }, [subscribe, applyRiskData])

  return { score, services, wards, alertLevel, loading, error, lastUpdated, refresh }
}
