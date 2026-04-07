import { useCrisis } from '../../context/CrisisContext'

const HARDCODED = [
  "🛢️ Brent Crude +3.2% — Strait of Hormuz tensions rising",
  "⚡ India Grid Load: 203 GW — Normal Range",
  "🌾 Wheat futures +1.8% — Black Sea corridor update",
  "🚢 Shipping disruption in Red Sea — 12% freight increase",
  "🇮🇳 India crude import at 85% dependency — OMC advance payments activated",
  "⚠️ Maharashtra transport strike — freight delays expected 24–48h",
  "🔋 Solar generation record: 210 GW from western India",
  "🌡️ Pune ambient temp 38°C — power demand spike forecast",
]

export default function GlobalEventTicker() {
  let events = []
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useCrisis()
    if (ctx?.events?.length) {
      events = ctx.events.slice(0, 8).map(e => e.title)
    }
  } catch {
    events = HARDCODED
  }

  const items = events.length ? events : HARDCODED
  // Duplicate for seamless loop
  const all = [...items, ...items]

  return (
    <div className="overflow-hidden flex-1 mx-4" style={{ maxWidth: 500 }}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-accent-cyan flex-shrink-0 uppercase tracking-widest opacity-80">LIVE</span>
        <div className="overflow-hidden relative flex-1">
          <div
            className="flex gap-8 ticker-animate whitespace-nowrap"
            style={{ width: 'max-content' }}
          >
            {all.map((item, i) => (
              <span key={i} className="text-xs text-text-secondary flex-shrink-0">
                {item}
                <span className="mx-4 text-border-default opacity-60">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
