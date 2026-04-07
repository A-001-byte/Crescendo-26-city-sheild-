import React from 'react'

const MOCK_NEWS = [
  {
    id: 1,
    title: "Noida Expressway becoming NCR's new luxury belt",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&h=100&q=80",
    time: "Apr 07, 2026 13:43 IST"
  },
  {
    id: 2,
    title: "Smart city initiatives push tech integration forward",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=100&h=100&q=80",
    time: "Apr 07, 2026 12:15 IST"
  },
  {
    id: 3,
    title: "Traffic patterns indicate a shift towards public transport",
    image: "https://images.unsplash.com/photo-1558237255-ed19a27c7d4a?auto=format&fit=crop&w=100&h=100&q=80",
    time: "Apr 07, 2026 10:05 IST"
  }
]

export default function NewsFeed({ alertBannerText, primaryRiskCategory, recommendationText }) {
  const feedItems = [...MOCK_NEWS]

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
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ background: '#FFFFFF', border: '1px solid #DBEAFE', boxShadow: '0 2px 16px rgba(59,130,246,0.07)' }}
    >
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #EFF6FF' }}
      >
        <h3 className="font-heading font-bold text-sm" style={{ color: '#0F172A' }}>News Feed</h3>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{ background: '#EFF6FF', color: '#3B82F6' }}
        >
          {feedItems.length} updates
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
          {feedItems.map((news, idx) => (
          <div
            key={news.id}
            onClick={() => window.open('#', '_blank')}
            className={`flex flex-row items-center cursor-pointer transition-colors hover:bg-blue-50 py-3 ${
                idx !== feedItems.length - 1 ? 'border-b border-[#E5E7EB]' : ''
            }`}
          >
            <img 
              src={news.image} 
              alt="news thumbnail" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0 mr-4 shadow-sm"
            />
            <div className="flex flex-col" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
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
