import { useState, useEffect } from 'react'
import { fetchWards, fetchInfrastructure } from '../utils/api'

const FALLBACK_WARDS = [
  { name: 'Kothrud', riskScore: 6.2, population: 285000 },
  { name: 'Shivajinagar', riskScore: 4.8, population: 120000 },
  { name: 'Hadapsar', riskScore: 7.8, population: 340000 },
  { name: 'Deccan', riskScore: 5.5, population: 95000 },
  { name: 'Aundh', riskScore: 4.2, population: 180000 },
  { name: 'Baner', riskScore: 3.8, population: 210000 },
  { name: 'Hinjewadi', riskScore: 5.1, population: 155000 },
  { name: 'Wakad', riskScore: 4.6, population: 165000 },
  { name: 'Pimpri', riskScore: 6.9, population: 320000 },
  { name: 'Chinchwad', riskScore: 6.4, population: 290000 },
  { name: 'Kharadi', riskScore: 5.8, population: 195000 },
  { name: 'Viman Nagar', riskScore: 4.5, population: 140000 },
  { name: 'Koregaon Park', riskScore: 3.5, population: 85000 },
  { name: 'Swargate', riskScore: 7.2, population: 110000 },
  { name: 'Katraj', riskScore: 8.1, population: 225000 },
]

const FALLBACK_FUEL = [
  { name: 'HP Kothrud', lat: 18.510, lng: 73.815, type: 'HPCL', status: 'normal', bufferHours: 52 },
  { name: 'BP Shivajinagar', lat: 18.530, lng: 73.852, type: 'BPCL', status: 'low', bufferHours: 18 },
  { name: 'IOC Hadapsar', lat: 18.504, lng: 73.944, type: 'IOC', status: 'critical', bufferHours: 8 },
  { name: 'HP Aundh', lat: 18.562, lng: 73.810, type: 'HPCL', status: 'normal', bufferHours: 67 },
  { name: 'BP Baner', lat: 18.558, lng: 73.785, type: 'BPCL', status: 'normal', bufferHours: 71 },
]

const FALLBACK_HOSPITALS = [
  { name: 'Ruby Hall Clinic', lat: 18.534, lng: 73.888, priorityLevel: 1, fuelBuffer: 72 },
  { name: 'Sahyadri Hospital', lat: 18.519, lng: 73.851, priorityLevel: 1, fuelBuffer: 48 },
  { name: 'Deenanath Mangeshkar', lat: 18.514, lng: 73.826, priorityLevel: 1, fuelBuffer: 60 },
  { name: 'KEM Hospital', lat: 18.512, lng: 73.858, priorityLevel: 2, fuelBuffer: 36 },
  { name: 'Jehangir Hospital', lat: 18.531, lng: 73.882, priorityLevel: 1, fuelBuffer: 54 },
  { name: 'Sancheti Hospital', lat: 18.527, lng: 73.857, priorityLevel: 2, fuelBuffer: 42 },
]

export function useCityData() {
  const [wards, setWards] = useState(FALLBACK_WARDS)
  const [fuelStations, setFuelStations] = useState(FALLBACK_FUEL)
  const [hospitals, setHospitals] = useState(FALLBACK_HOSPITALS)
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
        // silently use fallback
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { wards, fuelStations, hospitals, loading }
}
