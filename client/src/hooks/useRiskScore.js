import { useState, useEffect, useCallback, useRef } from 'react'
import { getCityRisk, getWardRisk } from '../api/riskApi'
import { useWebSocket } from './useWebSocket'
import { getAlertLevelFromScore } from '../utils/riskCalculations'

export function useRiskScore(cityName) {
  const [score, setScore] = useState(null)
  const [riskPayload, setRiskPayload] = useState(null)
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

    const nextScore = data.score ?? data.overall_crs
    const resolvedScore = Number.isFinite(Number(nextScore)) ? Number(nextScore) : null

    setScore(resolvedScore)
    setRiskPayload(data)
    setServices({
      fuel: { score: Number.isFinite(Number(data.scores.fuel)) ? Number(data.scores.fuel) : null },
      food: { score: Number.isFinite(Number(data.scores.food)) ? Number(data.scores.food) : null },
      logistics: { score: Number.isFinite(Number(data.scores.transport)) ? Number(data.scores.transport) : null },
      power: { score: Number.isFinite(Number(data.scores.power)) ? Number(data.scores.power) : null },
    })

    if (Array.isArray(data.wards)) {
      setWards(data.wards)
    } else if (data.ward_scores && typeof data.ward_scores === 'object') {
      setWards(Object.entries(data.ward_scores).map(([name, score]) => ({ name, score })))
    } else {
      setWards([])
    }

    setAlertLevel(data.alert_level || (resolvedScore != null ? getAlertLevelFromScore(resolvedScore) : 'green'))
    setLastUpdated(data.timestamp || new Date().toISOString())
    setError(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [data, wardData] = await Promise.all([getCityRisk(cityName), getWardRisk(cityName)])
      applyRiskData(data)

      if (wardData?.scores && typeof wardData.scores === 'object') {
        const wardList = Object.entries(wardData.scores).map(([name, svc]) => {
          const vals = [svc?.fuel, svc?.food, svc?.transport, svc?.power].filter((v) => Number.isFinite(Number(v)))
          const risk = vals.length ? vals.reduce((sum, v) => sum + Number(v), 0) / vals.length : 0
          return { name, score: risk, services: svc }
        })
        setWards(wardList)
      }
    } catch (err) {
      setError('Backend not available')
    } finally {
      setLoading(false)
    }
  }, [applyRiskData, cityName])

  useEffect(() => {
    refresh()

    // 60-second polling
    pollRef.current = setInterval(refresh, 60_000)
    return () => clearInterval(pollRef.current)
  }, [refresh])

  useEffect(() => {
    const handleSnapshot = (snapshot) => {
      const risk = snapshot?.crs || snapshot
      const snapshotCity = snapshot?.city || risk?.city

      if (cityName && snapshotCity && String(snapshotCity).toLowerCase() !== String(cityName).toLowerCase()) {
        return
      }

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
  }, [subscribe, applyRiskData, cityName])

  return { score, riskPayload, services, wards, alertLevel, loading, error, lastUpdated, refresh }
}
