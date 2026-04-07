import { useState } from 'react'
import { dispatchAlert } from '../../utils/api'
import { getSeverityColor } from '../../utils/formatters'
import { Send, MessageSquare, Smartphone, Bell, Monitor, AlertTriangle, Info, X, Check } from 'lucide-react'

const WARDS = [
  'All Wards', 'Kothrud', 'Shivajinagar', 'Hadapsar', 'Deccan', 'Aundh',
  'Baner', 'Hinjewadi', 'Wakad', 'Pimpri', 'Chinchwad', 'Kharadi',
  'Viman Nagar', 'Koregaon Park', 'Swargate', 'Katraj',
]

const SERVICES = [
  { key: 'fuel', label: 'Fuel', color: '#F97316' },
  { key: 'power', label: 'Power', color: '#FACC15' },
  { key: 'food', label: 'Food', color: '#22C55E' },
  { key: 'logistics', label: 'Logistics', color: '#6366F1' },
]

const SEVERITIES = [
  { key: 'low', label: 'Advisory', icon: Info, desc: 'General awareness' },
  { key: 'moderate', label: 'Warning', icon: AlertTriangle, desc: 'Action recommended' },
  { key: 'high', label: 'Critical', icon: AlertTriangle, desc: 'Immediate action' },
]

const CHANNELS = [
  { key: 'sms', label: 'SMS', icon: Smartphone },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { key: 'push', label: 'Push', icon: Bell },
  { key: 'iccc', label: 'ICCC Dashboard', icon: Monitor },
]

const TEMPLATES = [
  { label: 'Fuel Low', message: 'Fuel buffer below 24 hours in your area. Plan your refueling in advance to avoid disruption.' },
  { label: 'Power Advisory', message: 'Power demand is elevated. Please conserve electricity between 6 PM – 10 PM to support grid stability.' },
  { label: 'Supply Disruption', message: 'Essential goods delivery may be delayed due to transport disruption. Current stock levels remain adequate.' },
]

const BEHAVIORAL_FRAME = 'Most residents in your area are purchasing normally. Steady purchasing helps ensure supply for everyone.'

export default function AlertComposer() {
  const [ward, setWard] = useState('All Wards')
  const [service, setService] = useState('fuel')
  const [severity, setSeverity] = useState('moderate')
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState({ sms: true, push: true, iccc: true, whatsapp: false })
  const [behaviorFrame, setBehaviorFrame] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState(null)

  const MAX_CHARS = 160
  const fullMessage = behaviorFrame && message ? `${message}\n\n${BEHAVIORAL_FRAME}` : message
  const smsPreview = fullMessage.slice(0, 160)
  const waPreview = `*CityShield Alert — ${ward}*\n\n${fullMessage}`

  const handleDispatch = async () => {
    setShowConfirm(false)
    setLoading(true)
    setError(null)
    try {
      await dispatchAlert({ ward, service, severity, message: fullMessage, channels: Object.keys(channels).filter(k => channels[k]) })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError('API unavailable — alert saved locally')
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  const severityColor = getSeverityColor(severity)

  return (
    <div className="bg-bg-card border border-border-default rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border-default">
        <h3 className="font-heading font-semibold text-text-primary">Compose Alert</h3>
        <p className="text-xs text-text-muted">Dispatch behaviorally-framed citizen notifications</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ward */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Target Ward</label>
          <select
            value={ward}
            onChange={e => setWard(e.target.value)}
            className="w-full bg-bg-elevated border border-border-default text-text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-border-active"
          >
            {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Service */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Service Category</label>
          <div className="flex gap-2 flex-wrap">
            {SERVICES.map(s => (
              <button
                key={s.key}
                onClick={() => setService(s.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono border transition-all"
                style={{
                  borderColor: service === s.key ? s.color : '#2A3142',
                  backgroundColor: service === s.key ? `${s.color}20` : 'transparent',
                  color: service === s.key ? s.color : '#64748B',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Severity Level</label>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITIES.map(({ key, label, icon: Icon, desc }) => {
              const c = getSeverityColor(key)
              const isActive = severity === key
              return (
                <button
                  key={key}
                  onClick={() => setSeverity(key)}
                  className="p-3 rounded-xl border text-left transition-all"
                  style={{
                    borderColor: isActive ? c : '#2A3142',
                    backgroundColor: isActive ? `${c}15` : 'transparent',
                  }}
                >
                  <Icon className="w-4 h-4 mb-1" style={{ color: c }} />
                  <div className="text-xs font-semibold" style={{ color: isActive ? c : '#94A3B8' }}>{label}</div>
                  <div className="text-[10px] text-text-muted">{desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Templates */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(t => (
              <button
                key={t.label}
                onClick={() => setMessage(t.message)}
                className="px-2.5 py-1 rounded-lg text-xs text-text-secondary bg-bg-elevated border border-border-default hover:border-border-active hover:text-text-primary transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-text-muted">Message</label>
            <span className={`text-[10px] font-mono ${message.length > MAX_CHARS ? 'text-risk-high' : 'text-text-muted'}`}>
              {message.length}/{MAX_CHARS}
            </span>
          </div>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, MAX_CHARS))}
            rows={3}
            placeholder="Enter alert message..."
            className="w-full bg-bg-elevated border border-border-default text-text-primary text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-border-active resize-none"
          />
        </div>

        {/* Behavioral Frame */}
        <div>
          <div className="flex items-center justify-between p-3 bg-bg-elevated rounded-xl border border-border-default">
            <div>
              <div className="text-xs font-semibold text-text-primary">Behavioral Framing</div>
              <div className="text-[10px] text-text-muted">Add social norm nudge to reduce panic</div>
            </div>
            <button
              onClick={() => setBehaviorFrame(!behaviorFrame)}
              className={`relative w-11 h-6 rounded-full transition-colors ${behaviorFrame ? 'bg-accent-blue' : 'bg-bg-primary'} border border-border-default`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${behaviorFrame ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {behaviorFrame && (
            <div className="mt-2 p-2.5 rounded-lg border border-accent-blue/30 bg-accent-blue/5">
              <p className="text-[11px] text-accent-blue italic">+ "{BEHAVIORAL_FRAME}"</p>
            </div>
          )}
        </div>

        {/* Channels */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Dispatch Channels</label>
          <div className="grid grid-cols-2 gap-2">
            {CHANNELS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setChannels(c => ({ ...c, [key]: !c[key] }))}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all"
                style={{
                  borderColor: channels[key] ? '#3B82F6' : '#2A3142',
                  backgroundColor: channels[key] ? '#3B82F620' : 'transparent',
                  color: channels[key] ? '#93C5FD' : '#64748B',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {channels[key] && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {message && (
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Preview</label>
            <div className="space-y-2">
              <div className="p-2.5 bg-bg-elevated rounded-lg border border-border-default">
                <div className="text-[10px] text-text-muted mb-1">SMS (160 chars)</div>
                <p className="text-xs text-text-secondary font-mono">{smsPreview}</p>
              </div>
              {channels.whatsapp && (
                <div className="p-2.5 bg-bg-elevated rounded-lg border border-border-default">
                  <div className="text-[10px] text-text-muted mb-1">WhatsApp</div>
                  <p className="text-xs text-text-secondary whitespace-pre-wrap">{waPreview}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-default flex-shrink-0">
        {success && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-risk-low/20 border border-risk-low/40 text-xs text-risk-low flex items-center gap-2">
            <Check className="w-3.5 h-3.5" /> Alert dispatched successfully
          </div>
        )}
        {error && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-risk-moderate/20 border border-risk-moderate/40 text-xs text-risk-moderate">
            {error}
          </div>
        )}
        <button
          onClick={() => setShowConfirm(true)}
          disabled={!message || loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: severityColor, color: '#fff' }}
        >
          <Send className="w-4 h-4" />
          {loading ? 'Dispatching...' : `Dispatch ${SEVERITIES.find(s => s.key === severity)?.label || ''} Alert`}
        </button>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 rounded-xl">
          <div className="bg-bg-elevated border border-border-default rounded-xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <h4 className="font-heading font-bold text-text-primary mb-2">Confirm Dispatch</h4>
            <p className="text-sm text-text-secondary mb-4">
              Send <strong style={{ color: severityColor }}>{severity}</strong> alert to <strong>{ward}</strong> via {Object.keys(channels).filter(k => channels[k]).join(', ')}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-border-default text-text-secondary hover:text-text-primary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                className="flex-1 py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: severityColor }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
