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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0d0c0a' }}>

      {/* Header */}
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid #242018',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: '#0d0c0a',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ede8df', letterSpacing: '-0.1px' }}>
          {activeTitle || 'Nova conversa'}
        </span>
        {docCount > 0 && (
          <span
            style={{
              fontSize: '10px',
              color: '#f07820',
              background: 'rgba(240,120,32,0.10)',
              padding: '3px 8px',
              borderRadius: '9999px',
              fontWeight: 500,
              border: '1px solid rgba(240,120,32,0.20)',
            }}
          >
            {docCount} {docCount === 1 ? 'documento' : 'documentos'}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 8px', background: '#0d0c0a' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(240,120,32,0.08)',
                  border: '1px solid rgba(240,120,32,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  fontFamily: "'Lora', serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#f07820',
                }}
              >
                A
              </div>
              <p style={{ fontSize: '13px', color: '#4a433d', lineHeight: 1.6, maxWidth: '260px' }}>
                {docCount === 0
                  ? 'Faça upload de um PDF na barra lateral para começar.'
                  : 'Faça uma pergunta sobre os documentos indexados.'}
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {error && (
          <p
            style={{
              fontSize: '12px',
              color: '#e05040',
              textAlign: 'center',
              marginBottom: '8px',
              padding: '8px 14px',
              background: 'rgba(224,80,64,0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(224,80,64,0.15)',
            }}
          >
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
