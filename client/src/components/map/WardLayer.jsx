import { GeoJSON } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import wardData from '../../data/puneWards.geojson'
import { getWardRisk } from '../../api/riskApi'

function getWardRiskColor(score) {
  if (score >= 8) return '#EF4444'
  if (score >= 4) return '#FACC15'
  return '#10B981'
}

function getWardStyle(feature, selectedName) {
  const score = feature.properties.riskScore || 5
  const color = getWardRiskColor(score)
  const isSelected = feature.properties.name === selectedName
  return {
    fillColor: color,
    fillOpacity: isSelected ? 0.55 : 0.28,
    color: isSelected ? color : '#BFDBFE',
    weight: isSelected ? 2.5 : 1,
  }
}

export default function WardLayer({ onWardSelect }) {
  const [selectedWard, setSelectedWard] = useState(null)
  const [key, setKey] = useState(0)
  const [liveWardScores, setLiveWardScores] = useState(null)
  const [liveWardServices, setLiveWardServices] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadWardRisk = async () => {
      try {
        const response = await getWardRisk()
        const payload = response?.data ?? response
        if (!mounted || !payload) return

        if (Array.isArray(payload)) {
          const mapped = payload.reduce((acc, item) => {
            const wardName = item?.ward || item?.name || item?.ward_name
            const wardScore = Number(item?.riskScore ?? item?.score ?? item?.risk)
            if (wardName && Number.isFinite(wardScore)) {
              acc[wardName] = wardScore
            }
            return acc
          }, {})
          setLiveWardScores(Object.keys(mapped).length ? mapped : null)
          return
        }

        if (payload.ward_scores && typeof payload.ward_scores === 'object') {
          setLiveWardScores(payload.ward_scores)
          if (payload.ward_services && typeof payload.ward_services === 'object') {
            setLiveWardServices(payload.ward_services)
          }
          return
        }

        if (typeof payload === 'object') {
          setLiveWardScores(payload)
        }
      } catch {
        // Keep existing GeoJSON ward scores when API is unavailable.
      }
    }

    loadWardRisk()
    return () => { mounted = false }
  }, [])

  const geoJsonData = useMemo(() => {
    if (!liveWardScores) return wardData

    return {
      ...wardData,
      features: wardData.features.map((feature) => {
        const name = feature?.properties?.name
        const liveScore = Number(liveWardScores?.[name])
        const serviceData = liveWardServices?.[name] || {}

        if (!Number.isFinite(liveScore) && !serviceData) return feature

        return {
          ...feature,
          properties: {
            ...feature.properties,
            riskScore: Number.isFinite(liveScore) ? liveScore : feature.properties.riskScore,
            fuelScore: Number.isFinite(Number(serviceData.fuel)) ? Number(serviceData.fuel) : feature.properties.fuelScore,
            foodScore: Number.isFinite(Number(serviceData.food)) ? Number(serviceData.food) : feature.properties.foodScore,
            logisticsScore: Number.isFinite(Number(serviceData.transport)) ? Number(serviceData.transport) : feature.properties.logisticsScore,
            powerScore: Number.isFinite(Number(serviceData.power)) ? Number(serviceData.power) : feature.properties.powerScore,
          },
        }
      }),
    }
  }, [liveWardScores, liveWardServices])

  const handleSelect = (ward) => {
    setSelectedWard(ward)
    setKey(k => k + 1)
    onWardSelect?.(ward)
  }

  return (
    <GeoJSON
      key={key}
      data={geoJsonData}
      style={(feature) => getWardStyle(feature, selectedWard?.name)}
      onEachFeature={(feature, layer) => {
        const props = feature.properties
        layer.on({
          mouseover: (e) => {
            e.target.setStyle({ fillOpacity: 0.6, weight: 2 })
          },
          mouseout: (e) => {
            e.target.setStyle(getWardStyle(feature, selectedWard?.name))
          },
          click: () => {
            handleSelect(props)
          },
        })
        layer.bindTooltip(
          `<div style="font-family:sans-serif;font-size:12px;padding:2px 6px">
            <strong style="color:#0F172A">${props.name}</strong><br/>
            Risk: <span style="color:${getWardRiskColor(props.riskScore)};font-weight:700">${props.riskScore}</span>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        )
      }}
    />
  )
}
