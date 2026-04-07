import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Map, Bell, BarChart2, Settings,
  Shield, X
} from 'lucide-react'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/map', icon: Map, label: 'Map View' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] pointer-events-auto"
            style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15,23,42,0.25)' }}
          />

          {/* Sidebar Panel */}
          <motion.aside
            key="sidebar"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed top-0 left-0 h-full w-64 z-[9999] pointer-events-auto flex flex-col shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #FFFFFF 0%, #EDF4FF 100%)',
              borderRight: '1px solid #DBEAFE',
            }}
          >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-blue-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading font-bold text-text-primary text-lg tracking-tight">
                  CityShield
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-blue-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 overflow-y-auto">
              <div className="px-3 mb-2">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest px-2">Navigation</span>
              </div>
              <div className="space-y-1 px-2">
                {NAV.map(({ to, icon: Icon, label, exact }) => {
                  const isActive = exact
                    ? location.pathname === to
                    : location.pathname.startsWith(to)
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={() =>
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? 'bg-accent-blue text-white shadow-md shadow-blue-200'
                            : 'text-text-secondary hover:text-text-primary hover:bg-blue-50'
                        }`
                      }
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-accent-blue'}`} />
                      <span className="text-sm font-body font-medium">{label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-xl"
                          style={{ zIndex: -1, background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </nav>

            {/* Status Footer */}
            <div className="px-4 py-4 border-t border-blue-100">
              <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-risk-low flex-shrink-0 animate-pulse" />
                <span className="text-xs text-text-secondary">All Systems Operational</span>
              </div>
              <div className="mt-3 text-center">
                <span className="text-[10px] text-text-muted font-mono">CityShield v1.0 · Pune ICCC</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
