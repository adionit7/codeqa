import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { parseZip, parseGitHubRepo, buildContext, getFileLines, searchFiles } from '../lib/codeParser.js'
import { askGroq } from '../lib/groq.js'
import { saveQA, getSettings, saveSettings } from '../lib/storage.js'
import CodeSnippet from '../components/CodeSnippet.jsx'
import FileTree from '../components/FileTree.jsx'

export default function Analyze() {
  const location = useLocation()
  const fileInputRef = useRef(null)

  // Settings
  const [apiKey, setApiKey] = useState(() => getSettings().groqKey || '')
  const [showKey, setShowKey] = useState(false)

  // Source
  const [sourceTab, setSourceTab] = useState('zip') // 'zip' | 'github'
  const [githubUrl, setGithubUrl] = useState('')
  const [files, setFiles] = useState(null) // { path: content }
  const [repoMeta, setRepoMeta] = useState(null) // { owner, repo, branch }
  const [loadingSource, setLoadingSource] = useState(false)
  const [sourceError, setSourceError] = useState('')
  const [zipFileName, setZipFileName] = useState('')

  // Q&A
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { answer, references, tags, refactorSuggestion }

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [activeTab, setActiveTab] = useState('answer') // 'answer' | 'files' | 'search'

  // Pre-fill question from nav state
  useEffect(() => {
    if (location.state?.question) {
      setQuestion(location.state.question)
    }
  }, [location.state])

  // Save API key
  function handleApiKeySave(key) {
    setApiKey(key)
    saveSettings({ ...getSettings(), groqKey: key })
  }

  // Handle ZIP upload
  async function handleZipUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setSourceError('')
    setFiles(null)
    setResult(null)
    setRepoMeta(null)
    setLoadingSource(true)
    setZipFileName(file.name)
    try {
      const parsed = await parseZip(file)
      const count = Object.keys(parsed).length
      if (count === 0) throw new Error('No code files found. Make sure the ZIP contains source code.')
      setFiles(parsed)
      setActiveTab('files')
    } catch (err) {
      setSourceError(err.message)
    } finally {
      setLoadingSource(false)
    }
  }

  // Handle GitHub load
  async function handleGitHubLoad() {
    if (!githubUrl.trim()) return
    setSourceError('')
    setFiles(null)
    setResult(null)
    setLoadingSource(true)
    try {
      const { files: parsed, owner, repo, branch } = await parseGitHubRepo(githubUrl.trim())
      setFiles(parsed)
      setRepoMeta({ owner, repo, branch })
      setActiveTab('files')
    } catch (err) {
      setSourceError(err.message)
    } finally {
      setLoadingSource(false)
    }
  }

  // Ask question
  async function handleAsk() {
    if (!apiKey.trim()) { setError('Enter your Groq API key above.'); return }
    if (!files) { setError('Load a codebase first.'); return }
    if (!question.trim()) { setError('Enter a question.'); return }

    setError('')
    setResult(null)
    setLoading(true)
    setActiveTab('answer')

    try {
      const filePaths = Object.keys(files)
      const context = buildContext(files)
      const response = await askGroq(apiKey, question.trim(), context, filePaths)

      // Enrich references with actual file content
      const enriched = {
        ...response,
        references: (response.references || []).map(ref => {
          const content = files[ref.file]
          if (content) {
            const { lines, actualStart, actualEnd } = getFileLines(
              content, ref.startLine || 1, ref.endLine || ref.startLine || 10
            )
            return { ...ref, lines, actualStart, actualEnd }
          }
          return ref
        }),
        question: question.trim(),
        source: repoMeta
          ? `github:${repoMeta.owner}/${repoMeta.repo}`
          : zipFileName || 'zip',
      }

      setResult(enriched)

      // Save to history
      saveQA({
        question: question.trim(),
        answer: response.answer,
        references: enriched.references,
        tags: response.tags || [],
        refactorSuggestion: response.refactorSuggestion || null,
        source: enriched.source,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Search files
  function handleSearch() {
    if (!files || !searchQuery.trim()) return
    const results = searchFiles(files, searchQuery.trim())
    setSearchResults(results)
    setActiveTab('search')
  }

  const fileCount = files ? Object.keys(files).length : 0

  function getGithubLink(ref) {
    if (!repoMeta) return null
    return `https://github.com/${repoMeta.owner}/${repoMeta.repo}/blob/${repoMeta.branch}/${ref.file}#L${ref.actualStart || ref.startLine}-L${ref.actualEnd || ref.endLine}`
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: '1.4rem', marginBottom: '0.25rem' }}>
        Analyze Codebase
      </h1>
      <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
        Load a codebase, then ask questions. Get answers with file references and code snippets.
      </p>

      {/* API Key */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <label className="label">Groq API Key</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type={showKey ? 'text' : 'password'}
            className="input"
            placeholder="gsk_..."
            value={apiKey}
            onChange={e => handleApiKeySave(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-ghost btn-sm" onClick={() => setShowKey(v => !v)}>
            {showKey ? 'hide' : 'show'}
          </button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: '0.4rem', fontFamily: 'var(--mono)' }}>
          Free at{' '}
          <a href="https://console.groq.com" target="_blank" rel="noreferrer">console.groq.com</a>
          {' '}· Stored only in your browser
        </p>
      </div>

      {/* Source selector */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <button className={`tab ${sourceTab === 'zip' ? 'active' : ''}`} onClick={() => setSourceTab('zip')}>
            📦 Upload ZIP
          </button>
          <button className={`tab ${sourceTab === 'github' ? 'active' : ''}`} onClick={() => setSourceTab('github')}>
            🐙 GitHub Repo
          </button>
        </div>

        {sourceTab === 'zip' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border2)',
                borderRadius: 8,
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
                fontFamily: 'var(--mono)',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            >
              {loadingSource ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span className="spinner" />
                  <span style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Parsing ZIP...</span>
                </div>
              ) : files && sourceTab === 'zip' ? (
                <div>
                  <div style={{ color: 'var(--green)', marginBottom: '0.25rem' }}>✓ {zipFileName}</div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{fileCount} files loaded · click to replace</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>Click to upload a ZIP of your codebase</div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: '0.25rem' }}>node_modules, .git, dist are automatically excluded</div>
                </div>
              )}
            </div>
          </div>
        )}

        {sourceTab === 'github' && (
          <div>
            <label className="label">Public GitHub Repo URL</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input"
                placeholder="https://github.com/owner/repo"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGitHubLoad()}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleGitHubLoad}
                disabled={loadingSource || !githubUrl.trim()}
              >
                {loadingSource ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Load'}
              </button>
            </div>
            {files && repoMeta && (
              <div className="success-box" style={{ marginTop: '0.75rem' }}>
                ✓ Loaded {fileCount} files from{' '}
                <a href={`https://github.com/${repoMeta.owner}/${repoMeta.repo}`} target="_blank" rel="noreferrer">
                  {repoMeta.owner}/{repoMeta.repo}
                </a>{' '}
                @ {repoMeta.branch}
              </div>
            )}
          </div>
        )}

        {sourceError && <div className="error-box" style={{ marginTop: '0.75rem' }}>{sourceError}</div>}
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label className="label">Your Question</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            className="textarea"
            placeholder="Where is authentication handled? How do retries work? What does the main entry point do?"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk()
            }}
            style={{ flex: 1, minHeight: 64 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAsk}
            disabled={loading || !files || !question.trim() || !apiKey.trim()}
            style={{ alignSelf: 'flex-end', padding: '0.6rem 1.5rem' }}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Ask'}
          </button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: '0.4rem', fontFamily: 'var(--mono)' }}>
          Ctrl/Cmd+Enter to submit
        </p>

        {error && <div className="error-box" style={{ marginTop: '0.75rem' }}>{error}</div>}
      </div>

      {/* Results area */}
      {files && (
        <div>
          <div className="tabs">
            <button className={`tab ${activeTab === 'answer' ? 'active' : ''}`} onClick={() => setActiveTab('answer')}>
              💬 Answer {result ? '' : ''}
            </button>
            <button className={`tab ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
              📁 Files ({fileCount})
            </button>
            <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
              🔎 Search
            </button>
          </div>

          {/* Answer tab */}
          {activeTab === 'answer' && (
            <div className="fade-in">
              {loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: '0.875rem' }}>
                  <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 1rem' }} />
                  Analyzing codebase with Groq...
                </div>
              )}

              {!loading && !result && (
                <div className="empty-state">
                  Ask a question above to get an answer with proof ↑
                </div>
              )}

              {result && (
                <div className="fade-in">
                  {/* Answer */}
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text3)' }}>
                        Q: {result.question}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, flexWrap: 'wrap' }}>
                        {(result.tags || []).map(tag => (
                          <span key={tag} className="tag tag-purple">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.95rem',
                      lineHeight: 1.7,
                      color: 'var(--text)',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {result.answer}
                    </div>

                    {result.refactorSuggestion && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(251,191,36,0.08)',
                        border: '1px solid rgba(251,191,36,0.25)',
                        borderRadius: 8,
                        fontSize: '0.875rem',
                        color: 'var(--yellow)',
                        fontFamily: 'var(--mono)',
                      }}>
                        <strong>💡 Refactor suggestion:</strong> {result.refactorSuggestion}
                      </div>
                    )}
                  </div>

                  {/* References */}
                  {result.references?.length > 0 && (
                    <div>
                      <p className="label" style={{ marginBottom: '0.75rem' }}>
                        Code References ({result.references.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {result.references.map((ref, i) => (
                          <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{
                              padding: '0.6rem 1rem',
                              background: 'var(--bg)',
                              borderBottom: '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{
                                  width: 20, height: 20, borderRadius: '50%',
                                  background: 'var(--accent-glow)',
                                  color: 'var(--accent)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.7rem', fontFamily: 'var(--mono)', fontWeight: 600, flexShrink: 0,
                                }}>{i + 1}</span>
                                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--accent)' }}>
                                  {ref.file}
                                </span>
                                {(ref.actualStart || ref.startLine) && (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                                    lines {ref.actualStart || ref.startLine}–{ref.actualEnd || ref.endLine}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {getGithubLink(ref) && (
                                  <a
                                    href={getGithubLink(ref)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-ghost btn-sm"
                                  >
                                    Open on GitHub ↗
                                  </a>
                                )}
                              </div>
                            </div>

                            {ref.explanation && (
                              <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.83rem', color: 'var(--text2)' }}>
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

                            {(!ref.lines || ref.lines.length === 0) && ref.snippet && (
                              <pre style={{ padding: '1rem', fontSize: '0.83rem', overflow: 'auto', lineHeight: 1.6, color: 'var(--text)' }}>
                                {ref.snippet}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Files tab */}
          {activeTab === 'files' && (
            <div className="fade-in">
              <FileTree files={files} repoMeta={repoMeta} />
            </div>
          )}

          {/* Search tab */}
          {activeTab === 'search' && (
            <div className="fade-in">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  className="input"
                  placeholder="Search across all files..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button className="btn btn-primary" onClick={handleSearch} disabled={!searchQuery.trim()}>
                  Search
                </button>
              </div>

              {searchResults === null && (
                <div className="empty-state">Enter a term and click Search to find it across all files</div>
              )}

              {searchResults?.length === 0 && (
                <div className="empty-state">No matches found for "{searchQuery}"</div>
              )}

              {searchResults?.length > 0 && (
                <div>
                  <p style={{ color: 'var(--text2)', fontSize: '0.85rem', fontFamily: 'var(--mono)', marginBottom: '0.75rem' }}>
                    Found in {searchResults.length} file(s)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {searchResults.map(({ path, matches }) => (
                      <div key={path} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{
                          padding: '0.6rem 1rem',
                          background: 'var(--bg)',
                          borderBottom: '1px solid var(--border)',
                          fontFamily: 'var(--mono)',
                          fontSize: '0.85rem',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          <span>{path}</span>
                          <span className="tag tag-purple">{matches.length} match{matches.length !== 1 ? 'es' : ''}</span>
                        </div>
                        <div style={{ overflow: 'auto', maxHeight: 200 }}>
                          {matches.slice(0, 10).map(({ lineNumber, line }) => (
                            <div key={lineNumber} style={{
                              display: 'flex',
                              gap: '1rem',
                              padding: '0.25rem 1rem',
                              fontFamily: 'var(--mono)',
                              fontSize: '0.82rem',
                              borderBottom: '1px solid var(--border)',
                            }}>
                              <span style={{ color: 'var(--text3)', minWidth: '3rem', textAlign: 'right' }}>{lineNumber}</span>
                              <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {highlightMatch(line, searchQuery)}
                              </span>
                            </div>
                          ))}
                          {matches.length > 10 && (
                            <div style={{ padding: '0.4rem 1rem', fontSize: '0.78rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                              ...and {matches.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function highlightMatch(line, query) {
  // Simple highlight — return as string for now (React would need dangerouslySetInnerHTML for real highlight)
  return line
}
