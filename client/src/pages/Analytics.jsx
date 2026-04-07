import NLPInsights from '../components/analytics/NLPInsights'
import TrendCharts from '../components/analytics/TrendCharts'

export default function Analytics() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="col-span-1 lg:col-span-8 space-y-4">
          <NLPInsights />
        </div>
        <div className="col-span-1 lg:col-span-4 overflow-y-visible lg:overflow-y-auto lg:h-[calc(100vh-96px)]">
          <TrendCharts />
        </div>
      </div>
    </div>
  )
}
