import { useCrisis } from '../../context/CrisisContext'
import { Link } from 'react-router-dom'

export default function Header({ onToggleSidebar }) {
  const { wsConnected, demoActive } = useCrisis()

  return (
    <header className="px-8 pt-12 pb-8 flex items-center justify-between glass-panel sticky top-0 z-[50] isolate backdrop-blur-[24px]">
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-primary">menu</span>
        </button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-60">District Intelligence</span>
          <h1 className="text-3xl md:text-5xl font-extrabold letter-spacing-tight uppercase text-primary tracking-tighter">CITYSHIELD</h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Global Status Pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full">
          <span className={`w-2 h-2 rounded-full ${demoActive || wsConnected ? 'bg-error live-indicator' : 'bg-outline-variant'}`}></span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary hidden sm:inline-flex items-center gap-2">
            {demoActive ? 'SIMULATION' : (wsConnected ? 'LIVE FEED ACTIVE' : 'OFFLINE')}
          </span>
        </div>

        <Link
          to="/login"
          className="text-[10px] font-extrabold uppercase tracking-widest text-secondary hover:text-primary transition-colors"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="px-5 py-3 rounded-full bg-primary text-white text-[10px] font-extrabold uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          Sign Up
        </Link>
      </div>
    </header>
  )
}
