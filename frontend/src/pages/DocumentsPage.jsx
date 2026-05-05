import UploadZone from '../components/Upload/UploadZone.jsx'
import DocumentList from '../components/Documents/DocumentList.jsx'

export default function DocumentsPage({ isAdmin, upload, uploading, uploadProgress, uploadQueue, documents, loading, error, onRemove }) {
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
          {isAdmin ? 'Gerenciar Documentos' : 'Documentos'}
        </h2>
        <p style={{ fontSize: '11px', color: '#4a433d', marginTop: '4px' }}>
          {isAdmin
            ? 'Faça upload de PDFs para indexar na base de conhecimento.'
            : 'Documentos disponíveis na base de conhecimento.'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {isAdmin && (
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
          canDelete={isAdmin}
        />
      </div>
    </div>
  )
}
