import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CrisisProvider } from '../../context/CrisisContext'
import Sidebar from './Sidebar'
import Header from './Header'
import DashParticles from './DashParticles'

function LayoutInner() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`relative min-h-screen ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <DashParticles />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-col flex-1 min-w-0 min-h-screen relative z-10 w-full no-scrollbar">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 pb-32 overflow-y-auto dashboard-scroll snap-y snap-proximity">
          <AnimatePresence mode="wait">
            <motion.div
              layout
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default function MainLayout() {
  return (
    <CrisisProvider>
      <LayoutInner />
    </CrisisProvider>
  )
}
