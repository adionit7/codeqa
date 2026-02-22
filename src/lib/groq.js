const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function askGroq(apiKey, question, codeContext, filePaths) {
  const systemPrompt = `You are an expert code analysis assistant. You are given a codebase and must answer questions about it with precision and proof.

ALWAYS respond in this exact JSON format:
{
  "answer": "Clear explanation of the answer",
  "references": [
    {
      "file": "exact/file/path.js",
      "startLine": 10,
      "endLine": 25,
      "snippet": "the actual code snippet from those lines",
      "explanation": "why this file/section is relevant"
    }
  ],
  "tags": ["auth", "middleware"],
  "refactorSuggestion": "optional: one concrete refactor suggestion if relevant, else null"
}

Rules:
- File paths must exactly match files in the codebase
- Line numbers must be realistic based on the file content shown
- Snippets must be actual code from the files, not made up
- Include 1-5 references, prioritize the most relevant
- Tags should be 1-4 short descriptive keywords
- If you cannot find relevant code, say so clearly in the answer and return empty references array
- refactorSuggestion should be a concrete, actionable suggestion or null

The codebase files available are:
${filePaths.slice(0, 80).join('\n')}

Codebase content:
${codeContext}`

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Question: ${question}` },
      ],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const message = err.error?.message || `Groq API error: ${response.status}`

    if (response.status === 401) {
      throw new Error('Invalid Groq API key. Check your key and try again.')
    }

    if (response.status === 429) {
      // Generic rate-limit message
      throw new Error('Groq rate limit hit. Wait a moment and retry.')
    }

    // Friendlier message when the request/context is too large for the current tier
    const lower = message.toLowerCase()
    if (lower.includes('request too large') || lower.includes('tokens per minute')) {
      throw new Error(
        'This codebase + question is too large for the current Groq free-tier limits. ' +
        'Try a smaller repo/ZIP or a more focused question.'
      )
    }

    throw new Error(message)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) throw new Error('Empty response from Groq')

  try {
    return JSON.parse(content)
  } catch {
    // If JSON parse fails, try to extract JSON from the content
    const match = content.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse AI response as JSON')
  }
}
