import { useEffect, useState } from 'react'
import { CircleMarker, Popup } from 'react-leaflet'
import { fetchInfrastructure } from '../../utils/api'

export default function HeatmapOverlay({ activeLayer }) {
  const [infra, setInfra] = useState({ fuelStations: [], hospitals: [] })

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const data = await fetchInfrastructure()
        if (!mounted) return
        setInfra({
          fuelStations: Array.isArray(data?.fuelStations) ? data.fuelStations : [],
          hospitals: Array.isArray(data?.hospitals) ? data.hospitals : [],
        })
      } catch {
        if (!mounted) return
        setInfra({ fuelStations: [], hospitals: [] })
      }
    }

    if (activeLayer === 'fuel' || activeLayer === 'hospitals') {
      load()
    }

    return () => { mounted = false }
  }, [activeLayer])

  if (activeLayer === 'fuel') {
    return (
      <>
        {infra.fuelStations
          .filter((p) => Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lng)))
          .map((p) => (
            <CircleMarker
              key={p.id || `${p.name}-${p.lat}-${p.lng}`}
              center={[Number(p.lat), Number(p.lng)]}
              radius={p.operational ? 6 : 4}
              pathOptions={{
                color: p.operational ? '#F97316' : '#94A3B8',
                fillColor: p.operational ? '#FB923C' : '#CBD5E1',
                fillOpacity: 0.75,
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">{p.name}</div>
                  <div>Type: {p.type || 'NA'}</div>
                  <div>Status: {p.operational ? 'Operational' : 'Offline'}</div>
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
        {infra.hospitals
          .filter((h) => Number.isFinite(Number(h?.lat)) && Number.isFinite(Number(h?.lng)))
          .map((h) => (
            <CircleMarker
              key={h.id || `${h.name}-${h.lat}-${h.lng}`}
              center={[Number(h.lat), Number(h.lng)]}
              radius={Math.max(5, Math.min(11, Number(h.beds || 100) / 80))}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#60A5FA',
                fillOpacity: 0.7,
                weight: 1,
              }}
            >
              <Popup>
                <div className="text-xs">
                  <div className="font-semibold">{h.name}</div>
                  <div>Beds: {h.beds || 'NA'}</div>
                  <div>Backup Fuel: {h.backup_fuel_hours || 0}h</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </>
    )
  }

  return null
}
