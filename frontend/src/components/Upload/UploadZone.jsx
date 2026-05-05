import { useRef, useState } from 'react'
import ProgressBar from './ProgressBar.jsx'

export default function UploadZone({ onUpload, uploading, progress, queue }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files) {
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf')
    if (pdfs.length === 0) return
    onUpload(pdfs)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const queueLabel = queue?.total > 1
    ? `Enviando ${queue.current} de ${queue.total}…`
    : 'Enviando…'

  return (
    <div style={{ padding: '8px 10px' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? '#f07820' : '#2a2620'}`,
          borderRadius: '8px',
          padding: '14px 10px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.5 : 1,
          background: dragging ? 'rgba(240,120,32,0.06)' : 'transparent',
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => {
          if (!uploading && !dragging) {
            e.currentTarget.style.borderColor = 'rgba(240,120,32,0.5)'
            e.currentTarget.style.background = 'rgba(240,120,32,0.04)'
          }
        }}
        onMouseLeave={(e) => {
          if (!dragging) {
            e.currentTarget.style.borderColor = '#2a2620'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <p style={{ fontSize: '10px', color: '#4a433d' }}>
          {uploading ? queueLabel : 'Soltar PDFs ou clicar (múltiplos permitidos)'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </div>
      {uploading && (
        <div style={{ marginTop: '8px' }}>
          <ProgressBar progress={progress} />
          <p style={{ fontSize: '10px', color: '#4a433d', marginTop: '3px', textAlign: 'right' }}>{progress}%</p>
        </div>
      )}
    </div>
  )
}
