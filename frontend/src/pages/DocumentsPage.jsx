import { useEffect, useState } from 'react'
import UploadZone from '../components/Upload/UploadZone.jsx'
import DocumentList from '../components/Documents/DocumentList.jsx'

export default function DocumentsPage({
  conversationId,
  conversationTitle,
  ensureActiveConversation,
  upload,
  uploading,
  uploadProgress,
  uploadQueue,
  documents,
  loading,
  error,
  onRemove,
}) {
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!conversationId && !creating) {
      setCreating(true)
      ensureActiveConversation().finally(() => setCreating(false))
    }
  }, [conversationId, ensureActiveConversation, creating])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#0d0c0a' }}>
      <div
        style={{
          padding: '24px 32px 16px',
          borderBottom: '1px solid #242018',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontFamily: "'Lora', serif",
            fontSize: '16px',
            fontWeight: 700,
            color: '#ede8df',
            letterSpacing: '-0.2px',
          }}
        >
          Documentos da conversa
        </h2>
        <p style={{ fontSize: '11px', color: '#4a433d', marginTop: '4px' }}>
          {conversationId
            ? `Documentos vinculados a "${conversationTitle}". A IA usará apenas estes arquivos para responder.`
            : 'Selecione ou crie uma conversa para enviar documentos.'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {conversationId && (
          <div style={{ marginBottom: '20px' }}>
            <UploadZone onUpload={upload} uploading={uploading} progress={uploadProgress} queue={uploadQueue} />
            {error && (
              <p
                style={{
                  fontSize: '11px',
                  color: '#e05040',
                  marginTop: '6px',
                  padding: '6px 10px',
                  background: 'rgba(224,80,64,0.08)',
                  borderRadius: '6px',
                  border: '1px solid rgba(224,80,64,0.15)',
                  whiteSpace: 'pre-line',
                }}
              >
                {error}
              </p>
            )}
          </div>
        )}

        <p
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: '#3a3530',
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            marginBottom: '6px',
            paddingLeft: '10px',
          }}
        >
          Documentos indexados
        </p>
        <DocumentList
          documents={documents}
          loading={loading}
          onRemove={onRemove}
          canDelete={!!conversationId}
        />
      </div>
    </div>
  )
}
