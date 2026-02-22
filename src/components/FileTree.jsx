import React, { useState, useMemo } from 'react'

function buildTree(filePaths) {
  const root = {}
  for (const path of filePaths) {
    const parts = path.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = {}
      node = node[parts[i]]
    }
    node[parts[parts.length - 1]] = null // file
  }
  return root
}

function TreeNode({ name, node, depth = 0, files, repoMeta, onSelectFile }) {
  const isFile = node === null
  const [open, setOpen] = useState(depth < 2)

  const indent = depth * 16

  if (isFile) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.2rem 0.5rem',
          paddingLeft: indent + 8,
          cursor: 'pointer',
          borderRadius: 4,
          fontSize: '0.82rem',
          fontFamily: 'var(--mono)',
          color: 'var(--text2)',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        onClick={() => onSelectFile && onSelectFile(name)}
      >
        <span style={{ marginRight: '0.4rem', fontSize: '0.75rem' }}>📄</span>
        {name}
      </div>
    )
  }

  const children = Object.entries(node).sort(([aName, aVal], [bName, bVal]) => {
    // Dirs first
    if (aVal === null && bVal !== null) return 1
    if (aVal !== null && bVal === null) return -1
    return aName.localeCompare(bName)
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.2rem 0.5rem',
          paddingLeft: indent + 8,
          cursor: 'pointer',
          borderRadius: 4,
          fontSize: '0.82rem',
          fontFamily: 'var(--mono)',
          color: 'var(--text)',
          fontWeight: 500,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        onClick={() => setOpen(v => !v)}
      >
        <span style={{ marginRight: '0.4rem', fontSize: '0.75rem' }}>{open ? '📂' : '📁'}</span>
        {name}
        <span style={{ marginLeft: '0.4rem', color: 'var(--text3)', fontSize: '0.72rem' }}>
          {open ? '▾' : '▸'}
        </span>
      </div>
      {open && (
        <div>
          {children.map(([childName, childNode]) => (
            <TreeNode
              key={childName}
              name={childName}
              node={childNode}
              depth={depth + 1}
              files={files}
              repoMeta={repoMeta}
              onSelectFile={path => onSelectFile && onSelectFile(name + '/' + path)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileTree({ files, repoMeta }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [search, setSearch] = useState('')

  const tree = useMemo(() => buildTree(Object.keys(files)), [files])
  const filePaths = Object.keys(files)
  const filteredPaths = search.trim()
    ? filePaths.filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : null

  function handleSelectFile(path) {
    // path might be relative from tree; find the full path
    const fullPath = filePaths.find(p => p === path || p.endsWith('/' + path))
    if (fullPath && files[fullPath] !== undefined) {
      setSelectedFile(fullPath)
      setFileContent(files[fullPath])
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem', minHeight: 400 }}>
      {/* Tree panel */}
      <div className="card" style={{ padding: '0.75rem', overflow: 'auto', maxHeight: 600 }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <input
            className="input"
            placeholder="Filter files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
          />
        </div>

        {filteredPaths ? (
          <div>
            {filteredPaths.slice(0, 50).map(path => (
              <div
                key={path}
                style={{
                  padding: '0.2rem 0.5rem',
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--mono)',
                  color: selectedFile === path ? 'var(--accent)' : 'var(--text2)',
                  background: selectedFile === path ? 'var(--accent-glow)' : 'transparent',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => handleSelectFile(path)}
              >
                {path}
              </div>
            ))}
            {filteredPaths.length > 50 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--mono)', padding: '0.25rem 0.5rem' }}>
                ...{filteredPaths.length - 50} more
              </div>
            )}
          </div>
        ) : (
          Object.entries(tree).sort(([a, av], [b, bv]) => {
            if (av === null && bv !== null) return 1
            if (av !== null && bv === null) return -1
            return a.localeCompare(b)
          }).map(([name, node]) => (
            <TreeNode
              key={name}
              name={name}
              node={node}
              files={files}
              repoMeta={repoMeta}
              onSelectFile={handleSelectFile}
            />
          ))
        )}
      </div>

      {/* File viewer */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', maxHeight: 600 }}>
        {!selectedFile ? (
          <div className="empty-state" style={{ padding: '4rem 2rem' }}>
            Select a file from the tree to view its content
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{
              padding: '0.6rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg)',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--accent)' }}>
                {selectedFile}
              </span>
              {repoMeta && (
                <a
                  href={`https://github.com/${repoMeta.owner}/${repoMeta.repo}/blob/${repoMeta.branch}/${selectedFile}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Open on GitHub ↗
                </a>
              )}
            </div>
            <div style={{ overflow: 'auto', flex: 1 }}>
              <pre style={{
                padding: '1rem',
                fontSize: '0.8rem',
                lineHeight: 1.7,
                margin: 0,
                color: 'var(--text)',
                whiteSpace: 'pre',
                fontFamily: 'var(--mono)',
              }}>
                {fileContent?.split('\n').map((line, i) => (
                  <div key={i} style={{ display: 'flex', gap: 0 }}>
                    <span style={{ minWidth: '3rem', color: 'var(--text3)', textAlign: 'right', paddingRight: '1rem', userSelect: 'none', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
