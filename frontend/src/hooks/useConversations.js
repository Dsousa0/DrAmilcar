import { useState, useEffect, useCallback } from 'react'
import { getConversations, createConversation, getConversation } from '../services/api.js'

export function useConversations() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    try {
      const list = await getConversations()
      setConversations(list)
      if (list.length > 0) {
        const latest = await getConversation(list[0]._id)
        setActiveId(latest._id)
        setMessages(latest.messages)
      }
    } catch {
      // silently start with empty state
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const selectConversation = useCallback(async (id) => {
    try {
      const conv = await getConversation(id)
      setActiveId(conv._id)
      setMessages(conv.messages)
    } catch {
      // ignore
    }
  }, [])

  const newConversation = useCallback(async () => {
    try {
      const conv = await createConversation()
      setConversations((prev) => [{ _id: conv._id, title: conv.title, updatedAt: conv.updatedAt }, ...prev])
      setActiveId(conv._id)
      setMessages([])
    } catch {
      // ignore
    }
  }, [])

  const ensureActiveConversation = useCallback(async () => {
    if (activeId) return activeId
    const conv = await createConversation()
    setConversations((prev) => [{ _id: conv._id, title: conv.title, updatedAt: conv.updatedAt }, ...prev])
    setActiveId(conv._id)
    setMessages([])
    return conv._id
  }, [activeId])

  const appendOptimistic = useCallback((role, content) => {
    if (role === '__remove_last__') {
      setMessages((prev) => prev.slice(0, -1))
      return
    }
    setMessages((prev) => [...prev, { role, content }])
  }, [])

  const appendTokenToLast = useCallback((token) => {
    setMessages((prev) => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      updated[updated.length - 1] = { ...last, content: last.content + token }
      return updated
    })
  }, [])

  const refreshList = useCallback(async () => {
    try {
      const list = await getConversations()
      setConversations(list)
    } catch {
      // ignore
    }
  }, [])

  return {
    conversations,
    activeId,
    messages,
    loading,
    selectConversation,
    newConversation,
    ensureActiveConversation,
    appendOptimistic,
    appendTokenToLast,
    refreshList,
  }
}
