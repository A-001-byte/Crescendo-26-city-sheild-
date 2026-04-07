import { GeoJSON } from 'react-leaflet'
import { useEffect, useMemo, useState } from 'react'
import wardData from '../../data/puneWards.geojson'
import { getWardRisk } from '../../api/riskApi'
import { getRiskColor } from '../../utils/riskCalculations'

function getWardRiskColor(score) {
  return getRiskColor(score)
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
        const wardNames = wardData.features
          .map((feature) => feature?.properties?.name)
          .filter(Boolean)

        const wardResponses = await Promise.all(
          wardNames.map(async (name) => ({ name, data: await getWardRisk(name) }))
        )

        if (!mounted) return

        const scores = {}
        const services = {}

        wardResponses.forEach(({ name, data }) => {
          const score = Number(data?.score)
          if (Number.isFinite(score)) {
            scores[name] = score
          }

          services[name] = {
            fuel: Number(data?.services?.fuel),
            food: Number(data?.services?.food),
            transport: Number(data?.services?.transport),
            power: Number(data?.services?.power),
          }
        })

        setLiveWardScores(Object.keys(scores).length ? scores : null)
        setLiveWardServices(Object.keys(services).length ? services : null)
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
