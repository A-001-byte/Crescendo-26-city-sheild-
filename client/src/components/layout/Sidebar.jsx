import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Map, Bell, BarChart2, Settings, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import Tooltip from '../common/Tooltip'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/map', icon: Map, label: 'Map View' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full flex flex-col bg-bg-secondary border-r border-border-default flex-shrink-0 overflow-hidden"
      style={{ minWidth: collapsed ? 72 : 260 }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border-default flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-accent-blue" />
          </div>
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            transition={{ duration: 0.2 }}
            className="font-heading font-bold text-text-primary text-lg overflow-hidden whitespace-nowrap"
          >
            CityShield
          </motion.span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {NAV.map(({ to, icon: Icon, label, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <Tooltip key={to} content={collapsed ? label : null}>
                <NavLink
                  to={to}
                  className={() =>
                    `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group w-full ${
                      isActive
                        ? 'bg-bg-elevated text-text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50'
                    }`
                  }
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent-blue rounded-r-full" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent-blue' : ''}`} />
                  <motion.span
                    animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-body font-medium overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                </NavLink>
              </Tooltip>
            )
          })}
        </div>
      </nav>

      {/* Status */}
      <div className="border-t border-border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-risk-low flex-shrink-0 animate-pulse" />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            transition={{ duration: 0.2 }}
            className="text-xs text-text-muted overflow-hidden whitespace-nowrap"
          >
            All Systems Operational
          </motion.span>
        </div>
      </div>

      {/* Toggle */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border-default text-text-muted hover:text-text-primary hover:border-border-active transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
            transition={{ duration: 0.2 }}
            className="text-xs overflow-hidden whitespace-nowrap"
          >
            Collapse
          </motion.span>
        </button>
      </div>
    </motion.aside>
  )
}
