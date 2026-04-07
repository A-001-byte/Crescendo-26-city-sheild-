import React from 'react'
import { useCrisis } from '../../context/CrisisContext'

export default function NewsFeed({ alertBannerText, primaryRiskCategory, recommendationText }) {
  const { events } = useCrisis()

  const feedItems = (events || []).slice(0, 3).map((event, idx) => ({
    id: event.id || `event-${idx}`,
    title: event.title || event.summary || 'Live event update',
    source: event.source || 'Live Feed',
    time: event.published_at ? new Date(event.published_at).toLocaleString('en-IN') : 'Now',
    url: event.url || null,
  }))

  while (feedItems.length < 3) {
    feedItems.push({
      id: `placeholder-${feedItems.length}`,
      title: 'Waiting for live updates...',
      source: 'Live Feed',
      time: 'Now',
      url: null,
    })
  }

  if (alertBannerText) {
    feedItems[0] = { ...feedItems[0], title: alertBannerText }
  }

  if (primaryRiskCategory) {
    const label = String(primaryRiskCategory).charAt(0).toUpperCase() + String(primaryRiskCategory).slice(1)
    feedItems[1] = { ...feedItems[1], title: `Primary Risk: ${label}` }
  }

  if (recommendationText) {
    feedItems[2] = { ...feedItems[2], title: recommendationText }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden isolate rounded-[3rem]">
      <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pr-2">
        {feedItems.map((news, idx) => (
          <div
            key={news.id}
            onClick={() => news.url && window.open(news.url, '_blank', 'noopener,noreferrer')}
            className={`flex flex-row items-center py-3 ${
                idx !== feedItems.length - 1 ? 'border-b border-[#E5E7EB]' : ''
            }`}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 mr-4 bg-slate-100 border border-slate-200 flex items-center justify-center">
              <span className="text-xs font-mono text-slate-500">{news.source.slice(0, 8)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500 mb-1">{news.time}</span>
              <span className="font-semibold text-base sm:text-lg text-gray-900 leading-snug">
                {news.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
