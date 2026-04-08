import CityMap from '../features/map/CityMap'

export default function MapView() {
  return (
    <div className="page-shell h-full">
      <div className="panel-soft overflow-hidden" style={{ height: 'calc(100vh - 120px)', minHeight: 520 }}>
        <CityMap />
      </div>
    </div>
  )
}
