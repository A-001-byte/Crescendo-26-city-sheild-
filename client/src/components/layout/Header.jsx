import { useCrisis } from '../../context/CrisisContext'
import { Link, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'

function useAuthUser() {
  try {
    const token = localStorage.getItem('cityshield_auth_token')
    const raw = localStorage.getItem('cityshield_auth_user')
    if (!token) return null
    const user = raw ? JSON.parse(raw) : null
    const display =
      user?.fullName ||
      user?.identity?.split('@')[0] ||
      user?.email?.split('@')[0] ||
      'Admin'
    return display
  } catch {
    return null
  }
}

export default function Header({ onToggleSidebar }) {
  const { feedOnline, demoActive } = useCrisis()
  const navigate = useNavigate()
  const authUser = useAuthUser()

  const handleLogout = () => {
    localStorage.removeItem('cityshield_auth_token')
    localStorage.removeItem('cityshield_auth_user')
    navigate('/login')
  }

  return (
    <header className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 lg:pt-12 pb-4 sm:pb-6 lg:pb-8 flex items-center justify-between glass-panel sticky top-0 z-[50] isolate backdrop-blur-[24px]">
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </button>
        <div className="flex flex-col min-w-0">
          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-secondary opacity-60">District Intelligence</span>
          <h1 className="text-xl sm:text-2xl lg:text-5xl font-extrabold letter-spacing-tight uppercase text-primary tracking-tighter truncate">CITYSHIELD</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Live status pill */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full">
          <span className={`w-2 h-2 rounded-full ${demoActive || feedOnline ? 'bg-error live-indicator' : 'bg-outline-variant'}`} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary hidden sm:block">
            {demoActive ? 'Simulation' : feedOnline ? 'Live Feed Active' : 'Offline'}
          </span>
        </div>

        {authUser ? (
          <>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-secondary hidden sm:block">
              {authUser}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-full border border-outline-variant text-[10px] font-extrabold uppercase tracking-widest text-primary hover:bg-surface-container-low transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-[10px] font-extrabold uppercase tracking-widest text-secondary hover:text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 lg:py-3 rounded-full bg-primary text-white text-[10px] font-extrabold uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
