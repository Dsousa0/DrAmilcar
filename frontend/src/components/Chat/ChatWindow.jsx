import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ChatInput from './ChatInput.jsx'
import DocumentList from '../Documents/DocumentList.jsx'
import { useChat } from '../../hooks/useChat.js'

export default function ChatWindow({
  messages,
  conversationId,
  activeTitle,
  documents = [],
  uploading,
  uploadProgress,
  uploadQueue,
  docsError,
  upload,
  onRemoveDocument,
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
  const fileRef = useRef(null)
  const [showDocs, setShowDocs] = useState(false)
  const docCount = documents.length

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handlePickFiles(e) {
    const picked = Array.from(e.target.files || []).filter((f) => f.type === 'application/pdf')
    e.target.value = ''
    if (picked.length === 0) return
    const cid = await ensureActiveConversation()
    await upload(picked, cid)
  }

  const uploadLabel = uploading
    ? uploadQueue?.total > 1
      ? `Enviando ${uploadQueue.current}/${uploadQueue.total}… ${uploadProgress}%`
      : `Enviando… ${uploadProgress}%`
    : 'Anexar PDF'

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
          gap: '12px',
          flexShrink: 0,
          background: '#0d0c0a',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#ede8df',
            letterSpacing: '-0.1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            minWidth: 0,
          }}
        >
          {activeTitle || 'Nova conversa'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {docCount > 0 && (
            <button
              type="button"
              onClick={() => setShowDocs((v) => !v)}
              style={{
                fontSize: '10px',
                color: '#f07820',
                background: 'rgba(240,120,32,0.10)',
                padding: '4px 9px',
                borderRadius: '9999px',
                fontWeight: 500,
                border: '1px solid rgba(240,120,32,0.20)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              title={showDocs ? 'Ocultar lista' : 'Ver documentos'}
            >
              {docCount} {docCount === 1 ? 'documento' : 'documentos'} {showDocs ? '▴' : '▾'}
            </button>
          )}

          <button
            type="button"
            onClick={() => !uploading && fileRef.current?.click()}
            disabled={uploading}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: uploading ? '#6b6058' : '#ede8df',
              background: uploading ? '#1a1815' : '#f07820',
              border: 'none',
              borderRadius: '8px',
              padding: '7px 12px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 150ms',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.background = '#e06810' }}
            onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.background = '#f07820' }}
          >
            <span style={{ fontSize: '13px', lineHeight: 1 }}>＋</span>
            {uploadLabel}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            multiple
            onChange={handlePickFiles}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Doc list panel (collapsible) */}
      {showDocs && docCount > 0 && (
        <div
          style={{
            borderBottom: '1px solid #242018',
            background: '#0f0d0b',
            padding: '8px 16px 12px',
            maxHeight: '220px',
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <DocumentList
            documents={documents}
            loading={false}
            onRemove={onRemoveDocument}
            canDelete
          />
        </div>
      )}

      {/* Inline error from upload */}
      {docsError && (
        <div
          style={{
            padding: '8px 24px',
            background: 'rgba(224,80,64,0.08)',
            borderBottom: '1px solid rgba(224,80,64,0.15)',
            color: '#e05040',
            fontSize: '11px',
            whiteSpace: 'pre-line',
            flexShrink: 0,
          }}
        >
          {docsError}
        </div>
      )}

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
                  ? 'Use "Anexar PDF" no topo para enviar um documento e começar.'
                  : 'Faça uma pergunta sobre os documentos desta conversa.'}
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
