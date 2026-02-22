import JSZip from 'jszip'

// File extensions to include
const CODE_EXTENSIONS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'java', 'kt', 'swift',
  'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rs', 'scala', 'sh', 'bash',
  'yaml', 'yml', 'json', 'toml', 'env', 'md', 'mdx', 'sql', 'graphql',
  'html', 'css', 'scss', 'sass', 'vue', 'svelte', 'astro',
  'dockerfile', 'makefile', 'gitignore', 'env',
])

// Skip these directories
const SKIP_DIRS = new Set([
  'node_modules', '.git', '__pycache__', '.next', 'dist', 'build',
  '.venv', 'venv', 'env', '.env', 'coverage', '.nyc_output',
  'vendor', '.cargo', 'target', '.gradle',
])

function getExtension(filename) {
  const parts = filename.toLowerCase().split('.')
  return parts[parts.length - 1]
}

function shouldIncludeFile(path) {
  const parts = path.split('/')
  // Check if any parent dir should be skipped
  for (const part of parts.slice(0, -1)) {
    if (SKIP_DIRS.has(part.toLowerCase())) return false
  }
  const filename = parts[parts.length - 1]
  if (!filename || filename.startsWith('.')) return false
  const ext = getExtension(filename)
  // Include files with known code extensions, or no extension (like Dockerfile, Makefile)
  return CODE_EXTENSIONS.has(ext) || !filename.includes('.')
}

export async function parseZip(file) {
  const zip = await JSZip.loadAsync(file)
  const files = {}

  await Promise.all(
    Object.entries(zip.files).map(async ([path, zipEntry]) => {
      if (zipEntry.dir) return
      // Normalize path: strip top-level folder if all files share one
      const normalizedPath = path
      if (!shouldIncludeFile(normalizedPath)) return
      try {
        const content = await zipEntry.async('string')
        if (content.length > 500_000) return // skip huge files
        files[normalizedPath] = content
      } catch {
        // skip binary/unreadable files
      }
    })
  )

  // Strip common prefix if all files share one
  const paths = Object.keys(files)
  if (paths.length === 0) throw new Error('No code files found in ZIP')

  const prefix = getCommonPrefix(paths)
  const normalized = {}
  for (const [path, content] of Object.entries(files)) {
    const stripped = path.slice(prefix.length)
    if (stripped) normalized[stripped] = content
  }

  return normalized
}

function getCommonPrefix(paths) {
  if (paths.length === 0) return ''
  const first = paths[0].split('/')
  let prefixParts = []
  for (let i = 0; i < first.length - 1; i++) {
    const segment = first[i]
    if (paths.every(p => p.split('/')[i] === segment)) {
      prefixParts.push(segment)
    } else {
      break
    }
  }
  return prefixParts.length ? prefixParts.join('/') + '/' : ''
}

export async function parseGitHubRepo(repoUrl) {
  // Parse owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s?#]+)/)
  if (!match) throw new Error('Invalid GitHub URL. Expected: https://github.com/owner/repo')

  const owner = match[1]
  const repo = match[2].replace(/\.git$/, '')

  // Get default branch
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
  if (!repoRes.ok) {
    const err = await repoRes.json().catch(() => ({}))
    if (repoRes.status === 404) throw new Error(`Repo not found or private: ${owner}/${repo}. Use a public repo or download as ZIP.`)
    if (repoRes.status === 403) throw new Error('GitHub rate limit hit. Try again in a minute.')
    throw new Error(err.message || `GitHub API error: ${repoRes.status}`)
  }

  const repoData = await repoRes.json()
  const branch = repoData.default_branch || 'main'

  // Get file tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  )
  if (!treeRes.ok) throw new Error('Could not fetch repo tree')

  const treeData = await treeRes.json()
  if (treeData.truncated) console.warn('Repo tree truncated — very large repo')

  const codeFiles = (treeData.tree || [])
    .filter(item => item.type === 'blob' && shouldIncludeFile(item.path))
    .slice(0, 150) // max 150 files

  // Fetch file contents in parallel (batches to avoid rate limits)
  const files = {}
  const BATCH = 10

  for (let i = 0; i < codeFiles.length; i += BATCH) {
    const batch = codeFiles.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async item => {
        try {
          const res = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`
          )
          if (!res.ok) return
          const text = await res.text()
          if (text.length < 500_000) files[item.path] = text
        } catch {}
      })
    )
  }

  if (Object.keys(files).length === 0) throw new Error('No code files found in repo')
  return { files, owner, repo, branch }
}

export function buildContext(files, maxChars = 40000) {
  // Build a condensed context from all files for AI
  const entries = Object.entries(files)
  let context = ''
  let chars = 0

  for (const [path, content] of entries) {
    const lines = content.split('\n')
    const header = `\n\n### FILE: ${path} (${lines.length} lines)\n`
    const entry = header + content
    if (chars + entry.length > maxChars) {
      // Truncate this file
      const remaining = maxChars - chars - header.length - 100
      if (remaining > 200) {
        context += header + content.slice(0, remaining) + '\n... [truncated]'
      }
      break
    }
    context += entry
    chars += entry.length
  }

  return context
}

export function getFileLines(content, startLine, endLine) {
  const lines = content.split('\n')
  const start = Math.max(0, startLine - 1)
  const end = Math.min(lines.length, endLine)
  return {
    lines: lines.slice(start, end),
    actualStart: start + 1,
    actualEnd: end,
  }
}

export function searchFiles(files, query) {
  const q = query.toLowerCase()
  const results = []
  for (const [path, content] of Object.entries(files)) {
    const lines = content.split('\n')
    const matches = []
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(q)) {
        matches.push({ lineNumber: i + 1, line: line.trimEnd() })
      }
    })
    if (matches.length > 0) results.push({ path, matches })
  }
  return results
}
