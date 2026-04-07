import { useState, useEffect } from 'react'
import { fetchSignals, fetchLatestEvents } from '../../utils/api'
import { formatRelativeTime, truncate } from '../../utils/formatters'
import StatusBadge from '../common/StatusBadge'

const SERVICE_COLORS = {
  fuel: '#F97316',
  power: '#FACC15',
  food: '#22C55E',
  logistics: '#6366F1',
}

function CredibilityBar({ confidence, label }) {
  // confidence = probability this article is real news (from BERT)
  // label = 'REAL' | 'FAKE' — what BERT classified it as
  if (confidence == null) {
    return <span className="text-[10px] text-text-muted font-mono">—</span>
  }
  // credibility = how likely the article is genuine news (0–100%)
  const credibility = label === 'REAL' ? confidence : 1 - confidence
  const pct = credibility * 100
  const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444'
  const tag = pct >= 80 ? 'Credible' : pct >= 50 ? 'Uncertain' : 'Unreliable'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-[10px] font-mono w-8 text-right" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>{tag}</span>
    </div>
  )
}

export default function NLPInsights() {
  const [events, setEvents] = useState([])
  const [signals, setSignals] = useState({ fuel: 0, power: 0, food: 0, logistics: 0 })

  useEffect(() => {
    fetchLatestEvents(20).then(d => { if (Array.isArray(d)) setEvents(d) }).catch(() => {})
    fetchSignals().then(d => { if (d) setSignals(d) }).catch(() => {})
  }, [])

  const enrichedEvents = events

  return (
    <div className="space-y-4">
      {/* Signal Strength Bars */}
      <div className="bg-bg-card border border-border-default rounded-xl p-4 shadow-lg">
        <h3 className="font-heading font-semibold text-text-primary text-sm mb-4">Signal Strength by Service</h3>
        <div className="space-y-3">
          {Object.entries(signals).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-20 capitalize">{key}</span>
              <div className="flex-1 h-3 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${val * 100}%`, backgroundColor: SERVICE_COLORS[key] }}
                />
              </div>
              <span className="text-xs font-mono w-10 text-right" style={{ color: SERVICE_COLORS[key] }}>
                {(val * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-bg-card border border-border-default rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default">
          <h3 className="font-heading font-semibold text-text-primary text-sm">Analyzed Events</h3>
          <p className="text-xs text-text-muted mt-0.5">NLP-processed geopolitical signals</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left px-4 py-2.5 text-text-muted font-normal">Time</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-normal">Source</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-normal">Headline</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-normal w-28">Credibility</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-normal">Severity</th>
                <th className="text-left px-4 py-2.5 text-text-muted font-normal">Services</th>
              </tr>
            </thead>
            <tbody>
              {enrichedEvents.map((e) => (
                <tr key={e.id} className="border-b border-border-default/50 hover:bg-bg-elevated/40 transition-colors">
                  <td className="px-4 py-2.5 text-text-muted font-mono whitespace-nowrap">
                    {formatRelativeTime(e.published_at)}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary whitespace-nowrap">{e.source}</td>
                  <td className="px-4 py-2.5 text-text-primary max-w-xs">
                    {truncate(e.title, 60)}
                  </td>
                  <td className="px-4 py-2.5 w-28">
                    <CredibilityBar confidence={e.bert_confidence} label={e.bert_label} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge severity={e.severity} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(e.affected_services || []).map(s => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                          style={{ backgroundColor: `${SERVICE_COLORS[s]}20`, color: SERVICE_COLORS[s] }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
