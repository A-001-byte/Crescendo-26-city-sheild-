import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, LayoutDashboard, Map, Bell, BarChart3, Settings, CloudLightning, ArrowLeftRight } from 'lucide-react'
import { useCrisis } from '../../context/CrisisContext'

const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik']

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/map', icon: Map, label: 'Map View' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/disruptions', icon: CloudLightning, label: 'Disruptions' },
  { to: '/compare', icon: ArrowLeftRight, label: 'City Compare' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { selectedCity, setSelectedCity } = useCrisis()
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
            className="sidebar-active fixed top-0 left-0 h-full w-[88vw] max-w-[340px] flex flex-col glass-panel border-r border-outline-variant/30 z-[100] pointer-events-auto"
          >
            <div className="h-24 sm:h-28 lg:h-32 flex items-center justify-between px-5 sm:px-6 lg:px-8 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">Architecture</span>
                <span className="font-extrabold text-primary text-xl sm:text-2xl letter-spacing-tight uppercase">
                  CityShield
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close sidebar"
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 sm:px-6 lg:px-8">
              <div className="relative border border-outline-variant/40 rounded-full overflow-hidden bg-surface-container-lowest">
                <label htmlFor="sidebar-city-select" className="sr-only">City</label>
                <select
                  id="sidebar-city-select"
                  aria-label="City"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full appearance-none bg-transparent font-bold uppercase tracking-widest text-xs px-4 sm:px-5 py-2.5 sm:py-3 text-primary focus:outline-none"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            <nav className="flex-1 py-6 sm:py-8 overflow-y-auto px-4 sm:px-5 lg:px-6">
              <div className="space-y-3 sm:space-y-4">
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
                        `relative flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-full transition-all duration-300 group overflow-hidden ${
                          isActive
                            ? 'bg-primary text-white shadow-2xl'
                            : 'bg-surface-container-lowest text-primary border border-outline-variant/30 hover:border-primary'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 z-10 flex-shrink-0" />
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

            <div className="px-5 sm:px-6 lg:px-8 py-7 sm:py-10">
              <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/30 rounded-full px-4 sm:px-5 py-3 sm:py-4">
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
