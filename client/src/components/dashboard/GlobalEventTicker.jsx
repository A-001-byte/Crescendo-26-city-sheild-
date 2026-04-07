import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCrisis } from '../../context/CrisisContext'

const MOCK_NEWS = [
  { id: 1, title: 'Strait of Hormuz tensions rising: Brent Crude up +3.2%', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&h=100&q=80', time: '10 mins ago' },
  { id: 2, title: 'India Grid Load drops to 203 GW: Back in Normal Range', img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=100&h=100&q=80', time: '25 mins ago' },
  { id: 3, title: 'Black Sea corridor update: Wheat futures push +1.8%', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=100&h=100&q=80', time: '1 hr ago' },
  { id: 4, title: 'Shipping disruptions hit Red Sea: Freight costs jump 12%', img: 'https://images.unsplash.com/photo-1558237255-ed19a27c7d4a?auto=format&fit=crop&w=100&h=100&q=80', time: '2 hrs ago' },
]

export default function GlobalEventTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Use either context events or mock news
  const ctx = useCrisis()
  let newsList = MOCK_NEWS
  
  if (ctx?.events?.length) {
    newsList = ctx.events.slice(0, 4).map((e, i) => ({
      id: e.id || i,
      title: e.title,
      img: MOCK_NEWS[i % MOCK_NEWS.length].img,
      time: 'Just now'
    }))
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsList.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [newsList.length])

  const currentNews = newsList[currentIndex]

  return (
    <div
      className="flex flex-1 mx-4 rounded-lg px-3 py-1.5 items-center relative overflow-hidden"
      style={{ maxWidth: 560, background: '#DBEAFE' }}
    >
      <span
        className="text-xs font-mono font-bold flex-shrink-0 uppercase tracking-widest px-2 py-0.5 rounded-full z-10 mr-4"
        style={{
          color: '#1D4ED8',
          background: '#BFDBFE',
          animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        }}
      >
        LIVE
      </span>
      
      <div className="relative flex-1 h-[48px] overflow-hidden flex items-center">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentNews.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="flex items-center w-full"
          >
            <img 
              src={currentNews.img} 
              alt="news thumbnail"
              className="w-12 h-12 object-cover rounded-md flex-shrink-0 mr-3 hidden sm:block shadow-sm"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span 
                className="text-sm font-bold truncate block"
                style={{ color: '#1E3A5F' }}
              >
                {currentNews.title}
              </span>
              <span className="text-[10px] font-mono text-blue-500 uppercase tracking-wide">
                {currentNews.time}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
