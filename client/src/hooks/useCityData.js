import { useState, useEffect } from 'react'
import { fetchWards, fetchInfrastructure } from '../utils/api'

export function useCityData() {
  const [wards, setWards] = useState([])
  const [fuelStations, setFuelStations] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [wardsData, infraData] = await Promise.all([fetchWards(), fetchInfrastructure()])
        if (cancelled) return
        if (wardsData?.length) setWards(wardsData)
        if (infraData?.fuelStations?.length) setFuelStations(infraData.fuelStations)
        if (infraData?.hospitals?.length) setHospitals(infraData.hospitals)
      } catch {
        setWards([])
        setFuelStations([])
        setHospitals([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { wards, fuelStations, hospitals, loading }
}
