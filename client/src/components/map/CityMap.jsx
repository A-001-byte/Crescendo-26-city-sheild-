import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import WardLayer from './WardLayer'
import HeatmapOverlay from './HeatmapOverlay'
import { getRiskColor } from '../../utils/riskCalculations'

// Fix default icon
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow })
L.Marker.mergeOptions({ icon: DefaultIcon })

const LAYER_BUTTONS = [
  { id: 'wards', icon: 'map', label: 'Wards' },
  { id: 'fuel', icon: 'local_gas_station', label: 'Fuel' },
  { id: 'hospitals', icon: 'local_hospital', label: 'Hospitals' },
]

function WardDetailPanel({ ward, onClose, position, mapRect }) {
  if (!ward) return null
  const scoreColor = getRiskColor(ward.riskScore)
  const services = [
    { label: 'Fuel', score: ward.fuelScore, color: '#ba1a1a' },
    { label: 'Power', score: ward.powerScore, color: '#000000' },
    { label: 'Food', score: ward.foodScore, color: '#00397e' },
    { label: 'Logistics', score: ward.logisticsScore, color: '#5e5e5f' },
  ]
  
  // Calculate bounds to prevent overflow (popup ~ 320x450 roughly)
  const popupWidth = 320;
  const popupHeight = 450;
  let left = 16;
  let top = 16;
  
  if (position && mapRect) {
    // JS Viewport clamping logic
    left = Math.max(16, Math.min(position.x, mapRect.width - popupWidth - 16));
    top = Math.max(16, Math.min(position.y, mapRect.height - popupHeight - 16));
  }

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      style={{ left, top, width: popupWidth }}
      className="absolute z-[30] p-8 shadow-2xl bg-surface-container-lowest rounded-[3rem] border border-outline-variant/30"
    >
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary mb-1">Ward Matrix</span>
          <h3 className="font-extrabold text-2xl letter-spacing-tight uppercase text-primary">{ward.name}</h3>
        </div>
        <button aria-label="Close detail panel" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low hover:bg-outline-variant/30 transition-colors text-primary">
          <span aria-hidden="true" className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {/* Risk Score */}
      <div className="flex items-center gap-6 mb-8 p-4 bg-surface-container-low rounded-[2rem]">
        <div className="text-5xl font-extrabold letter-spacing-tight" style={{ color: scoreColor }}>
          {ward.riskScore?.toFixed(1)}
        </div>
        <div className="flex flex-col">
          <div className="text-[10px] uppercase tracking-widest font-extrabold text-secondary">Aggregate Score</div>
          <div className="text-xs font-bold text-primary mt-1">
            BUFFER: {ward.bufferHours}H
          </div>
        </div>
      </div>

      {/* Service Scores */}
      <div className="space-y-4 mb-8">
        {services.map(s => (
          <div key={s.label} className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary w-16">{s.label}</span>
            <div className="flex-1 h-[2px] bg-outline-variant/30 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(s.score / 10) * 100}%`, backgroundColor: s.color }}
              />
            </div>
            <span className="text-[10px] font-extrabold text-primary">{s.score?.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pop.', value: (ward.population / 1000).toFixed(0) + 'K' },
          { label: 'Fuel', value: ward.fuelStations },
          { label: 'Clinical', value: ward.hospitals },
        ].map(s => (
          <div key={s.label} className="text-center p-3 bg-surface-container-low rounded-[1.5rem]">
            <div className="text-lg font-extrabold text-primary letter-spacing-tight">{s.value}</div>
            <div className="text-[9px] uppercase font-bold tracking-widest text-secondary mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function CityMap() {
  const [activeLayer, setActiveLayer] = useState('wards')
  const [selectedWard, setSelectedWard] = useState(null)
  const [mapRect, setMapRect] = useState(null)

  const handleWardSelect = (ward, e) => {
    const clientX = e?.originalEvent?.clientX ?? 0
    const clientY = e?.originalEvent?.clientY ?? 0
    const rect = e?.originalEvent?.target?.closest('.map-container')?.getBoundingClientRect()
      ?? { left: 0, top: 0, width: 1200, height: 600 }
    const x = clientX - rect.left
    const y = clientY - rect.top
    setMapRect(rect)
    setSelectedWard({ ward, position: { x, y } })
  }

  return (
    <div className="relative h-full w-full overflow-hidden isolate map-wrapper">
      <MapContainer
        center={[18.5204, 73.8567]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="map-container"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CartoDB"
          className="grayscale opacity-50"
        />
        {activeLayer === 'wards' && <WardLayer onWardSelect={handleWardSelect} />}
        <HeatmapOverlay activeLayer={activeLayer} />
      </MapContainer>

      {/* Layer Toggle */}
      <div 
        className="absolute z-[20] flex flex-col gap-2 glass-panel rounded-full p-2 items-center shadow-lg border border-outline-variant/30"
        style={{ top: '1rem', right: '1rem', maxWidth: 'calc(100% - 2rem)' }}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-container-lowest text-primary">
          <span className="material-symbols-outlined text-sm">layers</span>
        </div>
        <div className="w-[1px] h-6 bg-outline-variant/40 mx-1"></div>
        {LAYER_BUTTONS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveLayer(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${
              activeLayer === id
                ? 'bg-primary text-white scale-105 shadow-md'
                : 'bg-transparent text-primary hover:bg-surface-container-low border border-transparent hover:border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: activeLayer === id ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Legend for wards */}
      {activeLayer === 'wards' && (
        <div className="absolute bottom-6 left-6 z-[20] glass-panel rounded-[2rem] p-6 shadow-lg border border-outline-variant/30">
          <div className="text-[10px] mb-4 uppercase tracking-widest font-extrabold text-secondary">Risk Matrix</div>
          {[
            { label: 'Low', color: getRiskColor(2) },
            { label: 'Medium', color: getRiskColor(4) },
            { label: 'High', color: getRiskColor(8) },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-3 mb-2 last:mb-0">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color, opacity: 0.8 }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ward detail panel */}
      <AnimatePresence>
        {selectedWard && (
          <WardDetailPanel ward={selectedWard.ward} position={selectedWard.position} mapRect={mapRect} onClose={() => setSelectedWard(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
