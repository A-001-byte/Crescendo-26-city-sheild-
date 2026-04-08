import AlertComposer from '../components/alerts/AlertComposer'
import AlertHistory from '../components/alerts/AlertHistory'

export default function Alerts() {
  return (
    <div className="page-shell h-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
        <div className="col-span-1 lg:col-span-5 relative panel-soft p-3" style={{ minHeight: 520, height: 'calc(100vh - 120px)' }}>
          <AlertComposer />
        </div>
        <div className="col-span-1 lg:col-span-7 panel-soft p-3" style={{ minHeight: 520, height: 'calc(100vh - 120px)' }}>
          <AlertHistory />
        </div>
      </div>
    </div>
  )
}
