import { useState, useEffect } from 'react'
import { fetchSignals, fetchLatestEvents } from '../../utils/api'
import { formatRelativeTime, truncate } from '../../utils/formatters'
import { getSeverityColor } from '../../utils/formatters'
import StatusBadge from '../common/StatusBadge'
import sampleEvents from '../../data/sampleEvents.json'

const FALLBACK_SIGNALS = {
  fuel: 0.73,
  power: 0.45,
  food: 0.52,
  logistics: 0.38,
}

const SERVICE_COLORS = {
  fuel: '#F97316',
  power: '#FACC15',
  food: '#22C55E',
  logistics: '#6366F1',
}

function SentimentBar({ value }) {
  // value: -1 to 1 (negative = bad, positive = good)
  const pct = ((value + 1) / 2) * 100
  const color = value < -0.3 ? '#EF4444' : value > 0.3 ? '#10B981' : '#F59E0B'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-bg-primary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{value.toFixed(2)}</span>
    </div>
  )
}

export default function NLPInsights() {
  const [events, setEvents] = useState(sampleEvents)
  const [signals, setSignals] = useState(FALLBACK_SIGNALS)

  useEffect(() => {
    fetchLatestEvents(20).then(d => { if (d?.length) setEvents(d) }).catch(() => {})
    fetchSignals().then(d => { if (d) setSignals(d) }).catch(() => {})
  }, [])

  const enrichedEvents = events.map(e => ({
    ...e,
    sentiment: e.combined_severity ? -(e.combined_severity * 2 - 1) : (Math.random() * 2 - 1) * 0.8,
  }))

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
                <th className="text-left px-4 py-2.5 text-text-muted font-normal w-28">Sentiment</th>
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
                    <SentimentBar value={e.sentiment} />
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
