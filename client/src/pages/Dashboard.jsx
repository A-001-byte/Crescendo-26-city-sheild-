import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, AlertCircle, Radar, Activity, Timer } from 'lucide-react'
import { useCrisis } from '../context/CrisisContext'
import CityRiskGauge from '../components/dashboard/CityRiskGauge'
import ServiceCards from '../components/dashboard/ServiceCards'
import RiskTimeline from '../components/dashboard/RiskTimeline'
import NewsFeed from '../components/dashboard/NewsFeed'
import AnimatedCounter from '../components/common/AnimatedCounter'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getCityRisk } from '../api/riskApi'

const STAT_CARDS = [
  { label: 'Active Alerts', icon: AlertCircle, color: 'text-error' },
  { label: 'Zones Monitored', icon: Radar, color: 'text-primary' },
  { label: 'Prediction Confidence', icon: Activity, color: 'text-primary' },
  { label: 'Live Feed', icon: Timer, color: 'text-tertiary-container' },
]

export default function Dashboard() {
  const { score, services, loading, lastUpdated, selectedCity, wards, feedOnline } = useCrisis()
  const [cityRiskData, setCityRiskData] = useState(null)
  const [cityRiskLoading, setCityRiskLoading] = useState(true)
  const [cityRiskError, setCityRiskError] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadCityRisk = async () => {
      if (mounted) setCityRiskLoading(true)
      if (mounted) setCityRiskError(false)
      try {
        const data = await getCityRisk(selectedCity)
        if (mounted && data) {
          setCityRiskData(data?.data ?? data)
        }
      } catch {
        if (mounted) setCityRiskError(true)
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

  const resolvedRecommendationText =
    cityRiskData?.recommendation ||
    (primaryRiskCategory
      ? `Primary risk is ${primaryRiskCategory}. Prioritize contingency actions for this service.`
      : cityRiskError
        ? `Monitoring ${selectedCity} with baseline signals. Continue observing service stability.`
        : 'Monitoring live risk signals and service resilience.')

  const resolvedAlertBannerText = cityRiskData?.alerts?.[0] ||
    (primaryRiskCategory
      ? `Alert: ${primaryRiskCategory} risk is currently the most elevated.`
      : cityRiskError
        ? `Live risk feed for ${selectedCity} is temporarily unavailable.`
        : `Live risk feed active for ${selectedCity}.`)

  const candidateScore = cityRiskData?.score ?? cityRiskData?.overall_crs
  const resolvedScore = Number.isFinite(Number(candidateScore))
    ? Number(candidateScore)
    : score

  const prediction48h = cityRiskData?.prediction_48h || {}
  const predictionSummary = cityRiskData?.prediction_summary || {}
  const confidence = cityRiskData?.confidence || 'unknown'

  const statsValues = {
    'Active Alerts': Array.isArray(cityRiskData?.alerts) ? cityRiskData.alerts.length : 0,
    'Zones Monitored': Array.isArray(wards) ? wards.length : 0,
    'Prediction Confidence': String(confidence).toUpperCase(),
    'Live Feed': feedOnline ? 'ONLINE' : 'OFFLINE',
  }

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
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <div className="text-sm font-semibold text-secondary">Loading risk data...</div>
        </div>
      </div>
    )
  }

  if (cityRiskError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-base font-semibold text-error">Backend not available</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-16 px-8 py-10 w-full">
      <motion.section
        className="w-full snap-start scroll-section"
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest rounded-[3rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="w-full flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-error" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary">{resolvedAlertBannerText}</span>
              </div>

              <div className="w-full space-y-1 mt-6">
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-secondary">PRIMARY RISK MATRIX</div>
                <div className="text-4xl lg:text-7xl font-extrabold letter-spacing-tight uppercase text-primary">
                  {primaryRiskCategory ? `${primaryRiskCategory}` : 'System Overview'}
                </div>
              </div>

              <div className="w-full space-y-1 mt-6">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-primary">RECOMMENDED ACTION: </span>
                <span className="text-sm font-medium text-secondary">{resolvedRecommendationText}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-end">
            <div className="bg-surface-container-lowest rounded-[2rem] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] aspect-square w-full max-w-[300px] self-start">
              <div className="grid grid-cols-2 gap-3 h-full">
                {STAT_CARDS.map(({ label, icon: Icon, color, decimals }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-3 bg-surface-container-low rounded-[1.5rem] p-3"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-extrabold letter-spacing-tight text-primary">
                        {typeof statsValues[label] === 'number'
                          ? <AnimatedCounter value={statsValues[label]} decimals={decimals || 0} />
                          : <span>{statsValues[label]}</span>}
                      </div>
                      <div className="text-[10px] text-secondary font-bold tracking-widest uppercase">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 z-0 relative snap-start scroll-section"
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="col-span-1 lg:col-span-4 flex flex-col relative z-0">
              <div className="flex items-center justify-between mb-8">
                <span className="text-[10px] font-extrabold text-secondary uppercase tracking-widest">CITY RISK SCORE</span>
                {lastUpdated && (
                  <span className="text-[10px] font-mono text-tertiary-container font-bold">
                    UPDATED {new Date(lastUpdated).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-[200px] flex items-center justify-center bg-surface-container-low rounded-[3rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                {cityRiskLoading ? (
                  <LoadingSpinner size="md" />
                ) : (
                  <CityRiskGauge score={resolvedScore} />
                )}
              </div>
            </div>

            <div className="col-span-1 lg:col-span-8 relative z-0 flex flex-col justify-center bg-surface-container-lowest rounded-[3rem] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] min-w-0 overflow-hidden">
              <ServiceCards data={resolvedServices} />
            </div>
          </div>

          <div className="flex flex-col relative z-0 min-h-[320px]">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary mb-6">Historical Anomaly Trajectory</span>
            <div className="flex-1 bg-surface-container-low rounded-[3rem] p-8 overflow-hidden relative shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
               <RiskTimeline />
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 relative z-0 flex flex-col gap-8 lg:sticky lg:top-28 self-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary mb-6">Global Briefing</span>
            <div className="bg-surface-container-lowest rounded-[3rem] p-6 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <NewsFeed
                alertBannerText={resolvedAlertBannerText}
                primaryRiskCategory={primaryRiskCategory}
                recommendationText={resolvedRecommendationText}
              />
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="w-full snap-start scroll-section"
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="bg-surface-container-lowest rounded-[3rem] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-[10px] uppercase tracking-widest font-extrabold text-secondary mb-4">48-Hour Forecast</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'fuel', label: 'Fuel' },
              { key: 'food', label: 'Food' },
              { key: 'transport', label: 'Transport' },
              { key: 'power', label: 'Power' },
            ].map((item) => {
              const trend = String(predictionSummary[item.key] || 'stable').toLowerCase()
              const arrow = trend.includes('increase') ? '↑' : trend.includes('decrease') ? '↓' : '→'
              const score = Number(prediction48h[item.key])
              return (
                <div key={item.key} className="bg-surface-container-low rounded-[1.5rem] p-4">
                  <div className="text-sm font-bold text-primary">{item.label} {'->'} {trend.replace('_', ' ')} {arrow}</div>
                  <div className="text-xs text-secondary mt-1">Projected score: {Number.isFinite(score) ? score.toFixed(1) : 'N/A'}</div>
                </div>
              )
            })}
          </div>
          <div className="text-xs text-secondary mt-4">Confidence: {String(confidence).toUpperCase()}</div>
        </div>
      </motion.section>

    </div>
  )
}
