import { BASE_URL } from './api'

export const getCityRisk = async (cityName) => {
  const query = cityName ? `?city=${encodeURIComponent(cityName)}` : ''
  const res = await fetch(`${BASE_URL}/api/risk/city-score${query}`)
  if (!res.ok) throw new Error('Backend not available')
  return res.json()
}

export const getWardRisk = async (cityName) => {
  const query = cityName ? `?city=${encodeURIComponent(cityName)}` : ''
  const res = await fetch(`${BASE_URL}/api/risk/ward-scores${query}`)
  if (!res.ok) throw new Error('Backend not available')
  return res.json()
}
