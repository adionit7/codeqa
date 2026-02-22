import React, { useState } from 'react'

export default function CodeSnippet({ lines, startLine = 1, filename }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', zIndex: 1 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleCopy}
          style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre style={{
        padding: '1rem',
        paddingRight: '4rem',
        overflowX: 'auto',
        fontSize: '0.82rem',
        lineHeight: 1.7,
        margin: 0,
        color: 'var(--text)',
        background: 'transparent',
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: '0' }}>
            <span style={{
              minWidth: '3rem',
              color: 'var(--text3)',
              userSelect: 'none',
              textAlign: 'right',
              paddingRight: '1rem',
              flexShrink: 0,
            }}>
              {startLine + i}
            </span>
            <span style={{ whiteSpace: 'pre' }}>{line}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}
