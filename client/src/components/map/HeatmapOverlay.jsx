import { CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

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
  { name: 'Ruby Hall Clinic', lat: 18.534, lng: 73.888, priorityLevel: 1, fuelBuffer: 72 },
  { name: 'Sahyadri Hospital', lat: 18.519, lng: 73.851, priorityLevel: 1, fuelBuffer: 48 },
  { name: 'Deenanath Mangeshkar', lat: 18.514, lng: 73.826, priorityLevel: 1, fuelBuffer: 60 },
  { name: 'KEM Hospital', lat: 18.512, lng: 73.858, priorityLevel: 2, fuelBuffer: 36 },
  { name: 'Jehangir Hospital', lat: 18.531, lng: 73.882, priorityLevel: 1, fuelBuffer: 54 },
  { name: 'Sancheti Hospital', lat: 18.527, lng: 73.857, priorityLevel: 2, fuelBuffer: 42 },
  { name: 'Poona Hospital', lat: 18.505, lng: 73.870, priorityLevel: 2, fuelBuffer: 30 },
  { name: 'Aditya Birla', lat: 18.556, lng: 73.812, priorityLevel: 1, fuelBuffer: 66 },
  { name: 'Noble Hospital', lat: 18.496, lng: 73.883, priorityLevel: 2, fuelBuffer: 28 },
  { name: 'Columbia Asia', lat: 18.561, lng: 73.798, priorityLevel: 1, fuelBuffer: 72 },
  { name: 'Inamdar Hospital', lat: 18.503, lng: 73.928, priorityLevel: 2, fuelBuffer: 38 },
  { name: 'Pimpri Civil Hospital', lat: 18.618, lng: 73.808, priorityLevel: 2, fuelBuffer: 24 },
]

const fuelStatusColor = (status) => {
  if (status === 'critical') return '#EF4444'
  if (status === 'low') return '#F59E0B'
  return '#10B981'
}

function createHospitalIcon(priority) {
  return L.divIcon({
    html: `<div style="width:22px;height:22px;background:#1D4ED8;border:2px solid #3B82F6;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;font-family:sans-serif">H</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    className: '',
  })
}

export default function HeatmapOverlay({ activeLayer }) {
  if (activeLayer === 'fuel') {
    return (
      <>
        {FUEL_STATIONS.map((s, i) => (
          <CircleMarker
            key={i}
            center={[s.lat, s.lng]}
            radius={7}
            pathOptions={{
              color: fuelStatusColor(s.status),
              fillColor: fuelStatusColor(s.status),
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'sans-serif', minWidth: 140 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.name}</div>
                <div>Type: {s.type}</div>
                <div>Status: <span style={{ color: fuelStatusColor(s.status), fontWeight: 600 }}>{s.status.toUpperCase()}</span></div>
                <div>Buffer: <strong>{s.bufferHours}h</strong></div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </>
    )
  }

  if (activeLayer === 'hospitals') {
    return (
      <>
        {HOSPITALS.map((h, i) => (
          <Marker
            key={i}
            position={[h.lat, h.lng]}
            icon={createHospitalIcon(h.priorityLevel)}
          >
            <Popup>
              <div style={{ fontFamily: 'sans-serif', minWidth: 150 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{h.name}</div>
                <div>Priority: Level {h.priorityLevel}</div>
                <div>Fuel Buffer: <strong>{h.fuelBuffer}h</strong></div>
              </div>
            </Popup>
          </Marker>
        ))}
      </>
    )
  }

  return null
}
