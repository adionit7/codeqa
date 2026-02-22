# CodeQA — Codebase Q&A with Proof

Ask natural-language questions about any codebase and get answers backed by exact file paths, line numbers, and code snippets.

## Live Demo

> **[https://codeqa-sandy.vercel.app/](https://codeqa-sandy.vercel.app/)** — deployed on Vercel

## Features

- **ZIP upload** or **public GitHub repo URL** — load any codebase in seconds
- **Natural language Q&A** — ask "Where is auth handled?" and get a real answer
- **Proof with references** — every answer shows the exact file, line range, and code snippet
- **Refactor suggestions** — AI flags improvement opportunities alongside answers
- **File tree browser** — navigate all loaded files, click to view with line numbers
- **Full-text search** — search for any string across all loaded files
- **Auto-tagged history** — last 10 Q&As saved to `localStorage`, filterable by tag/source
- **Health status page** — checks Groq API connectivity, localStorage, and all components

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast, no backend needed |
| AI | Groq API (Llama 3.3 70B) | Completely free tier, fastest inference |
| ZIP parsing | JSZip | In-browser, no upload to server |
| GitHub | GitHub public API | No auth needed for public repos |
| Storage | `localStorage` | Zero backend, persists across sessions |
| Hosting | Vercel | Free, auto-deploy from GitHub |

## Getting Started

### 1. Get a free Groq API key

Go to [console.groq.com](https://console.groq.com) → sign up (free, no credit card) → Create API Key.

### 2. Run locally

```bash
git clone https://github.com/adionit7/codeqa
cd codeqa
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 3. Enter your Groq key

Paste your key in the Analyze page. It's stored only in your browser's `localStorage`.

### 4. Load a codebase

- **ZIP**: Download any repo as ZIP from GitHub (Code → Download ZIP)
- **GitHub URL**: Paste any public GitHub repo URL directly

### 5. Ask questions

Examples:
- "Where is authentication handled?"
- "How do retries work?"
- "What database is used and how is it connected?"
- "Where are environment variables loaded?"
- "What does the main entry point do?"

## Deploy to Vercel (free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. No environment variables needed (API key entered at runtime by user)
4. Deploy — done!

## Project Structure

```
codeqa/
├── src/
│   ├── components/
│   │   ├── CodeSnippet.jsx   # Code viewer with line numbers + copy
│   │   └── FileTree.jsx      # Interactive file tree + viewer
│   ├── lib/
│   │   ├── codeParser.js     # ZIP + GitHub parsing, file tree, search
│   │   ├── groq.js           # Groq API client, prompt construction
│   │   └── storage.js        # localStorage Q&A history + settings
│   ├── pages/
│   │   ├── Home.jsx          # Landing page
│   │   ├── Analyze.jsx       # Main Q&A interface
│   │   ├── History.jsx       # Saved sessions browser
│   │   ├── Status.jsx        # Health check page
│   │   └── NotFound.jsx      # 404 page
│   ├── App.jsx               # Routing
│   ├── main.jsx              # Entry point
│   └── index.css             # Design system
├── index.html
├── vite.config.js
├── package.json
├── README.md
├── AI_NOTES.md
├── ABOUTME.md
└── PROMPTS_USED.md
```

## Design Decisions

- **No backend**: Everything runs in the browser. Your code never leaves your machine (except for the Groq API call).
- **Context windowing**: For large repos, we cap the context at ~80k characters and prioritize relevant files.
- **JSON-mode responses**: Groq is called with `response_format: { type: 'json_object' }` for reliable structured output.
- **Line number grounding**: The AI's line references are verified against actual file content and corrected before display.

## Limitations

- GitHub API is rate-limited to 60 requests/hour without auth (enough for most repos)
- Very large codebases (>150 files) are truncated — download a ZIP for better coverage
- AI line numbers are best-effort — always cross-reference with the actual file
