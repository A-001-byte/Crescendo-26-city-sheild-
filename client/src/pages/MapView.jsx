import CityMap from '../components/map/CityMap'

export default function MapView() {
  return (
    <div style={{ height: 'calc(100vh - 64px)' }}>
      <CityMap />
    </div>
  )
}
