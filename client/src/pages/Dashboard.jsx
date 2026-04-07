import { useEffect, useMemo, useState } from 'react'
import { useCrisis } from '../context/CrisisContext'
import CityRiskGauge from '../components/dashboard/CityRiskGauge'
import ServiceCards from '../components/dashboard/ServiceCards'
import RiskTimeline from '../components/dashboard/RiskTimeline'
import NewsFeed from '../components/dashboard/NewsFeed'
import CityMap from '../components/map/CityMap'
import AnimatedCounter from '../components/common/AnimatedCounter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getRiskColor } from '../utils/riskCalculations'
import { getCityRisk } from '../api/riskApi'
import { Shield, Radio, BarChart2, Clock, AlertTriangle } from 'lucide-react'

const STAT_CARDS = [
  { label: 'Active Alerts', value: 12, icon: Shield, color: '#EF4444' },
  { label: 'Zones Monitored', value: 48, icon: Radio, color: '#3B82F6' },
  { label: 'Events Analyzed', value: 1847, icon: BarChart2, color: '#8B5CF6' },
  { label: 'Uptime %', value: 99.7, icon: Clock, color: '#10B981', decimals: 1 },
]

export default function Dashboard() {
  const { score, services, loading, lastUpdated, selectedCity } = useCrisis()
  const [cityRiskData, setCityRiskData] = useState(null)
  const [cityRiskLoading, setCityRiskLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadCityRisk = async () => {
      if (mounted) setCityRiskLoading(true)
      try {
        const data = await getCityRisk(selectedCity)
        if (mounted && data) {
          setCityRiskData(data?.data ?? data)
        }
      } catch {
        // Keep existing context-driven mock/live fallback when API is unavailable.
      } finally {
        if (mounted) setCityRiskLoading(false)
      }
    }

    loadCityRisk()
    return () => { mounted = false }
  }, [selectedCity])

  const normalizedScores = useMemo(() => {
    if (!cityRiskData) return null
    return cityRiskData.scores || cityRiskData.services || cityRiskData
  }, [cityRiskData])

  const apiFuel = Number(normalizedScores?.fuel)
  const apiFood = Number(normalizedScores?.food)
  const apiTransport = Number(normalizedScores?.transport)
  const apiPower = Number(normalizedScores?.power)

  const riskCandidates = [
    { key: 'fuel', value: Number.isFinite(apiFuel) ? apiFuel : null },
    { key: 'food', value: Number.isFinite(apiFood) ? apiFood : null },
    { key: 'transport', value: Number.isFinite(apiTransport) ? apiTransport : null },
    { key: 'power', value: Number.isFinite(apiPower) ? apiPower : null },
  ]
  const validRiskCandidates = riskCandidates.filter((c) => Number.isFinite(c.value))

  const primaryRiskCategory =
    cityRiskData?.primary_risk?.category ||
    (validRiskCandidates.length
      ? [...validRiskCandidates].sort((a, b) => b.value - a.value)[0]?.key
      : undefined)

  const recommendationText =
    cityRiskData?.recommendation ||
    (primaryRiskCategory
      ? `Primary risk is ${primaryRiskCategory}. Prioritize contingency actions for this service.`
      : undefined)

  const alertBannerText = cityRiskData?.alerts?.[0] ||
    (primaryRiskCategory
      ? `Alert: ${primaryRiskCategory} risk is currently the most elevated.`
      : undefined)

  const primaryRiskScore = primaryRiskCategory
    ? riskCandidates.find((s) => s.key === primaryRiskCategory)?.value
    : null

  const primaryRiskColor = Number.isFinite(primaryRiskScore)
    ? getRiskColor(primaryRiskScore)
    : '#64748B'

  const bannerBg = primaryRiskColor === '#DC2626' ? '#FEE2E2' : primaryRiskColor === '#EAB308' ? '#FEF9C3' : '#DCFCE7'
  const bannerTextColor = primaryRiskColor === '#DC2626' ? '#7F1D1D' : primaryRiskColor === '#EAB308' ? '#713F12' : '#14532D'

  const resolvedScore = Number.isFinite(Number(cityRiskData?.score))
    ? Number(cityRiskData.score)
    : score

  const resolvedServices = {
    ...services,
    fuel: {
      ...(services?.fuel || {}),
      score: Number.isFinite(apiFuel) ? apiFuel : services?.fuel?.score,
    },
    food: {
      ...(services?.food || {}),
      score: Number.isFinite(apiFood) ? apiFood : services?.food?.score,
    },
    logistics: {
      ...(services?.logistics || {}),
      score: Number.isFinite(apiTransport) ? apiTransport : services?.logistics?.score,
    },
    power: {
      ...(services?.power || {}),
      score: Number.isFinite(apiPower) ? apiPower : services?.power?.score,
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full">
      <div className="w-full border px-4 py-3 flex items-center gap-2" style={{ background: bannerBg, borderColor: primaryRiskColor, color: bannerTextColor }}>
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm font-bold">{alertBannerText || '⚠️ High Fuel Risk in Kothrud'}</span>
      </div>

      <div className="w-full border px-4 py-4 shadow-sm" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
        <div className="text-sm uppercase tracking-wide font-semibold text-text-muted mb-1">PRIMARY RISK</div>
        <div className="text-3xl font-bold" style={{ color: primaryRiskColor }}>
          Primary Risk: {primaryRiskCategory ? `${primaryRiskCategory.charAt(0).toUpperCase()}${primaryRiskCategory.slice(1)}` : 'Fuel'}
        </div>
      </div>

      <div className="w-full border px-4 py-3 shadow-sm" style={{ background: '#EFF6FF', borderColor: '#E2E8F0' }}>
        <span className="text-sm uppercase tracking-wide font-semibold text-text-primary">RECOMMENDED ACTION: </span>
        <span className="text-sm text-text-secondary">{recommendationText || 'Avoid unnecessary travel'}</span>
      </div>

      {/* Quick Stats Section */}
      <div className="w-full bg-slate-50 border border-border-default p-4 z-0 relative shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ label, value, icon: Icon, color, decimals }) => (
            <div
              key={label}
              className="p-3.5 flex items-center gap-3 border border-gray-100"
            >
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <div className="text-xl font-mono font-bold text-gray-900">
                  <AnimatedCounter value={value} decimals={decimals || 0} />
                </div>
                <div className="text-sm text-gray-500 font-semibold tracking-wide uppercase">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gauge and Service Cards Section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 z-0 relative">
        <div className="col-span-1 lg:col-span-4 bg-blue-50 border border-border-default p-4 flex flex-col relative z-0 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">CITY RISK SCORE</span>
            {lastUpdated && (
              <span className="text-[10px] font-mono text-gray-400">
                Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
              </span>
            )}
          </div>
          <div className="flex-1 min-h-[200px]">
            {cityRiskLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <CityRiskGauge score={resolvedScore} />
            )}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-8 bg-slate-50 border border-border-default p-4 relative z-0 shadow-sm">
          <ServiceCards data={resolvedServices} />
        </div>
      </div>

      {/* Timeline & News Feed Section */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 z-0 relative">
        <div className="col-span-1 lg:col-span-8 bg-slate-50 border border-border-default p-4 flex flex-col relative z-0 min-h-[350px] shadow-sm">
          <RiskTimeline />
        </div>
        <div className="col-span-1 lg:col-span-4 relative z-0 flex flex-col">
          <NewsFeed
            alertBannerText={alertBannerText}
            primaryRiskCategory={primaryRiskCategory}
            recommendationText={recommendationText}
          />
        </div>
      </div>

      {/* Map Component Fix */}
      <div className="w-full bg-slate-50 border border-border-default p-4 relative z-0 shadow-sm">
        <div className="w-full h-[500px] overflow-hidden relative z-0 border border-border-default">
          <CityMap />
        </div>
      </div>
    </div>
  )
}
