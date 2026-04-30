import http from './http'

export type ReportType = 'daily' | 'weekly'

export interface AiPrompts {
  dailyPrompt: string
  weeklyPrompt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const baseURL = () => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000'
const token = () => localStorage.getItem('accessToken') ?? ''

export const aiApi = {
  getPrompt: () => http.post<any, AiPrompts>('/ai/get-prompt'),
  savePrompt: (type: ReportType, prompt: string) => http.post('/ai/save-prompt', { type, prompt }),
  generate: (type: ReportType, messages: ChatMessage[]) =>
    http.post<any, { content: string }>('/ai/generate', { type, messages }),

  generateStream: async (
    type: ReportType,
    messages: ChatMessage[],
    onChunk: (content: string) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const res = await fetch(`${baseURL()}/ai/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`
      },
      body: JSON.stringify({ type, messages }),
      signal
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue

        const data = trimmed.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.content) onChunk(parsed.content)
        } catch (e) {
          // rethrow only if it's our explicit error
          if (e instanceof Error && !e.message.startsWith('JSON')) throw e
        }
      }
    }
  }
}
