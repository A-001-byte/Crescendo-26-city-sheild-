export const BASE_URL = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'
).replace(/\/+$/, '')

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const unwrap = (payload) => payload?.data ?? payload

const toNumber = (value, fallback = null) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem('cityshield_auth_token')
}

const buildApiPath = (path) => {
  if (path.startsWith('/api/')) return path
  return path.startsWith('/') ? `/api${path}` : `/api/${path}`
}

const fetchJson = async (path, options = {}) => {
  const token = getAuthToken()
  const res = await fetch(`${BASE_URL}${buildApiPath(path)}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    let message = 'Request failed'
    try {
      const payload = await res.json()
      message = payload?.error || payload?.message || message
    } catch (e) {
      // Ignore JSON parse failures and keep default message.
    }
    const err = new Error(message)
    err.status = res.status
    throw err
  }

  return res.json()
}

const fetchJsonWithFallback = async (paths, options = {}) => {
  let lastErr = null

  for (const path of paths) {
    try {
      return await fetchJson(path, options)
    } catch (err) {
      lastErr = err
      if (err?.status !== 404) break
    }
  }

  throw lastErr || new Error('Backend not available')
}

const normalizeAuthUser = (user = {}) => {
  if (!user || typeof user !== 'object') return null
  return {
    ...user,
    fullName: user.fullName || user.full_name || null,
    full_name: user.full_name || user.fullName || null,
    email: user.email || null,
    username: user.username || null,
  }
}

const normalizeAlertChannels = (channels = []) => {
  const map = {
    push: 'app',
    iccc: 'public_address',
    whatsapp: 'sms',
  }

  const normalized = channels
    .map((ch) => map[ch] || ch)
    .filter((ch) => ['sms', 'app', 'email', 'public_address', 'radio', 'tv'].includes(ch))

  return Array.from(new Set(normalized))
}

export const fetchCrisisScore = async (options = {}) => {
  const opts = typeof options === 'string' ? { city: options } : (options || {})
  const params = new URLSearchParams()
  if (opts.city) params.set('city', opts.city)
  const query = params.toString()
  const d = await fetchJson(`/risk/city-score${query ? `?${query}` : ''}`)
  if (!d) return null

  if (d.overall_crs != null && d.score == null) d.score = d.overall_crs

  if (d.scores && !d.services) {
    const s = d.scores
    d.services = {
      fuel: { score: s.fuel ?? null, trend: [], delta: 0 },
      power: { score: s.power ?? null, trend: [], delta: 0 },
      food: { score: s.food ?? null, trend: [], delta: 0 },
      logistics: { score: s.transport ?? s.logistics ?? null, trend: [], delta: 0 },
    }
  }

  if (d.ward_scores && !d.wards) {
    d.wards = Object.entries(d.ward_scores).map(([name, score]) => ({ name, score }))
  }

  if (!Array.isArray(d.alerts)) d.alerts = []
  if (!d.prediction_48h) d.prediction_48h = {}
  if (!d.prediction_summary) d.prediction_summary = {}
  if (d.confidence == null) d.confidence = 'unknown'

  return d
}

export const fetchScoreHistory = async (options = {}) => {
  const opts = typeof options === 'number' ? { hours: options } : (options || {})
  const safeHours = Math.max(1, Math.min(48, Number(opts.hours) || 24))
  const params = new URLSearchParams()
  params.set('hours', String(safeHours))
  if (opts.city) params.set('city', opts.city)

  const payload = await fetchJson(`/risk/city-score/history?${params.toString()}`)
  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []

  return rows.map((row) => {
    const services = row?.services || row?.scores || {}
    return {
      timestamp: row?.timestamp || row?.date || new Date().toISOString(),
      fuel: toNumber(row?.fuel ?? services?.fuel?.score ?? services?.fuel ?? 0, 0),
      food: toNumber(row?.food ?? services?.food?.score ?? services?.food ?? 0, 0),
      transport: toNumber(row?.transport ?? services?.transport?.score ?? services?.transport ?? 0, 0),
      power: toNumber(row?.power ?? services?.power?.score ?? services?.power ?? 0, 0),
      logistics: toNumber(row?.logistics ?? services?.logistics?.score ?? services?.logistics ?? 0, 0),
    }
  })
}

export const fetchWardScore = async (wardName) => {
  if (!wardName) return null

  const payload = await fetchJson('/risk/ward-scores')
  const ward = payload?.scores?.[wardName]
  if (!ward) return null

  const vals = [ward.fuel, ward.food, ward.transport, ward.power]
    .map((v) => toNumber(v, null))
    .filter((v) => v != null)

  return {
    ward_name: wardName,
    services: ward,
    score: vals.length ? vals.reduce((sum, v) => sum + v, 0) / vals.length : 0,
  }
}

export const fetchWeatherDisruption = async (city) => {
  const params = new URLSearchParams()
  if (city) params.set('city', city)
  const query = params.toString()
  const payload = await fetchJson(`/disruptions/weather${query ? `?${query}` : ''}`)
  return unwrap(payload)
}

export const fetchLatestEvents = async (limit = 20) => {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 20))
  const payload = await fetchJson(`/events/latest?limit=${encodeURIComponent(safeLimit)}`)

  const rawEvents = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data?.articles)
      ? payload.data.articles
      : Array.isArray(payload?.all_analyses)
        ? payload.all_analyses
        : Array.isArray(payload?.data?.all_analyses)
          ? payload.data.all_analyses
      : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.articles)
            ? payload.articles
            : []

  return rawEvents.map((e, i) => {
    const rawCredibility =
      e?.bert_confidence ??
      e?.credibility_score ??
      null

    const credibility = rawCredibility == null
      ? null
      : clamp(toNumber(rawCredibility, null), 0, 1)

    return {
      ...e,
      id: e?.id ?? e?.url ?? `event-${i}`,
      title: e?.title ?? e?.headline ?? 'Untitled event',
      source: e?.source ?? 'Unknown',
      severity:
        e?.severity ??
        e?.crisis_level ??
        null,
      affected_services: Array.isArray(e?.affected_services) ? e.affected_services : [],
      url: e?.url ?? e?.link ?? e?.source_url ?? e?.news_url ?? null,
      bert_confidence: credibility,
      published_at: e?.published_at ?? e?.timestamp ?? null,
    }
  })
}

export const fetchOilData = async () => {
  const payload = await fetchJson('/events/oil')
  return unwrap(payload)
}

export const fetchSignals = async () => {
  const payload = await fetchJsonWithFallback(['/signals', '/events/signals'])
  const d = unwrap(payload)

  if (
    d &&
    ['fuel', 'power', 'food', 'logistics'].every((key) => typeof d[key] !== 'undefined')
  ) {
    return {
      fuel: toNumber(d.fuel, 0),
      power: toNumber(d.power, 0),
      food: toNumber(d.food, 0),
      logistics: toNumber(d.logistics, 0),
    }
  }

  const s = d?.service_signals || {}
  return {
    fuel: toNumber(s?.fuel?.score, 0),
    power: toNumber(s?.power?.score, 0),
    food: toNumber(s?.food?.score, 0),
    logistics: toNumber(s?.logistics?.score, 0),
  }
}

export const fetchAlerts = async (severity = 'all') => {
  const payload = await fetchJson(`/alerts?severity=${encodeURIComponent(severity)}`)
  return Array.isArray(payload?.data) ? payload.data : []
}

export const dispatchAlert = async (payload) => {
  const channels = normalizeAlertChannels(payload?.channels || [])
  const outgoing = {
    ...payload,
    channels: channels.length ? channels : ['sms'],
  }

  const result = await fetchJson('/alerts/dispatch', {
    method: 'POST',
    body: JSON.stringify(outgoing),
  })

  return unwrap(result)
}

export const fetchAlertTemplates = async () => {
  const payload = await fetchJson('/alerts/templates')
  return unwrap(payload)
}

export const fetchWards = async () => {
  const payload = await fetchJson('/city/wards')
  return Array.isArray(payload?.data) ? payload.data : []
}

export const fetchInfrastructure = async () => {
  const payload = await fetchJson('/city/infrastructure')
  const d = unwrap(payload)

  return {
    fuelStations: Array.isArray(d?.fuelStations)
      ? d.fuelStations
      : Array.isArray(d?.fuel_stations)
        ? d.fuel_stations
        : [],
    hospitals: Array.isArray(d?.hospitals) ? d.hospitals : [],
    summary: d?.summary || {},
  }
}

export const fetchCityConfig = async () => {
  const payload = await fetchJson('/city/config')
  return unwrap(payload)
}

export const fetchLoginActivity = async (options = {}) => {
  const opts = typeof options === 'number' ? { days: options } : (options || {})
  const params = new URLSearchParams()
  if (opts.days != null) params.set('days', String(opts.days))
  if (opts.city) params.set('city', opts.city)

  const payload = await fetchJson(`/analytics/logins?${params.toString()}`)
  const rows = Array.isArray(payload?.data) ? payload.data : []

  return rows.map((row) => ({
    day: row?.day,
    logins: toNumber(row?.logins, 0),
  }))
}

export const loginUser = async ({ identity, password }) => {
  try {
    const payload = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identity, password }),
    })

    const data = unwrap(payload)
    return {
      ...data,
      user: normalizeAuthUser(data?.user),
    }
  } catch (error) {
    const message = error?.message || 'Login failed. Please try again.'
    throw new Error(message)
  }
}

export const signupUser = async ({ fullName, email, password }) => {
  try {
    const payload = await fetchJson('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    })

    const data = unwrap(payload)
    return {
      ...data,
      user: normalizeAuthUser(data?.user),
    }
  } catch (error) {
    const message = error?.message || 'Signup failed. Please try again.'
    throw new Error(message)
  }
}

export default {
  BASE_URL,
  fetchCrisisScore,
  fetchScoreHistory,
  fetchWardScore,
  fetchLatestEvents,
  fetchOilData,
  fetchSignals,
  fetchAlerts,
  dispatchAlert,
  fetchAlertTemplates,
  fetchWards,
  fetchInfrastructure,
  fetchCityConfig,
  fetchLoginActivity,
  loginUser,
  signupUser,
}
