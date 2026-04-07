import { useEffect, useRef } from 'react'
import { CircleMarker, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

const FUEL_STATIONS = [
  { name: 'HP Kothrud', lat: 18.510, lng: 73.815, type: 'HPCL', status: 'normal', bufferHours: 52 },
  { name: 'BP Shivajinagar', lat: 18.530, lng: 73.852, type: 'BPCL', status: 'low', bufferHours: 18 },
  { name: 'IOC Hadapsar', lat: 18.504, lng: 73.944, type: 'IOC', status: 'critical', bufferHours: 8 },
  { name: 'HP Aundh', lat: 18.562, lng: 73.810, type: 'HPCL', status: 'normal', bufferHours: 67 },
  { name: 'BP Baner', lat: 18.558, lng: 73.785, type: 'BPCL', status: 'normal', bufferHours: 71 },
  { name: 'IOC Hinjewadi', lat: 18.590, lng: 73.735, type: 'IOC', status: 'low', bufferHours: 24 },
  { name: 'HP Wakad', lat: 18.598, lng: 73.755, type: 'HPCL', status: 'normal', bufferHours: 60 },
  { name: 'BP Pimpri', lat: 18.619, lng: 73.800, type: 'BPCL', status: 'normal', bufferHours: 44 },
  { name: 'IOC Chinchwad', lat: 18.640, lng: 73.793, type: 'IOC', status: 'low', bufferHours: 20 },
  { name: 'HP Kharadi', lat: 18.548, lng: 73.952, type: 'HPCL', status: 'normal', bufferHours: 50 },
  { name: 'BP Viman Nagar', lat: 18.567, lng: 73.915, type: 'BPCL', status: 'normal', bufferHours: 64 },
  { name: 'IOC Koregaon Park', lat: 18.540, lng: 73.892, type: 'IOC', status: 'normal', bufferHours: 78 },
  { name: 'HP Swargate', lat: 18.497, lng: 73.862, type: 'HPCL', status: 'critical', bufferHours: 11 },
  { name: 'BP Katraj', lat: 18.462, lng: 73.868, type: 'BPCL', status: 'critical', bufferHours: 9 },
  { name: 'IOC Deccan', lat: 18.518, lng: 73.843, type: 'IOC', status: 'low', bufferHours: 22 },
  { name: 'HP Hadapsar 2', lat: 18.513, lng: 73.956, type: 'HPCL', status: 'normal', bufferHours: 41 },
  { name: 'BP Baner 2', lat: 18.564, lng: 73.778, type: 'BPCL', status: 'normal', bufferHours: 68 },
  { name: 'IOC Pimpri 2', lat: 18.625, lng: 73.815, type: 'IOC', status: 'low', bufferHours: 19 },
  { name: 'HP Kothrud 2', lat: 18.505, lng: 73.808, type: 'HPCL', status: 'normal', bufferHours: 55 },
  { name: 'BP Wakad 2', lat: 18.603, lng: 73.762, type: 'BPCL', status: 'normal', bufferHours: 59 },
]

const HOSPITALS = [
  { name: 'Ruby Hall Clinic', lat: 18.534, lng: 73.888, priorityLevel: 1, fuelBuffer: 72, riskLevel: 'Low' },
  { name: 'Sahyadri Hospital', lat: 18.519, lng: 73.851, priorityLevel: 1, fuelBuffer: 48, riskLevel: 'Moderate' },
  { name: 'Deenanath Mangeshkar', lat: 18.514, lng: 73.826, priorityLevel: 1, fuelBuffer: 60, riskLevel: 'Low' },
  { name: 'KEM Hospital', lat: 18.512, lng: 73.858, priorityLevel: 2, fuelBuffer: 36, riskLevel: 'Moderate' },
  { name: 'Jehangir Hospital', lat: 18.531, lng: 73.882, priorityLevel: 1, fuelBuffer: 54, riskLevel: 'Low' },
  { name: 'Sancheti Hospital', lat: 18.527, lng: 73.857, priorityLevel: 2, fuelBuffer: 42, riskLevel: 'Low' },
  { name: 'Poona Hospital', lat: 18.505, lng: 73.870, priorityLevel: 2, fuelBuffer: 30, riskLevel: 'High' },
  { name: 'Aditya Birla', lat: 18.556, lng: 73.812, priorityLevel: 1, fuelBuffer: 66, riskLevel: 'Low' },
  { name: 'Noble Hospital', lat: 18.496, lng: 73.883, priorityLevel: 2, fuelBuffer: 28, riskLevel: 'High' },
  { name: 'Columbia Asia', lat: 18.561, lng: 73.798, priorityLevel: 1, fuelBuffer: 72, riskLevel: 'Low' },
  { name: 'Inamdar Hospital', lat: 18.503, lng: 73.928, priorityLevel: 2, fuelBuffer: 38, riskLevel: 'Moderate' },
  { name: 'Pimpri Civil Hospital', lat: 18.618, lng: 73.808, priorityLevel: 2, fuelBuffer: 24, riskLevel: 'Critical' },
]

// Intensity based on fuel criticality: lower buffer = higher heat
const fuelStatusIntensity = (status) => {
  if (status === 'critical') return 1.0
  if (status === 'low') return 0.55
  return 0.15
}

// Leaflet.heat layer component (renders directly into the map)
function FuelHeatLayer() {
  const map = useMap()
  const heatRef = useRef(null)

  useEffect(() => {
    const points = FUEL_STATIONS.map(s => [
      s.lat,
      s.lng,
      fuelStatusIntensity(s.status),
    ])

    heatRef.current = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: {
        0.0: 'transparent',
        0.3: 'rgba(251,146,60,0.6)',   // orange — low risk
        0.6: 'rgba(239,68,68,0.8)',    // red — high risk
        1.0: '#7F1D1D',               // dark red — critical
      },
    })
    heatRef.current.addTo(map)

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
      }
    }
  }, [map])

  return null
}

function createHospitalIcon(priority, riskLevel) {
  const bg = priority === 1 ? '#1D4ED8' : '#0369A1'
  return L.divIcon({
    html: `<div style="width:26px;height:26px;background:${bg};border:2.5px solid #93C5FD;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;font-family:sans-serif;box-shadow:0 2px 8px rgba(59,130,246,0.4)">H</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    className: '',
  })
}

function HospitalTooltipMarker({ h }) {
  const tooltipContent = `
    <div style="font-family:sans-serif;min-width:160px;padding:2px">
      <div style="font-weight:700;font-size:13px;color:#0F172A;margin-bottom:4px">${h.name}</div>
      <div style="font-size:11px;color:#475569;margin-bottom:2px">Priority Level: <strong>${h.priorityLevel}</strong></div>
      <div style="font-size:11px;color:#475569;margin-bottom:2px">Risk: <strong style="color:${
        h.riskLevel === 'Low' ? '#10B981' : h.riskLevel === 'Moderate' ? '#F59E0B' : h.riskLevel === 'High' ? '#EF4444' : '#7F1D1D'
      }">${h.riskLevel}</strong></div>
      <div style="font-size:11px;color:#475569">Fuel Buffer: <strong>${h.fuelBuffer}h</strong></div>
    </div>
  `

  return (
    <Marker
      position={[h.lat, h.lng]}
      icon={createHospitalIcon(h.priorityLevel, h.riskLevel)}
      eventHandlers={{
        mouseover: (e) => {
          e.target.openTooltip()
        },
        mouseout: (e) => {
          e.target.closeTooltip()
        },
      }}
    >
      {/* Using ref-based tooltip via bindTooltip is handled inside onEachFeature;
          for Markers we use the Leaflet API directly */}
    </Marker>
  )
}

export default function HeatmapOverlay({ activeLayer }) {
  const map = useMap()

  // Bind hover tooltips for hospitals using useEffect
  useEffect(() => {
    if (activeLayer !== 'hospitals') return
    // Tooltip binding is handled per-marker below
  }, [activeLayer, map])

  if (activeLayer === 'fuel') {
    return <FuelHeatLayer />
  }

  if (activeLayer === 'hospitals') {
    return (
      <>
        {HOSPITALS.map((h, i) => {
          const riskColor =
            h.riskLevel === 'Low' ? '#10B981'
            : h.riskLevel === 'Moderate' ? '#F59E0B'
            : h.riskLevel === 'High' ? '#EF4444'
            : '#7F1D1D'

          const tooltipHtml = `
            <div style="font-family:sans-serif;min-width:160px">
              <div style="font-weight:700;font-size:13px;color:#0F172A;margin-bottom:4px">${h.name}</div>
              <div style="font-size:11px;color:#475569;margin-bottom:2px">Priority Level <strong>${h.priorityLevel}</strong></div>
              <div style="font-size:11px;margin-bottom:2px">Risk: <strong style="color:${riskColor}">${h.riskLevel}</strong></div>
              <div style="font-size:11px;color:#475569">⛽ Fuel Buffer: <strong>${h.fuelBuffer}h</strong></div>
            </div>
          `

          return (
            <HospitalMarkerWithTooltip
              key={i}
              h={h}
              tooltipHtml={tooltipHtml}
            />
          )
        })}
      </>
    )
  }

  return null
}

// Separate component so we can use useMap inside it
function HospitalMarkerWithTooltip({ h, tooltipHtml }) {
  const map = useMap()
  const markerRef = useRef(null)

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    const leafletMarker = marker

    // Manually bind hover tooltip
    if (leafletMarker?.bindTooltip) {
      leafletMarker.bindTooltip(tooltipHtml, {
        permanent: false,
        direction: 'top',
        offset: [0, -16],
        className: 'leaflet-tooltip-dark',
        opacity: 0.97,
      })
    }
  }, [tooltipHtml])

  return (
    <Marker
      ref={markerRef}
      position={[h.lat, h.lng]}
      icon={createHospitalIcon(h.priorityLevel, h.riskLevel)}
    />
  )
}
