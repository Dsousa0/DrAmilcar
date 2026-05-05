function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentList({ documents, loading, onRemove, canDelete }) {
  if (loading) {
    return (
      <p style={{ fontSize: '11px', color: '#4a433d', padding: '4px 16px 8px' }}>Carregando…</p>
    )
  }
  if (documents.length === 0) {
    return (
      <p style={{ fontSize: '11px', color: '#4a433d', padding: '4px 16px 8px' }}>Nenhum documento indexado.</p>
    )
  }
  return (
    <ul style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {documents.map((doc) => (
        <li
          key={doc._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 8px',
            borderRadius: '6px',
            transition: 'background 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ color: '#f07820', fontSize: '9px', flexShrink: 0, opacity: 0.7 }}>◆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: '10.5px',
                color: '#b0a899',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={doc.originalName}
            >
              {doc.originalName}
            </p>
            <p style={{ fontSize: '9.5px', color: '#3a3530', marginTop: '1px' }}>
              {formatBytes(doc.sizeBytes)} · {doc.chunkCount} chunks
            </p>
          </div>
          {canDelete && (
            <button
              onClick={() => onRemove(doc._id)}
              title="Remover"
              style={{
                fontSize: '16px',
                color: '#3a3530',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                lineHeight: 1,
                flexShrink: 0,
                transition: 'color 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#e05040' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3530' }}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
