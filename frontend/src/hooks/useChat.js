import { useState, useCallback } from 'react'

export function useChat({ conversationId, appendOptimistic, appendTokenToLast, ensureActiveConversation, refreshList }) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = useCallback(async (question) => {
    if (isStreaming) return

    setError('')
    const activeConvId = await ensureActiveConversation()

    appendOptimistic('user', question)
    appendOptimistic('assistant', '')
    setIsStreaming(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, conversationId: activeConvId }),
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
            continue
          }

          if (parsed.error) throw new Error(parsed.error)

          if (parsed.token) {
            appendTokenToLast(parsed.token)
          }
        }
      }

      await refreshList()
    } catch (err) {
      setError(err.message || 'Falha ao conectar com o servidor.')
      appendOptimistic('__remove_last__', '')
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming, conversationId, appendOptimistic, appendTokenToLast, ensureActiveConversation, refreshList])

  return { isStreaming, error, sendMessage }
}
