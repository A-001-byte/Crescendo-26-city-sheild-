import AlertComposer from '../components/alerts/AlertComposer'
import AlertHistory from '../components/alerts/AlertHistory'

export default function Alerts() {
  return (
    <div className="p-4 h-full">
      <div className="grid grid-cols-12 gap-4 h-full">
        <div className="col-span-5 relative" style={{ height: 'calc(100vh - 96px)' }}>
          <AlertComposer />
        </div>
        <div className="col-span-7" style={{ height: 'calc(100vh - 96px)' }}>
          <AlertHistory />
        </div>
      </div>
    </div>
  )
}
