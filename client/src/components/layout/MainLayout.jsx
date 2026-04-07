import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CrisisProvider } from '../../context/CrisisContext'
import Sidebar from './Sidebar'
import Header from './Header'

function LayoutInner() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto graph-paper-bg"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
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
