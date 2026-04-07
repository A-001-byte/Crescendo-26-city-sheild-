import { useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Shield } from 'lucide-react'
import { useCrisis } from '../../context/CrisisContext'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/map': 'Map View',
  '/alerts': 'Alerts & Dispatch',
  '/analytics': 'Analytics & Intelligence',
  '/settings': 'Settings',
}

export default function Header({ onToggleSidebar }) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'CityShield'
  const { wsConnected, alerts, selectedCity, setSelectedCity, demoActive } = useCrisis()

  const CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik']
  const activeAlerts = alerts?.filter(a => a.severity === 'high' || a.severity === 'critical').length || 0

  const wsColor = wsConnected ? '#10B981' : '#EF4444'
  const wsLabel = wsConnected ? 'Live' : 'Offline'

  return (
    <header className="h-16 flex items-center px-5 gap-4 bg-bg-secondary border-b border-border-default flex-shrink-0 shadow-sm relative z-10">
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-accent-blue hover:bg-bg-elevated transition-colors flex items-center gap-2 group"
      >
        <Shield className="w-6 h-6 text-accent-blue group-hover:scale-110 transition-transform duration-200" />
      </button>

      {/* Page Title */}
      <div className="flex items-center gap-2 flex-shrink-0 border-l border-border-default pl-4">
        <h1 className="font-heading font-semibold text-text-primary text-base">{title}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
        {/* Demo Mode Badge */}
        {demoActive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-risk-high/50 bg-risk-high/10 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-risk-high" />
            <span className="text-[10px] font-mono font-bold text-risk-high tracking-widest">DEMO</span>
          </div>
        )}
        {/* WS Status */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: wsColor, boxShadow: `0 0 6px ${wsColor}` }}
          />
          <span className="text-xs text-text-muted font-mono">{wsLabel}</span>
        </div>

        {/* City Selector */}
        <div className="relative">
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="appearance-none bg-bg-elevated border border-border-default text-text-secondary text-sm rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:border-border-active cursor-pointer"
          >
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors">
          <Bell className="w-5 h-5" />
          {activeAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-risk-high flex items-center justify-center text-[9px] font-mono text-white font-bold">
              {activeAlerts > 9 ? '9+' : activeAlerts}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-accent-blue/20 border border-accent-blue/40 flex items-center justify-center text-accent-blue text-xs font-bold font-mono">
          IC
        </div>
      </div>
    </header>
  )
}
