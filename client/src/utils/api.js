import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn('[CityShield API]', error?.response?.status, error?.config?.url)
    return Promise.reject(error)
  }
)

// Returns the unwrapped data from {success, data} envelope
const unwrap = (res) => res.data?.data ?? res.data

export const fetchCrisisScore = async () => {
  const res = await api.get('/crisis/score')
  const d = unwrap(res)
  if (!d) return null
  // Normalize: backend uses overall_crs → score
  if (d.overall_crs != null && d.score == null) d.score = d.overall_crs
  // Normalize: backend uses ward_scores (object) → wards (array)
  if (d.ward_scores && !d.wards) {
    d.wards = Object.entries(d.ward_scores).map(([name, score]) => ({ name, score }))
  }
  return d
}

export const fetchScoreHistory = async (days = 7) => {
  const res = await api.get(`/crisis/score/history?days=${days}`)
  return unwrap(res)
}

export const fetchWardScore = async (wardName) => {
  const res = await api.get(`/crisis/score/ward/${encodeURIComponent(wardName)}`)
  return unwrap(res)
}

export const fetchLatestEvents = async (limit = 20) => {
  const res = await api.get(`/events/latest?limit=${limit}`)
  return unwrap(res)
}

export const fetchOilData = async () => {
  const res = await api.get('/events/oil')
  return unwrap(res)
}

export const fetchSignals = async () => {
  const res = await api.get('/events/signals')
  return unwrap(res)
}

export const fetchAlerts = async (severity = 'all') => {
  const res = await api.get(`/alerts?severity=${severity}`)
  return unwrap(res)
}

export const dispatchAlert = async (payload) => {
  const res = await api.post('/alerts/dispatch', payload)
  return unwrap(res)
}

export const fetchWards = async () => {
  const res = await api.get('/city/wards')
  return unwrap(res)
}

export const fetchInfrastructure = async () => {
  const res = await api.get('/city/infrastructure')
  return unwrap(res)
}

export default api
