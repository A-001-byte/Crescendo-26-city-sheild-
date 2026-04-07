import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Layers, Droplets, Zap, Building2, Map } from 'lucide-react'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
import WardLayer from './WardLayer'
import HeatmapOverlay from './HeatmapOverlay'
import { getRiskColor, getRiskLabel } from '../../utils/riskCalculations'

// Fix default icon
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow })
L.Marker.mergeOptions({ icon: DefaultIcon })

const LAYER_BUTTONS = [
  { id: 'wards', icon: Map, label: 'Wards' },
  { id: 'fuel', icon: Droplets, label: 'Fuel' },
  { id: 'hospitals', icon: Building2, label: 'Hospitals' },
]

function WardDetailPanel({ ward, onClose }) {
  if (!ward) return null
  const scoreColor = getRiskColor(ward.riskScore)
  const services = [
    { label: 'Fuel', score: ward.fuelScore, color: '#F97316' },
    { label: 'Power', score: ward.powerScore, color: '#FACC15' },
    { label: 'Food', score: ward.foodScore, color: '#22C55E' },
    { label: 'Logistics', score: ward.logisticsScore, color: '#6366F1' },
  ]

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute top-4 right-4 z-[1000] w-72 bg-bg-card border border-border-default rounded-xl shadow-2xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-heading font-bold text-text-primary">{ward.name}</h3>
          <span className="text-xs font-mono" style={{ color: scoreColor }}>
            {getRiskLabel(ward.riskScore)}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Risk Score */}
      <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-bg-elevated">
        <div className="text-3xl font-mono font-bold" style={{ color: scoreColor }}>
          {ward.riskScore?.toFixed(1)}
        </div>
        <div>
          <div className="text-xs text-text-muted">Overall Risk Score</div>
          <div className="text-xs font-mono text-text-secondary">
            Buffer: {ward.bufferHours}h
          </div>
        </div>
      </div>

      {/* Service Scores */}
      <div className="space-y-2 mb-3">
        {services.map(s => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-xs text-text-muted w-16">{s.label}</span>
            <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(s.score / 10) * 100}%`, backgroundColor: s.color }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: s.color }}>{s.score?.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Population', value: (ward.population / 1000).toFixed(0) + 'K' },
          { label: 'Fuel Stations', value: ward.fuelStations },
          { label: 'Hospitals', value: ward.hospitals },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-bg-elevated">
            <div className="text-sm font-mono font-bold text-text-primary">{s.value}</div>
            <div className="text-[10px] text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function CityMap() {
  const [activeLayer, setActiveLayer] = useState('wards')
  const [selectedWard, setSelectedWard] = useState(null)

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[18.5204, 73.8567]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CartoDB"
          subdomains="abcd"
          maxZoom={19}
        />
        {activeLayer === 'wards' && <WardLayer onWardSelect={setSelectedWard} />}
        <HeatmapOverlay activeLayer={activeLayer} />
      </MapContainer>

      {/* Layer Toggle */}
      <div className="absolute top-4 left-4 z-[1000] bg-bg-card border border-border-default rounded-xl shadow-xl p-2 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 px-2 pb-1 border-b border-border-default mb-1">
          <Layers className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider">Layers</span>
        </div>
        {LAYER_BUTTONS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveLayer(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
              activeLayer === id
                ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Legend for wards */}
      {activeLayer === 'wards' && (
        <div className="absolute bottom-8 left-4 z-[1000] bg-bg-card border border-border-default rounded-xl shadow-xl p-3">
          <div className="text-[10px] text-text-muted mb-2 uppercase tracking-wider">Risk Level</div>
          {[
            { label: 'Low (1–3)', color: '#10B981' },
            { label: 'Moderate (4–6)', color: '#F59E0B' },
            { label: 'High (7–8)', color: '#EF4444' },
            { label: 'Critical (9–10)', color: '#DC2626' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: l.color, opacity: 0.7 }} />
              <span className="text-[11px] text-text-secondary">{l.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ward detail panel */}
      <AnimatePresence>
        {selectedWard && (
          <WardDetailPanel ward={selectedWard} onClose={() => setSelectedWard(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
