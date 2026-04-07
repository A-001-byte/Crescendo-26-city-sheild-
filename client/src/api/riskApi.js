const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim()

const unwrap = (payload) => payload?.data ?? payload

const fetchJson = async (url) => {
  const resolvedUrl = API_BASE_URL ? `${API_BASE_URL}${url}` : url
  const res = await fetch(resolvedUrl)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const normalizeCityRisk = (payload) => {
  const raw = unwrap(payload) || {}
  const services = raw.services || {}
  const scores = raw.scores || {}

  const fuel = toNumber(scores.fuel ?? raw.fuel ?? services?.fuel?.score ?? services?.fuel)
  const food = toNumber(scores.food ?? raw.food ?? services?.food?.score ?? services?.food)
  const transport = toNumber(
    scores.transport ??
    raw.transport ??
    services?.transport?.score ??
    services?.transport ??
    services?.logistics?.score ??
    services?.logistics
  )
  const power = toNumber(scores.power ?? raw.power ?? services?.power?.score ?? services?.power)

  const normalizedScores = { fuel, food, transport, power }

  const overallScore = toNumber(raw.score ?? raw.overall_crs)
  const filteredScores = [fuel, food, transport, power].filter((v) => v != null)
  const averageScore = filteredScores.length
    ? toNumber(filteredScores.reduce((sum, v) => sum + v, 0) / filteredScores.length)
    : null
  const derivedScore = overallScore ?? averageScore

  return {
    ...raw,
    score: derivedScore,
    scores: normalizedScores,
    alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
    recommendation: raw.recommendation,
    primary_risk: raw.primary_risk,
  }
}

const normalizeSingleWardRisk = (payload, wardName) => {
  const raw = unwrap(payload) || {}
  const services = raw.services || raw.scores || raw

  const fuel = toNumber(services?.fuel?.score ?? services?.fuel)
  const food = toNumber(services?.food?.score ?? services?.food)
  const transport = toNumber(
    services?.transport?.score ??
    services?.transport ??
    services?.logistics?.score ??
    services?.logistics
  )
  const power = toNumber(services?.power?.score ?? services?.power)

  const values = [fuel, food, transport, power].filter((v) => v != null)
  const score = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null

  return {
    ward_name: raw.ward_name || raw.name || wardName,
    score: toNumber(raw.riskScore ?? raw.score ?? score),
    services: {
      fuel,
      food,
      transport,
      power,
    },
  }
}

const normalizeWardRisk = (payload) => {
  const raw = unwrap(payload)

  if (Array.isArray(raw)) {
    const wardScores = raw.reduce((acc, item) => {
      const name = item?.name || item?.ward || item?.ward_name
      const score = toNumber(item?.riskScore ?? item?.live_risk_score ?? item?.score ?? item?.risk)
      if (name && score != null) acc[name] = score
      return acc
    }, {})
    const wardServices = raw.reduce((acc, item) => {
      const name = item?.name || item?.ward || item?.ward_name
      if (!name) return acc
      const fuel = toNumber(item?.fuel ?? item?.fuelScore)
      const food = toNumber(item?.food ?? item?.foodScore)
      const transport = toNumber(item?.transport ?? item?.logistics ?? item?.logisticsScore)
      const power = toNumber(item?.power ?? item?.powerScore)
      acc[name] = { fuel, food, transport, power }
      return acc
    }, {})
    return { ward_scores: wardScores, ward_services: wardServices }
  }

  if (raw?.ward_scores && typeof raw.ward_scores === 'object') {
    return {
      ward_scores: raw.ward_scores,
      ward_services: raw.ward_services || {},
    }
  }

  if (raw && typeof raw === 'object') {
    const wardScores = Object.entries(raw).reduce((acc, [key, value]) => {
      let score = toNumber(value)
      if (score == null && value && typeof value === 'object') {
        const fuel = toNumber(value.fuel)
        const food = toNumber(value.food)
        const transport = toNumber(value.transport)
        const power = toNumber(value.power)
        const values = [fuel, food, transport, power].filter((v) => v != null)
        if (values.length) {
          score = values.reduce((sum, v) => sum + v, 0) / values.length
        }
      }
      if (score != null) acc[key] = score
      return acc
    }, {})

    const wardServices = Object.entries(raw).reduce((acc, [key, value]) => {
      if (!value || typeof value !== 'object') return acc
      acc[key] = {
        fuel: toNumber(value.fuel),
        food: toNumber(value.food),
        transport: toNumber(value.transport),
        power: toNumber(value.power),
      }
      return acc
    }, {})

    return { ward_scores: wardScores, ward_services: wardServices }
  }

  return { ward_scores: {}, ward_services: {} }
}

export const getCityRisk = async (cityName) => {
  const query = cityName ? `?city=${encodeURIComponent(cityName)}` : ''
  const payload = await fetchJson(`/api/risk/city-score${query}`)
  const data = normalizeCityRisk(payload)
  console.log(data)
  return data
}

export const getWardRisk = async (wardName) => {
  if (!wardName) {
    throw new Error('wardName is required for getWardRisk')
  }

  const payload = await fetchJson('/api/risk/ward-scores')
  const wardPayload = unwrap(payload)?.scores?.[wardName] || {}
  const data = normalizeSingleWardRisk(wardPayload, wardName)
  console.log(data)
  return data
}
