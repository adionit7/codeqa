import React from 'react'
import { useNavigate } from 'react-router-dom'

const features = [
  { icon: '📦', title: 'Upload ZIP or GitHub URL', desc: 'Drop in a zipped codebase or paste any public GitHub repo link.' },
  { icon: '🔍', title: 'Ask natural questions', desc: '"Where is auth handled?" — get precise answers with file paths and line numbers.' },
  { icon: '📎', title: 'Proof with snippets', desc: 'Every answer shows the exact code snippet that backs it up.' },
  { icon: '💡', title: 'Refactor suggestions', desc: 'AI flags improvement opportunities while it answers your question.' },
  { icon: '🏷️', title: 'Tags & search history', desc: 'Auto-tagged Q&As. Browse and search your last 10 sessions.' },
  { icon: '⚡', title: 'Powered by Groq', desc: 'Ultra-fast inference via Llama 3.3 70B on Groq — sub-second responses.' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--accent-glow)',
          border: '1px solid rgba(124,106,247,0.3)',
          borderRadius: 99,
          padding: '0.3rem 0.9rem',
          fontSize: '0.8rem',
          fontFamily: 'var(--mono)',
          color: 'var(--accent)',
          marginBottom: '1.5rem',
        }}>
          <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
          Codebase Q&A with Proof
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 300,
          fontFamily: 'var(--mono)',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginBottom: '1.25rem',
          color: 'var(--text)',
        }}>
          Ask anything about<br />
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>any codebase</span>
        </h1>

        <p style={{
          color: 'var(--text2)',
          fontSize: '1.1rem',
          maxWidth: 520,
          margin: '0 auto 2rem',
          lineHeight: 1.7,
        }}>
          Upload a ZIP or connect a GitHub repo. Ask questions in plain English. Get answers with exact file paths, line ranges, and code snippets.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/analyze')} style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
            Start analyzing →
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/status')} style={{ fontSize: '1rem' }}>
            View status
          </button>
        </div>
      </div>

      {/* Example queries */}
      <div className="card" style={{ marginBottom: '3rem', background: 'var(--bg3)' }}>
        <p className="label" style={{ marginBottom: '0.75rem' }}>Example questions</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            'Where is authentication handled?',
            'How do retries work?',
            'What database is used and how is it connected?',
            'Where are environment variables loaded?',
            'How is routing set up?',
            'What does the main entry point do?',
          ].map(q => (
            <span
              key={q}
              className="tag tag-purple"
              style={{ cursor: 'pointer', fontSize: '0.82rem' }}
              onClick={() => navigate('/analyze', { state: { question: q } })}
            >
              {q}
            </span>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="grid-3" style={{ gap: '1rem' }}>
        {features.map(f => (
          <div key={f.title} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.6rem' }}>{f.icon}</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text)' }}>
              {f.title}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.5 }}>
              {f.desc}
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10 }}>
        <p className="label" style={{ marginBottom: '1.25rem' }}>How it works</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            ['1', 'Enter your Groq API key (free at console.groq.com)'],
            ['2', 'Upload a ZIP or paste a GitHub repo URL'],
            ['3', 'Ask a question about the codebase'],
            ['4', 'Get an answer with file refs + snippets'],
          ].map(([num, text]) => (
            <div key={num} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flex: '1 1 180px' }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--accent-glow)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--mono)', fontSize: '0.8rem', fontWeight: 600,
                flexShrink: 0,
              }}>{num}</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text2)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
