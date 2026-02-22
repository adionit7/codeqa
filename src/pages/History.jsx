import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, deleteQA, clearHistory } from '../lib/storage.js'
import CodeSnippet from '../components/CodeSnippet.jsx'

export default function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setHistory(getHistory())
  }, [])

  function handleDelete(id) {
    deleteQA(id)
    setHistory(getHistory())
    if (expanded === id) setExpanded(null)
  }

  function handleClear() {
    if (window.confirm('Clear all Q&A history?')) {
      clearHistory()
      setHistory([])
      setExpanded(null)
    }
  }

  function formatTime(iso) {
    const d = new Date(iso)
    return d.toLocaleString()
  }

  const filtered = filter.trim()
    ? history.filter(e =>
        e.question.toLowerCase().includes(filter.toLowerCase()) ||
        (e.tags || []).some(t => t.toLowerCase().includes(filter.toLowerCase())) ||
        e.source?.toLowerCase().includes(filter.toLowerCase())
      )
    : history

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '1.4rem', marginBottom: '0.25rem' }}>Q&A History</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Last {history.length}/10 saved sessions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {history.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={handleClear} style={{ color: 'var(--red)' }}>
              Clear all
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/analyze')}>
            + New analysis
          </button>
        </div>
      </div>

      {/* Search/filter */}
      {history.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <input
            className="input"
            placeholder="Filter by question, tag, or source..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      )}

      {history.length === 0 && (
        <div className="empty-state" style={{ padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <div>No Q&As yet.</div>
          <div style={{ marginTop: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/analyze')}>
              Start analyzing →
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && history.length > 0 && (
        <div className="empty-state">No matches for "{filter}"</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map((entry) => (
          <div key={entry.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div
              style={{
                padding: '0.9rem 1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.4rem', fontWeight: 500 }}>
                  {entry.question}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                    {formatTime(entry.timestamp)}
                  </span>
                  {entry.source && (
                    <span className="tag tag-yellow" style={{ fontSize: '0.72rem' }}>
                      {entry.source}
                    </span>
                  )}
                  {(entry.tags || []).map(tag => (
                    <span key={tag} className="tag tag-purple" style={{ fontSize: '0.72rem' }}>{tag}</span>
                  ))}
                  {entry.references?.length > 0 && (
                    <span className="tag tag-green" style={{ fontSize: '0.72rem' }}>
                      {entry.references.length} ref{entry.references.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); handleDelete(entry.id) }}
                  style={{ color: 'var(--red)' }}
                >
                  ✕
                </button>
                <span style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
                  {expanded === entry.id ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* Expanded */}
            {expanded === entry.id && (
              <div className="fade-in" style={{ borderTop: '1px solid var(--border)' }}>
                {/* Answer */}
                <div style={{ padding: '1rem 1.1rem' }}>
                  <p className="label" style={{ marginBottom: '0.5rem' }}>Answer</p>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                    {entry.answer}
                  </div>
                </div>

                {/* Refactor suggestion */}
                {entry.refactorSuggestion && (
                  <div style={{
                    margin: '0 1.1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.25)',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    color: 'var(--yellow)',
                    fontFamily: 'var(--mono)',
                    marginBottom: '1rem',
                  }}>
                    <strong>💡 Refactor suggestion:</strong> {entry.refactorSuggestion}
                  </div>
                )}

                {/* References */}
                {entry.references?.length > 0 && (
                  <div style={{ padding: '0 1.1rem 1rem' }}>
                    <p className="label" style={{ marginBottom: '0.5rem' }}>References</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {entry.references.map((ref, i) => (
                        <div key={i} className="code-block">
                          <div className="code-block-header">
                            <span className="code-block-filename">{ref.file}</span>
                            {(ref.actualStart || ref.startLine) && (
                              <span className="code-block-lines">
                                lines {ref.actualStart || ref.startLine}–{ref.actualEnd || ref.endLine}
                              </span>
                            )}
                          </div>
                          {ref.explanation && (
                            <div style={{ padding: '0.4rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text2)' }}>
                              {ref.explanation}
                            </div>
                          )}
                          {ref.lines && ref.lines.length > 0 && (
                            <CodeSnippet
                              lines={ref.lines}
                              startLine={ref.actualStart || ref.startLine || 1}
                              filename={ref.file}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
