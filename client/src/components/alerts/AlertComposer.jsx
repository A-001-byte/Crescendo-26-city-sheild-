import { useEffect, useMemo, useState } from 'react'
import { dispatchAlert, fetchAlertTemplates, fetchWards } from '../../utils/api'
import { getSeverityColor } from '../../utils/formatters'
import { Send, MessageSquare, Smartphone, Bell, Monitor, AlertTriangle, Info, X, Check } from 'lucide-react'

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

const SMS_API_KEY = import.meta.env.VITE_SMS_API_KEY || ''

const BEHAVIORAL_FRAME = 'Most residents in your area are purchasing normally. Steady purchasing helps ensure supply for everyone.'

export default function AlertComposer() {
  const [wards, setWards] = useState(['All Wards'])
  const [templates, setTemplates] = useState([])
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

  useEffect(() => {
    let mounted = true

    const loadMeta = async () => {
      try {
        const [wardData, templateData] = await Promise.all([fetchWards(), fetchAlertTemplates()])
        if (!mounted) return

        const wardNames = Array.isArray(wardData)
          ? ['All Wards', ...wardData.map((w) => w.name).filter(Boolean)]
          : ['All Wards']
        setWards(Array.from(new Set(wardNames)))

        const flattened = []
        Object.entries(templateData || {}).forEach(([trigger, entry]) => {
          const t = entry?.templates || {}
          Object.entries(t).forEach(([svc, msg]) => {
            if (svc === 'general' || !msg) return
            flattened.push({
              trigger,
              service: svc,
              label: `${svc.toUpperCase()} ${trigger}`,
              message: msg,
            })
          })
        })
        setTemplates(flattened)
      } catch {
        setWards(['All Wards'])
        setTemplates([])
      }
    }

    loadMeta()
    return () => { mounted = false }
  }, [])

  const filteredTemplates = useMemo(
    () => templates.filter((t) => t.service === service),
    [templates, service]
  )

  const MAX_CHARS = 160
  const fullMessage = behaviorFrame && message ? `${message}\n\n${BEHAVIORAL_FRAME}` : message
  const smsPreview = fullMessage.slice(0, 160)
  const waPreview = `*CityShield Alert — ${ward}*\n\n${fullMessage}`

  const handleDispatch = async () => {
    setShowConfirm(false)
    setLoading(true)
    setError(null)
    try {
      await dispatchAlert({
        ward,
        service,
        severity,
        message: fullMessage,
        channels: Object.keys(channels).filter((k) => channels[k]),
        sms_provider: {
          provider: 'cityshield-sms-gateway',
          api_key: SMS_API_KEY,
          send_to: 'all_registered_users',
          recipients_source: 'users.phone_number',
        },
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError('Backend not available')
      setTimeout(() => setError(null), 4000)
    } finally {
      setLoading(false)
    }
  }

  const severityColor = getSeverityColor(severity)

  return (
    <div className="rounded-2xl shadow-lg overflow-hidden h-full flex flex-col" style={{ background: '#FFFFFF', border: '1px solid #DBEAFE' }}>
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #EFF6FF' }}>
        <h3 className="font-heading font-semibold" style={{ color: '#0F172A' }}>Compose Alert</h3>
        <p className="text-xs" style={{ color: '#64748B' }}>Dispatch behaviorally-framed citizen notifications</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Ward */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Target Ward</label>
          <select
            value={ward}
            onChange={e => setWard(e.target.value)}
            className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none transition-colors"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
          >
            {wards.map(w => <option key={w} value={w}>{w}</option>)}
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
                className="px-3 py-1.5 rounded-xl text-xs font-mono border transition-all"
                style={{
                  borderColor: service === s.key ? s.color : '#E2E8F0',
                  backgroundColor: service === s.key ? `${s.color}15` : '#F8FAFC',
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
                    borderColor: isActive ? c : '#E2E8F0',
                    backgroundColor: isActive ? `${c}10` : '#F8FAFC',
                  }}
                >
                  <Icon className="w-4 h-4 mb-1" style={{ color: c }} />
                  <div className="text-xs font-semibold" style={{ color: isActive ? c : '#64748B' }}>{label}</div>
                  <div className="text-[10px]" style={{ color: '#94A3B8' }}>{desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Templates */}
        <div>
          <label className="block text-xs text-text-muted mb-1.5">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            {filteredTemplates.map(t => (
              <button
                key={`${t.service}-${t.trigger}-${t.label}`}
                onClick={() => setMessage(t.message.replace('{ward}', ward).replace('{timestamp}', new Date().toISOString()))}
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
            className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none resize-none transition-colors"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#0F172A' }}
          />
        </div>

        {/* Behavioral Frame */}
        <div>
          <div className="flex items-center justify-between p-3 rounded-xl border" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
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
                  borderColor: channels[key] ? '#3B82F6' : '#E2E8F0',
                  backgroundColor: channels[key] ? '#EFF6FF' : '#F8FAFC',
                  color: channels[key] ? '#3B82F6' : '#64748B',
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
              <div className="p-2.5 rounded-xl border" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                <div className="text-[10px] mb-1" style={{ color: '#94A3B8' }}>SMS (160 chars)</div>
                <p className="text-xs font-mono" style={{ color: '#334155' }}>{smsPreview}</p>
              </div>
              {channels.whatsapp && (
                <div className="p-2.5 rounded-xl border" style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}>
                  <div className="text-[10px] mb-1" style={{ color: '#94A3B8' }}>WhatsApp</div>
                  <p className="text-xs whitespace-pre-wrap" style={{ color: '#334155' }}>{waPreview}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid #EFF6FF' }}>
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
        <div className="rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl" style={{ background: '#FFFFFF', border: '1px solid #DBEAFE' }}>
            <h4 className="font-heading font-bold mb-2" style={{ color: '#0F172A' }}>Confirm Dispatch</h4>
            <p className="text-sm mb-4" style={{ color: '#475569' }}>
              Send <strong style={{ color: severityColor }}>{severity}</strong> alert to <strong>{ward}</strong> via {Object.keys(channels).filter(k => channels[k]).join(', ')}?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl text-sm transition-colors"
                style={{ border: '1px solid #E2E8F0', color: '#64748B', background: '#F8FAFC' }}
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
