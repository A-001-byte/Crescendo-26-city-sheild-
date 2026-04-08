import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import LoginBackground from '../components/layout/LoginBackground'
import { signupUser } from '../utils/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim()
    ) {
      setError('Please fill in all required fields.')
      return
    }
    if (!EMAIL_REGEX.test(form.email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await signupUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })

      const token = response?.token || response?.access_token || response?.accessToken
      const user = response?.user || {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
      }
      if (token) localStorage.setItem('cityshield_auth_token', token)
      localStorage.setItem('cityshield_auth_user', JSON.stringify(user))
      setError('')
      navigate('/')
    } catch (err) {
      setError(err?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#06060e' }}
    >
      <LoginBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-12"
      >
        {/* ── Left: branding ── */}
        <section className="order-2 lg:order-1 lg:col-span-8 px-8 lg:px-16 py-12 lg:py-16 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
            className="max-w-2xl mt-8 lg:mt-24"
          >
            <p
              className="text-[10px] uppercase tracking-[0.25em] font-extrabold mb-6"
              style={{ color: 'rgba(96,165,250,0.65)' }}
            >
              Classified Interface
            </p>

            <h1
              className="text-5xl md:text-7xl lg:text-[6.5rem] font-extrabold tracking-[-0.04em] uppercase leading-[0.92]"
              style={{ color: '#ffffff' }}
            >
              CITY
              <span style={{ color: '#60a5fa' }}>SHIELD</span>
            </h1>

            <div className="mt-6 h-px w-16" style={{ background: 'rgba(96,165,250,0.35)' }} />

            <p
              className="mt-6 text-base md:text-lg font-semibold"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Urban Risk Intelligence System
            </p>
            <p
              className="mt-3 text-sm md:text-base max-w-xl leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.28)' }}
            >
              Establish authenticated access to operational intelligence feeds,
              resilience monitoring, and synchronized city risk telemetry.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {['Fuel Monitor', 'Transport Intel', 'Food Security', 'Power Grid'].map((label) => (
                <span
                  key={label}
                  className="text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(96,165,250,0.07)',
                    border: '1px solid rgba(96,165,250,0.18)',
                    color: 'rgba(96,165,250,0.65)',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 lg:mt-0 flex items-center gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-error live-indicator" />
            <span
              className="text-[10px] font-extrabold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              System Active
            </span>
          </motion.div>
        </section>

        {/* ── Right: form ── */}
        <section
          className="order-1 lg:order-2 lg:col-span-4 px-6 sm:px-8 lg:px-10 py-8 lg:py-16 flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.018)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="auth-scanline" />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm relative"
          >
            <div
              className="rounded-[2rem] p-8 lg:p-9"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,165,250,0.06)',
              }}
            >
              <div className="mb-7">
                <h2
                  className="text-2xl font-extrabold tracking-[-0.03em]"
                  style={{ color: '#ffffff' }}
                >
                  Create Access
                </h2>
                <p
                  className="mt-1.5 text-[10px] uppercase tracking-[0.2em] font-bold"
                  style={{ color: 'rgba(96,165,250,0.6)' }}
                >
                  Authorized Personnel Only
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  className="dark-input w-full rounded-full px-5 py-3.5 text-sm font-medium"
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="dark-input w-full rounded-full px-5 py-3.5 text-sm font-medium"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange('password')}
                  className="dark-input w-full rounded-full px-5 py-3.5 text-sm font-medium"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className="dark-input w-full rounded-full px-5 py-3.5 text-sm font-medium"
                />

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-bold uppercase tracking-widest text-error pt-1"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full px-5 py-3.5 font-extrabold uppercase tracking-widest text-xs mt-1 transition-opacity duration-200"
                  style={{
                    background: loading
                      ? 'rgba(96,165,250,0.4)'
                      : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                    color: '#06060e',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(96,165,250,0.35)',
                  }}
                >
                  {loading ? 'Creating Access…' : 'Create Account'}
                </motion.button>
              </form>

              <div className="mt-5 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Already have access?{' '}
                <Link
                  to="/login"
                  className="transition-opacity hover:opacity-70"
                  style={{ color: '#60a5fa' }}
                >
                  Login
                </Link>
              </div>
            </div>

            <div
              className="absolute -inset-px rounded-[2rem] pointer-events-none"
              style={{ boxShadow: '0 0 60px rgba(96,165,250,0.08)' }}
            />
          </motion.div>
        </section>
      </motion.div>
    </div>
  )
}
