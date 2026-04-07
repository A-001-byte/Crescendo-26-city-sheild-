import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const NAV = [
  { to: '/', icon: 'dashboard', label: 'Dashboard', exact: true },
  { to: '/map', icon: 'map', label: 'Map View' },
  { to: '/alerts', icon: 'notifications', label: 'Alerts' },
  { to: '/analytics', icon: 'analytics', label: 'Analytics' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] pointer-events-auto bg-primary/5 backdrop-blur-sm"
          />

          <motion.aside
            key="sidebar"
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="sidebar-active fixed top-0 left-0 h-full w-[340px] flex flex-col glass-panel border-r border-outline-variant/30 z-[100] pointer-events-auto"
          >
            <div className="h-32 flex items-center justify-between px-8 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">Architecture</span>
                <span className="font-extrabold text-primary text-2xl letter-spacing-tight uppercase">
                  CityShield
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <nav className="flex-1 py-8 overflow-y-auto px-6">
              <div className="space-y-4">
                {NAV.map(({ to, icon, label, exact }) => {
                  const isActive = exact
                    ? location.pathname === to
                    : location.pathname.startsWith(to)
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={() =>
                        `relative flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300 group overflow-hidden ${
                          isActive
                            ? 'bg-primary text-white shadow-2xl'
                            : 'bg-surface-container-lowest text-primary border border-outline-variant/30 hover:border-primary'
                        }`
                      }
                    >
                      <span className="text-xs font-extrabold uppercase tracking-widest z-10 mt-0.5">{label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute inset-0 bg-primary z-0"
                          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        />
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </nav>

            <div className="px-8 py-10">
              <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/30 rounded-full px-5 py-4">
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Systems Active</span>
              </div>
              <div className="mt-6 text-center">
                <span className="text-[10px] text-secondary tracking-widest uppercase">Version 2.0</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
