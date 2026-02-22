const HISTORY_KEY = 'codeqa_history'
const SETTINGS_KEY = 'codeqa_settings'
const MAX_HISTORY = 10

export function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveQA(entry) {
  try {
    const history = getHistory()
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry,
    }
    const updated = [newEntry, ...history].slice(0, MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    return newEntry
  } catch {
    return null
  }
}

export function deleteQA(id) {
  try {
    const history = getHistory()
    const updated = history.filter(e => e.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {}
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {}
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {}
}
