import NLPInsights from '../components/analytics/NLPInsights'
import SupplyChainFlow from '../components/analytics/SupplyChainFlow'
import TrendCharts from '../components/analytics/TrendCharts'

export default function Analytics() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <NLPInsights />
          <SupplyChainFlow />
        </div>
        <div className="col-span-4" style={{ height: 'calc(100vh - 96px)', overflowY: 'auto' }}>
          <TrendCharts />
        </div>
      </div>
    </div>
  )
}
