const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// Keep mock mode on until backend risk endpoints are ready.
// Flip to false to switch to live API instantly.
const USE_MOCK = true
const MOCK_DELAY_MS = 1500

const MOCK_CITY_DATA = {
  fuel: 8,
  food: 6,
  transport: 7,
  power: 5,
  alerts: ['⚠️ Fuel shortage risk high'],
  primary_risk: { category: 'fuel' },
  recommendation: 'Avoid unnecessary travel',
}

const MOCK_WARD_DATA = {
  Kothrud: { fuel: 8, food: 6, transport: 7, power: 5 },
  Hinjewadi: { fuel: 5, food: 4, transport: 6, power: 3 },
  Katraj: { fuel: 9, food: 7, transport: 8, power: 6 },
  Hadapsar: { fuel: 7, food: 6, transport: 7, power: 5 },
  Aundh: { fuel: 3, food: 4, transport: 3, power: 2 },
}

const unwrap = (payload) => payload?.data ?? payload

const fetchJson = async (url) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
  const derivedScore = overallScore ?? toNumber(
    [fuel, food, transport, power].filter((v) => v != null).reduce((sum, v, _, arr) => sum + v / arr.length, 0)
  )

  return {
    ...raw,
    score: derivedScore,
    scores: normalizedScores,
    alerts: Array.isArray(raw.alerts) ? raw.alerts : [],
    recommendation: raw.recommendation,
    primary_risk: raw.primary_risk,
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

export const getCityRisk = async () => {
  if (USE_MOCK) {
    await sleep(MOCK_DELAY_MS)
    return normalizeCityRisk(MOCK_CITY_DATA)
  }

  const payload = await fetchJson('/api/risk/city-score')
  return normalizeCityRisk(payload)
}

export const getWardRisk = async () => {
  if (USE_MOCK) {
    await sleep(MOCK_DELAY_MS)
    return normalizeWardRisk(MOCK_WARD_DATA)
  }

  const payload = await fetchJson('/api/risk/ward-scores')
  return normalizeWardRisk(payload)
}
