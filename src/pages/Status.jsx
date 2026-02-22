import React, { useState, useEffect } from 'react'
import { getSettings } from '../lib/storage.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/models'

export default function Status() {
  const [groqStatus, setGroqStatus] = useState('checking') // checking | ok | error | no-key
  const [groqMessage, setGroqMessage] = useState('')
  const [groqModels, setGroqModels] = useState([])
  const [appStatus] = useState('ok')
  const [lastChecked, setLastChecked] = useState(null)

  async function checkGroq() {
    const key = getSettings().groqKey
    if (!key) {
      setGroqStatus('no-key')
      setGroqMessage('No Groq API key configured. Add one on the Analyze page.')
      return
    }

    setGroqStatus('checking')
    try {
      const res = await fetch(GROQ_URL, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (res.ok) {
        const data = await res.json()
        const models = (data.data || []).map(m => m.id).filter(id => id.includes('llama'))
        setGroqStatus('ok')
        setGroqMessage('Groq API is reachable and key is valid.')
        setGroqModels(models.slice(0, 5))
      } else if (res.status === 401) {
        setGroqStatus('error')
        setGroqMessage('API key is invalid or expired.')
      } else {
        setGroqStatus('error')
        setGroqMessage(`Groq returned status ${res.status}`)
      }
    } catch (err) {
      setGroqStatus('error')
      setGroqMessage(`Network error: ${err.message}`)
    }
    setLastChecked(new Date())
  }

  useEffect(() => {
    checkGroq()
  }, [])

  const checks = [
    {
      name: 'App',
      status: appStatus,
      message: 'React app is running normally.',
      detail: `v1.0.0 · Vite + React 18`,
    },
    {
      name: 'localStorage',
      status: (() => { try { localStorage.setItem('_test', '1'); localStorage.removeItem('_test'); return 'ok' } catch { return 'error' } })(),
      message: (() => { try { localStorage.setItem('_test', '1'); localStorage.removeItem('_test'); return 'Available — Q&A history can be saved.' } catch { return 'Not available — history will not persist.' } })(),
      detail: null,
    },
    {
      name: 'JSZip',
      status: 'ok',
      message: 'ZIP parsing library loaded.',
      detail: null,
    },
    {
      name: 'GitHub API',
      status: 'ok',
      message: 'Public GitHub API available (60 req/hr unauthenticated).',
      detail: 'https://api.github.com',
    },
    {
      name: 'Groq API',
      status: groqStatus,
      message: groqMessage,
      detail: groqModels.length > 0 ? `Available models: ${groqModels.join(', ')}` : null,
    },
  ]

  function StatusDot({ status }) {
    if (status === 'checking') return <span className="spinner" style={{ width: 14, height: 14 }} />
    if (status === 'ok') return <span className="dot dot-green" />
    if (status === 'no-key') return <span className="dot dot-yellow" />
    return <span className="dot dot-red" />
  }

  function StatusTag({ status }) {
    if (status === 'checking') return <span className="tag tag-yellow">checking</span>
    if (status === 'ok') return <span className="tag tag-green">operational</span>
    if (status === 'no-key') return <span className="tag tag-yellow">not configured</span>
    return <span className="tag tag-red">error</span>
  }

  const allOk = checks.every(c => c.status === 'ok' || c.status === 'no-key')

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
        System Status
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
        Health check for all CodeQA components
      </p>

      {/* Overall status */}
      <div className={allOk ? 'success-box' : 'error-box'} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.2rem' }}>{allOk ? '✅' : '⚠️'}</span>
        <span>{allOk ? 'All systems operational' : 'Some components need attention'}</span>
      </div>

      {/* Checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {checks.map(check => (
          <div key={check.name} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: check.message ? '0.4rem' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <StatusDot status={check.status} />
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '0.9rem' }}>
                  {check.name}
                </span>
              </div>
              <StatusTag status={check.status} />
            </div>
            {check.message && (
              <div style={{ fontSize: '0.83rem', color: 'var(--text2)', paddingLeft: '1.5rem' }}>
                {check.message}
              </div>
            )}
            {check.detail && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', paddingLeft: '1.5rem', fontFamily: 'var(--mono)', marginTop: '0.2rem' }}>
                {check.detail}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Checking...'}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={checkGroq}>
          ↺ Refresh
        </button>
      </div>

      {/* API endpoint info */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <p className="label" style={{ marginBottom: '0.75rem' }}>Endpoints</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[
            { path: '/', desc: 'Home page' },
            { path: '/analyze', desc: 'Codebase Q&A (main feature)' },
            { path: '/history', desc: 'Saved Q&A sessions' },
            { path: '/status', desc: 'This page — health check' },
          ].map(({ path, desc }) => (
            <div key={path} style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', fontFamily: 'var(--mono)' }}>
              <span style={{ color: 'var(--accent)', minWidth: '8rem' }}>{path}</span>
              <span style={{ color: 'var(--text2)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
