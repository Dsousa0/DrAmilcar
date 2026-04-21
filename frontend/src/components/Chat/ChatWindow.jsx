import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ChatInput from './ChatInput.jsx'
import { useChat } from '../../hooks/useChat.js'

export default function ChatWindow({
  messages,
  conversationId,
  activeTitle,
  docCount,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fffffe' }}>

      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #e8e5e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', letterSpacing: '-0.2px' }}>
          {activeTitle || 'Nova conversa'}
        </span>
        {docCount > 0 && (
          <span style={{ fontSize: '11px', color: '#a8a29e' }}>
            {docCount} {docCount === 1 ? 'documento' : 'documentos'}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px', background: '#fffffe' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: '13px', color: '#a8a29e', textAlign: 'center', lineHeight: 1.6 }}>
              {docCount === 0
                ? 'Faça upload de um PDF na barra lateral para começar.'
                : 'Faça uma pergunta sobre os documentos indexados.'}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {error && (
          <p style={{ fontSize: '12px', color: '#c25b4a', textAlign: 'center', marginBottom: '8px' }}>{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
