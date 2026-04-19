function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentList({ documents, loading, onRemove }) {
  if (loading) {
    return <p className="text-sm text-gray-400 px-4 py-2">Carregando...</p>
  }
  if (documents.length === 0) {
    return <p className="text-sm text-gray-400 px-4 py-2">Nenhum documento indexado.</p>
  }
  return (
    <ul className="px-4 space-y-1">
      {documents.map((doc) => (
        <li key={doc._id} className="flex items-center justify-between group py-1">
          <div className="min-w-0">
            <p className="text-sm text-gray-700 truncate" title={doc.originalName}>
              {doc.originalName}
            </p>
            <p className="text-xs text-gray-400">
              {formatBytes(doc.sizeBytes)} · {doc.chunkCount} chunks
            </p>
          </div>
          <button
            onClick={() => onRemove(doc._id)}
            className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
            title="Remover"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
