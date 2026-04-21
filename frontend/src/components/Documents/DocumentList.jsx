function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentList({ documents, loading, onRemove }) {
  if (loading) {
    return <p style={{ fontSize: '11px', color: '#a8a29e', padding: '4px 16px 8px' }}>Carregando…</p>
  }
  if (documents.length === 0) {
    return <p style={{ fontSize: '11px', color: '#a8a29e', padding: '4px 16px 8px' }}>Nenhum documento indexado.</p>
  }
  return (
    <ul style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {documents.map((doc) => (
        <li
          key={doc._id}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 8px', borderRadius: '6px' }}
          className="group"
        >
          <span style={{ color: '#d6a96a', fontSize: '10px', flexShrink: 0 }}>◆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '10.5px', color: '#44403c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.originalName}>
              {doc.originalName}
            </p>
            <p style={{ fontSize: '9.5px', color: '#a8a29e', marginTop: '1px' }}>
              {formatBytes(doc.sizeBytes)} · {doc.chunkCount} chunks
            </p>
          </div>
          <button
            onClick={() => onRemove(doc._id)}
            title="Remover"
            style={{ fontSize: '16px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, flexShrink: 0, opacity: 0.35, transition: 'opacity 150ms, color 150ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#c25b4a' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.35'; e.currentTarget.style.color = '#a8a29e' }}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
