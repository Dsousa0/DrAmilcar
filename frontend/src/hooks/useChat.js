import { useState, useCallback } from 'react'

export function useChat() {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = useCallback(async (question) => {
    if (isStreaming) return

    setError('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setIsStreaming(true)

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'Erro na requisição')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break outer

          let parsed
          try {
            parsed = JSON.parse(payload)
          } catch {
            continue // malformed line — skip
          }

          if (parsed.error) throw new Error(parsed.error)

          if (parsed.token) {
            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updated[updated.length - 1].content + parsed.token,
              }
              return updated
            })
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Falha ao conectar com o servidor.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming])

  return { messages, isStreaming, error, sendMessage }
}
