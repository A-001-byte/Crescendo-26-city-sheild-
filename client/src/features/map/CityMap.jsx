import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import { useCrisis } from '../../context/CrisisContext'
import { BASE_URL } from '../../api/api'

const CITY_CONFIG = {
  pune: {
    center: [18.5204, 73.8567],
    geojson: '/geo/pune_wards.json',
  },
  mumbai: {
    center: [19.076, 72.8777],
    geojson: '/geo/mumbai_wards.json',
  },
  nashik: {
    center: [19.9975, 73.7898],
    geojson: '/geo/nashik_wards.json',
  },
  nagpur: {
    center: [21.1458, 79.0882],
    geojson: '/geo/nagpur_wards.json',
  },
}

function normalizeCity(city) {
  const key = String(city || '').trim().toLowerCase()
  return CITY_CONFIG[key] ? key : 'pune'
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase()
}

function normalizeKeys(obj) {
  const normalized = {}
  Object.keys(obj || {}).forEach((key) => {
    normalized[normalizeName(key)] = obj[key]
  })
  return normalized
}

function toNumber(value) {
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function getColor(score) {
  if (score == null) return '#9CA3AF'
  if (score <= 3) return '#16A34A'
  if (score <= 6) return '#EAB308'
  return '#DC2626'
}

function getRiskColor(score) {
  if (score == null) return '#94A3B8'
  if (score <= 4) return '#22c55e'
  if (score <= 7) return '#f59e0b'
  return '#ef4444'
}

function formatScore(value) {
  const num = toNumber(value)
  return num == null ? 'N/A' : num.toFixed(1)
}

export default function CityMap() {
  const { selectedCity } = useCrisis()
  const [city, setCity] = useState(normalizeCity(selectedCity))

  useEffect(() => {
    setCity(normalizeCity(selectedCity))
  }, [selectedCity])

  const config = CITY_CONFIG[city]

  const [geoData, setGeoData] = useState(null)
  const [wardScores, setWardScores] = useState({})
  const [cityScore, setCityScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cityScoreValue = toNumber(cityScore)
  const riskColor = getRiskColor(cityScoreValue)

  async function loadAllData(cityKey) {
    setLoading(true)
    setError(null)

    try {
      const [geoRes, wardRes, cityRes] = await Promise.all([
        fetch(CITY_CONFIG[cityKey].geojson),
        fetch(`${BASE_URL}/api/risk/ward-scores?city=${encodeURIComponent(cityKey)}`),
        fetch(`${BASE_URL}/api/risk/city-score?city=${encodeURIComponent(cityKey)}`),
      ])

      if (!geoRes.ok || !wardRes.ok || !cityRes.ok) {
        throw new Error('Failed to load city map data')
      }

      const geo = await geoRes.json()
      const wards = await wardRes.json()
      const cityRisk = await cityRes.json()
      const scores = wards?.scores && typeof wards.scores === 'object' ? wards.scores : {}

      console.log('CITY LOAD:', cityKey)
      console.log('GEO:', geo)
      console.log('WARD:', wards)

      setGeoData(geo)
      setWardScores(normalizeKeys(scores))
      setCityScore(toNumber(cityRisk?.score ?? cityRisk?.overall_crs))
    } catch (err) {
      console.error('MAP LOAD ERROR:', err)
      setError(err?.message || 'Map data unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setGeoData(null)
    setWardScores({})
    console.log('CITY:', city)
    void loadAllData(city)
  }, [city])

  useEffect(() => {
    console.log('GEO:', geoData)
  }, [geoData])

  useEffect(() => {
    console.log('SCORES:', wardScores)
  }, [wardScores])

  return (
    <div className="map-shell relative h-full w-full overflow-hidden rounded-[2rem]">
      <MapContainer
        key={`map-${city}`}
        center={config.center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="map-container"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {geoData && Object.keys(wardScores).length > 0 && (
          <GeoJSON
            data={geoData}
            style={(feature) => {
              const name = normalizeName(feature?.properties?.name)
              const data = wardScores[name]

              if (!data) {
                return {
                  fillColor: '#ccc',
                  fillOpacity: 0.2,
                  color: '#999'
                }
              }

              return {
                fillColor: getColor(toNumber(data?.fuel)),
                fillOpacity: 0.6,
                color: '#333',
                weight: 1
              }
            }}
            onEachFeature={(feature, layer) => {
              const displayName = feature?.properties?.name || 'Unknown Ward'
              const name = normalizeName(feature?.properties?.name)
              const data = wardScores[name]

              if (data) {
                layer.bindTooltip(
                  `<div style="font-size:12px;line-height:1.4">
                    <div><strong>${displayName}</strong></div>
                    <div>Fuel: ${formatScore(data.fuel)}</div>
                    <div>Food: ${formatScore(data.food)}</div>
                    <div>Power: ${formatScore(data.power)}</div>
                  </div>`,
                  { sticky: true }
                )
              }
            }}
          />
        )}
      </MapContainer>

      <div className="map-overlay">
        <div className="city-badge" style={{ '--risk-color': riskColor }}>
          <div className="city-name">{city}</div>
          <div className="city-score">
            City Score: <span style={{ color: riskColor }}>{cityScoreValue == null ? 'N/A' : cityScoreValue.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-[600] grid place-items-center bg-white/50 text-sm font-semibold text-slate-700">
          Loading map data...
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 z-[600] rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          {error}
        </div>
      )}
    </div>
  )
}
