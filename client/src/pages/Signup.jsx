import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashParticles from '../components/layout/DashParticles'

export default function Signup() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim() || !form.confirmPassword.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setError('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <DashParticles />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-12"
      >
        <section className="order-2 lg:order-1 lg:col-span-8 px-8 lg:px-16 py-12 lg:py-16 flex flex-col justify-between bg-surface-container-lowest">
          <div className="max-w-2xl mt-8 lg:mt-20">
            <p className="text-[10px] uppercase tracking-widest font-extrabold text-secondary mb-6">Classified Interface</p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-[-0.04em] text-primary uppercase leading-[0.95]">
              CITYSHIELD
            </h1>
            <p className="mt-8 text-base md:text-lg text-secondary font-medium">
              Urban Risk Intelligence System
            </p>
            <p className="mt-4 text-sm md:text-base text-secondary max-w-xl">
              Establish authenticated access to operational intelligence feeds, resilience monitoring, and synchronized city risk telemetry.
            </p>
          </div>

          <div className="mt-16 lg:mt-0 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-error live-indicator" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">System Active</span>
          </div>
        </section>

        <section className="order-1 lg:order-2 lg:col-span-4 px-6 sm:px-8 lg:px-10 py-8 lg:py-16 flex items-center justify-center bg-surface-container-low/40">
          <motion.div
            whileTap={{ scale: 0.998 }}
            className="w-full max-w-md glass-panel rounded-[3rem] p-8 lg:p-10 bg-surface-container-lowest/70 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-[-0.04em] text-primary">Create Access</h2>
            <p className="mt-2 text-xs uppercase tracking-widest font-bold text-secondary">Authorized Personnel Only</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="fullName" className="sr-only">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  className="w-full rounded-full px-6 py-4 bg-surface-container-low text-primary placeholder:text-secondary border border-outline-variant/20 focus:outline-none focus:bg-surface-container-lowest transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="w-full rounded-full px-6 py-4 bg-surface-container-low text-primary placeholder:text-secondary border border-outline-variant/20 focus:outline-none focus:bg-surface-container-lowest transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange('password')}
                  className="w-full rounded-full px-6 py-4 bg-surface-container-low text-primary placeholder:text-secondary border border-outline-variant/20 focus:outline-none focus:bg-surface-container-lowest transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className="w-full rounded-full px-6 py-4 bg-surface-container-low text-primary placeholder:text-secondary border border-outline-variant/20 focus:outline-none focus:bg-surface-container-lowest transition-all duration-200"
                />
              </div>

              {error && (
                <p className="text-xs font-bold uppercase tracking-widest text-error">{error}</p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full rounded-full px-6 py-4 bg-primary text-white font-extrabold uppercase tracking-widest text-xs transition-opacity duration-200 hover:opacity-90"
              >
                Create Account
              </motion.button>
            </form>

            <div className="mt-6 text-center text-xs font-bold uppercase tracking-widest text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:opacity-80 transition-opacity">Login</Link>
            </div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  )
}
