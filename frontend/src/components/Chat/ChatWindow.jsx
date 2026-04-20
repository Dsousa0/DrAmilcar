import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ChatInput from './ChatInput.jsx'
import { useChat } from '../../hooks/useChat.js'

export default function ChatWindow({
  messages,
  conversationId,
  appendOptimistic,
  appendTokenToLast,
  ensureActiveConversation,
  refreshList,
}) {
  const { isStreaming, error, sendMessage } = useChat({
    conversationId,
    appendOptimistic,
    appendTokenToLast,
    ensureActiveConversation,
    refreshList,
  })
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">
              Faça upload de um PDF e comece a conversar.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {error && (
          <p className="text-red-500 text-xs text-center mb-2">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
