# PROMPTS_USED.md — Prompts Used to Build This Project

All prompts sent to Claude (claude.ai) during the development of CodeQA.

---

## Prompt 1 — Architecture + Stack Decision

**Prompt:**
> I need to build a Codebase Q&A web app for a take-home assignment. Requirements:
> - Upload a ZIP or connect a public GitHub repo URL
> - Ask questions like "Where is auth handled?" and get answers with file paths, line ranges, and code snippets
> - Save last 10 Q&As
> - Home page, Status page, error handling
> - README, AI_NOTES.md, ABOUTME.md, PROMPTS_USED.md
> - Must be completely free — I have a Groq API key (free tier), GitHub account, and Vercel account
> - Store Q&A history in localStorage (no backend)
>
> Recommend a stack and architecture.

**What I used from the response:**
- Confirmed: React + Vite (no Next.js — simpler for pure frontend)
- Confirmed: JSZip for in-browser ZIP parsing
- Confirmed: GitHub public REST API for repo fetching
- Confirmed: Groq llama-3.3-70b-versatile as the model

---

## Prompt 2 — Full Project Build

**Prompt:**
> Build the complete CodeQA project with this stack:
> - React 18 + Vite, react-router-dom v6
> - Groq API (llama-3.3-70b-versatile), response_format json_object
> - JSZip for ZIP parsing in browser
> - localStorage for Q&A history (max 10)
> - Dark terminal aesthetic: IBM Plex Mono + IBM Plex Sans, deep dark bg (#0a0a0f), purple accent (#7c6af7)
>
> Pages: Home, Analyze (main feature), History, Status, 404
> Components: CodeSnippet (with line numbers + copy), FileTree (interactive tree + file viewer)
> Lib: codeParser.js (ZIP + GitHub parsing, buildContext, getFileLines, searchFiles), groq.js (API call, structured prompt), storage.js (getHistory, saveQA, deleteQA, clearHistory, getSettings, saveSettings)
>
> The Groq system prompt must:
> - Return JSON with: answer, references (file, startLine, endLine, snippet, explanation), tags, refactorSuggestion
> - Only reference files from the provided file list
> - Use low temperature (0.1)
>
> Extra features: file search across codebase, refactor suggestion per answer, auto-tagging
>
> Generate all files completely.

**What I used from the response:**
- All component and page code as the base
- The Groq prompt structure (iterated on this — see Prompt 3)
- CSS design system

**What I changed:**
- Added the path normalization in `codeParser.js` (common prefix stripping)
- Fixed the FileTree path resolution bug (matching by full path or suffix)
- Added the GitHub rate limit error message
- Added the `onMouseEnter/Leave` hover effects on the ZIP drop zone

---

## Prompt 3 — Groq Prompt Refinement

**Prompt:**
> The Groq system prompt isn't producing reliable JSON. The model sometimes adds preamble text before the JSON. Fix the system prompt and error handling in groq.js to handle this. Also add a fallback JSON extraction regex.

**What I used:**
- The `response_format: { type: 'json_object' }` enforcement
- The regex fallback: `content.match(/\{[\s\S]*\}/)`
- Clearer "Rules:" section in the system prompt

---

## Prompt 4 — Documentation Files

**Prompt:**
> Write README.md, AI_NOTES.md, ABOUTME.md, and PROMPTS_USED.md for the CodeQA project. Be honest about AI usage. README should include setup instructions, project structure, and design decisions. AI_NOTES should explain exactly what AI generated vs what was manually decided. ABOUTME should explain why Option B was chosen and what I'd add with more time.

**What I used:**
- The structure and content of all four docs (edited for accuracy)

---

## Total AI Usage Estimate

| Category | AI contribution |
|---|---|
| Component code | ~85% generated, ~15% edited |
| Groq prompt | ~60% generated, ~40% refined manually |
| CSS/design system | ~90% generated |
| Architecture decisions | AI suggested, human evaluated and confirmed |
| Documentation | ~70% generated, ~30% edited for accuracy |
