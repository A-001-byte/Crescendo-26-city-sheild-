import { GeoJSON } from 'react-leaflet'
import { useState } from 'react'
import wardData from '../../data/puneWards.geojson'
import { getRiskColor, getRiskLabel } from '../../utils/riskCalculations'

function getWardStyle(feature, selectedName) {
  const score = feature.properties.riskScore || 5
  const color = getRiskColor(score)
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

  const handleSelect = (ward) => {
    setSelectedWard(ward)
    setKey(k => k + 1)
    onWardSelect?.(ward)
  }

  return (
    <GeoJSON
      key={key}
      data={wardData}
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
            Risk: <span style="color:${getRiskColor(props.riskScore)};font-weight:700">${props.riskScore}</span>
          </div>`,
          { sticky: true, className: 'leaflet-tooltip-dark' }
        )
      }}
    />
  )
}
