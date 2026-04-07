import axios from 'axios'

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  timeout: 30000,
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
  const res = await api.get('/risk/city-score')
  const d = unwrap(res)
  if (!d) return null

  // Normalize: backend uses overall_crs → score
  if (d.overall_crs != null && d.score == null) d.score = d.overall_crs
  if (d.score == null && d.scores) {
    const vals = [d.scores.fuel, d.scores.food, d.scores.transport, d.scores.power].filter(
      (v) => Number.isFinite(Number(v))
    )
    if (vals.length) d.score = vals.reduce((sum, v) => sum + Number(v), 0) / vals.length
  }

  // Normalize: backend returns scores{fuel,food,transport,power}
  // → frontend expects services{fuel,power,food,logistics} each with {score, trend, delta}
  if (d.scores && !d.services) {
    const s = d.scores
    d.services = {
      fuel:      { score: s.fuel      ?? null, trend: null, delta: 0 },
      power:     { score: s.power     ?? null, trend: null, delta: 0 },
      food:      { score: s.food      ?? null, trend: null, delta: 0 },
      logistics: { score: s.transport ?? s.logistics ?? null, trend: null, delta: 0 },
    }
  }

  // Normalize: backend uses ward_scores (object) → wards (array)
  if (d.ward_scores && !d.wards) {
    d.wards = Object.entries(d.ward_scores).map(([name, score]) => ({ name, score }))
  }

  return d
}

export const fetchScoreHistory = async (days = 7) => {
  const res = await api.get('/risk/city-score')
  const d = unwrap(res)
  if (!d?.scores) return []

  return [
    {
      date: d.timestamp,
      fuel: d.scores.fuel,
      food: d.scores.food,
      transport: d.scores.transport,
      power: d.scores.power,
      days,
    },
  ]
}

export const fetchWardScore = async (wardName) => {
  const res = await api.get('/risk/ward-scores')
  const d = unwrap(res)
  const ward = d?.scores?.[wardName]
  if (!ward) return null
  return {
    ward_name: wardName,
    services: ward,
    score: [ward.fuel, ward.food, ward.transport, ward.power]
      .filter((v) => Number.isFinite(Number(v)))
      .reduce((sum, v, _, arr) => sum + Number(v) / arr.length, 0),
  }
}

export const fetchLatestEvents = async (limit = 20) => {
  const res = await api.get(`/events/latest?limit=${limit}`)
  const d = unwrap(res)
  // Backend returns { articles: [...], total_articles, avg_severity, ... }
  // NLPInsights expects a plain array of event objects
  const articles = Array.isArray(d) ? d : (d?.articles ?? d?.all_analyses ?? [])
  return articles.map((e, i) => ({
    ...e,
    id: e.id ?? e.url ?? `event-${i}`,
    severity: e.crisis_level ?? (e.combined_severity > 0.6 ? 'high' : e.combined_severity > 0.3 ? 'moderate' : 'low'),
    published_at: e.published_at ?? new Date().toISOString(),
  }))
}

export const fetchOilData = async () => {
  const res = await api.get('/events/oil')
  return unwrap(res)
}

export const fetchSignals = async () => {
  const res = await api.get('/events/signals')
  const d = unwrap(res)
  // Backend returns { service_signals: { fuel: { score, article_count, top_keywords }, ... }, avg_severity, ... }
  // NLPInsights expects flat { fuel: 0.73, power: 0.45, food: 0.52, logistics: 0.38 }
  const serviceSignals = d?.service_signals || {}
  return {
    fuel:      Number(serviceSignals?.fuel?.score      || 0),
    power:     Number(serviceSignals?.power?.score     || 0),
    food:      Number(serviceSignals?.food?.score      || 0),
    logistics: Number(serviceSignals?.logistics?.score || 0),
  }
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
