import UploadZone from '../components/Upload/UploadZone.jsx'
import DocumentList from '../components/Documents/DocumentList.jsx'

export default function DocumentsPage({ isAdmin, upload, uploading, uploadProgress, documents, loading, error, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid #e8e5e0', flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '16px', fontWeight: 700, color: '#1c1917' }}>
          {isAdmin ? 'Gerenciar Documentos' : 'Documentos'}
        </h2>
        <p style={{ fontSize: '11px', color: '#a8a29e', marginTop: '4px' }}>
          {isAdmin
            ? 'Faça upload de PDFs para indexar na base de conhecimento.'
            : 'Documentos disponíveis na base de conhecimento.'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {isAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <UploadZone onUpload={upload} uploading={uploading} progress={uploadProgress} />
            {error && (
              <p style={{ fontSize: '11px', color: '#c25b4a', marginTop: '6px' }}>{error}</p>
            )}
          </div>
        )}

        <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#a8a29e', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '6px' }}>
          Documentos indexados
        </p>
        <DocumentList
          documents={documents}
          loading={loading}
          onRemove={onRemove}
          canDelete={isAdmin}
        />
      </div>
    </div>
  )
}
