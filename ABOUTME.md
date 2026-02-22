# ABOUTME.md

## About This Project

**CodeQA** is a browser-based tool for exploring unfamiliar codebases through natural language questions. Instead of reading through files manually, you ask a question and get an answer with exact references — file paths, line numbers, and the actual code.

## Why Option B?

Codebase Q&A felt like the more immediately useful problem. Developers spend a lot of time onboarding to new repos, reviewing PRs in unfamiliar services, or debugging code they didn't write. A tool that can answer "how does X work?" with a pointer to the actual code is directly useful.

## Technical Choices Explained

**Why Groq over OpenAI/Gemini?**
Groq's free tier is genuinely free — no credit card, no usage fees for reasonable amounts. The Llama 3.3 70B model is strong enough for code understanding. Response speed is excellent.

**Why no backend?**
A backend would require hosting (cost or complexity), a database, and handling user auth. Doing everything in the browser means:
- Your code never leaves your machine (except the Groq API call)
- Zero infrastructure to manage
- Works immediately after cloning — no `.env` setup

**Why localStorage for history?**
10 Q&A entries is small. localStorage is instant, free, and requires no setup. The tradeoff (data lost if you clear browser storage) is acceptable for this use case.

**What I'd add with more time:**
- Syntax highlighting (Prism.js or highlight.js)
- Export Q&A session as Markdown
- Pin/bookmark specific references
- Support for authenticated GitHub repos (private repos via personal access token)
- Semantic search across the codebase (embeddings + vector similarity)
- Side-by-side diff view for refactor suggestions

## Stack Summary

- React 18 + Vite (frontend)
- Groq API / Llama 3.3 70B (AI)
- JSZip (ZIP parsing in browser)
- GitHub REST API (public repo fetching)
- localStorage (session history)
- Vercel (hosting)
