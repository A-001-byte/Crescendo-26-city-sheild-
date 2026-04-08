import { GeoJSON } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import wardData from '../../data/puneWards.geojson'
import { getWardRisk } from '../../api/riskApi'

function getWardRiskColor(score) {
  const s = Number(score)
  if (!Number.isFinite(s)) return '#EAB308'
  if (s <= 3) return '#16A34A'
  if (s <= 7) return '#EAB308'
  return '#DC2626'
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
        const wardResponse = await getWardRisk()
        const wardScores = wardResponse?.scores || {}

        if (!mounted) return

        const scores = {}
        const services = {}

        Object.entries(wardScores).forEach(([name, data]) => {
          const fuel = Number(data?.fuel)
          const food = Number(data?.food)
          const transport = Number(data?.transport)
          const power = Number(data?.power)
          const vals = [fuel, food, transport, power].filter((v) => Number.isFinite(v))
          const score = vals.length ? vals.reduce((sum, v) => sum + v, 0) / vals.length : null

          if (Number.isFinite(score)) {
            scores[name] = score
          }

          services[name] = {
            fuel,
            food,
            transport,
            power,
          }
        })

        setLiveWardScores(Object.keys(scores).length ? scores : null)
        setLiveWardServices(Object.keys(services).length ? services : null)
      } catch {
        setLiveWardScores(null)
        setLiveWardServices(null)
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
        const hasServiceData = Object.values(serviceData).some((v) => Number.isFinite(Number(v)))

        if (!Number.isFinite(liveScore) && !hasServiceData) return feature

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

  const handleSelect = (ward, e) => {
    setSelectedWard(ward)
    setKey(k => k + 1)
    onWardSelect?.(ward, e)
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
          click: (e) => {
            handleSelect(props, e)
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
