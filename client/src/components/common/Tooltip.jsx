import { useState } from 'react'

export default function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false)

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs text-text-primary bg-bg-elevated border border-border-default shadow-xl pointer-events-none"
          style={{ fontSize: '11px' }}
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bg-elevated" />
        </span>
      )}
    </span>
  )
}
