import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCrisis } from '../../context/CrisisContext'

export default function GlobalEventTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const ctx = useCrisis()
  const newsList = (ctx?.events || []).slice(0, 4).map((e, i) => ({
    id: e.id || i,
    title: e.title || e.summary || 'Risk update',
    time: e.published_at ? new Date(e.published_at).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'Now',
  }))

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(newsList.length, 1))
    }, 4500)
    return () => clearInterval(timer)
  }, [newsList.length])

  const currentNews = newsList.length
    ? newsList[currentIndex]
    : { id: 'no-events', title: 'Loading risk data...', time: 'Now' }

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
            <div className="w-12 h-12 rounded-md flex-shrink-0 mr-3 hidden sm:flex shadow-sm bg-blue-100 items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-blue-700">LIVE</span>
            </div>
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
