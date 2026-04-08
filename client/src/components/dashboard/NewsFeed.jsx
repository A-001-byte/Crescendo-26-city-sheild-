import { useCrisis } from '../../context/CrisisContext'

const SOURCE_COLORS = ['#ef4444', '#f59e0b', '#3b82f6']

export default function NewsFeed({ alertBannerText, primaryRiskCategory, recommendationText }) {
  const { events } = useCrisis()

  const feedItems = (events || []).slice(0, 3).map((event, idx) => ({
    id: event.id || `event-${idx}`,
    title: event.title || event.summary || 'Live event update',
    source: event.source || 'Live Feed',
    time: event.published_at
      ? new Date(event.published_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })
      : 'Now',
    url: event.url || null,
  }))

  while (feedItems.length < 3) {
    feedItems.push({
      id: `placeholder-${feedItems.length}`,
      title: 'Loading risk data…',
      source: 'Live Feed',
      time: '—',
      url: null,
    })
  }

  if (alertBannerText) feedItems[0] = { ...feedItems[0], title: alertBannerText }
  if (primaryRiskCategory) {
    const label = String(primaryRiskCategory).charAt(0).toUpperCase() + String(primaryRiskCategory).slice(1)
    feedItems[1] = { ...feedItems[1], title: `Primary Risk: ${label}` }
  }
  if (recommendationText) feedItems[2] = { ...feedItems[2], title: recommendationText }

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="space-y-0 divide-y divide-outline-variant/20">
        {feedItems.map((news, idx) => (
          <div
            key={news.id}
            onClick={() => news.url && window.open(news.url, '_blank', 'noopener,noreferrer')}
            className={`flex items-start gap-4 py-4 ${news.url ? 'cursor-pointer' : ''} group`}
          >
            {/* Source color strip */}
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
              style={{ background: SOURCE_COLORS[idx % SOURCE_COLORS.length], minHeight: 32 }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-secondary">
                  {news.source.slice(0, 12)}
                </span>
                <span className="text-[9px] text-secondary opacity-50">{news.time}</span>
              </div>
              <p className="text-sm font-semibold text-primary leading-snug group-hover:opacity-75 transition-opacity">
                {news.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
