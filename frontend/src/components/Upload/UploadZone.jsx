import { useRef, useState } from 'react'
import ProgressBar from './ProgressBar.jsx'

export default function UploadZone({ onUpload, uploading, progress }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') return
    onUpload(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div style={{ padding: '8px 10px' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? '#d6a96a' : '#d6c5ae'}`,
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1,
          background: dragging ? '#faf7f3' : 'transparent',
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => { if (!uploading && !dragging) { e.currentTarget.style.borderColor = '#d6a96a'; e.currentTarget.style.background = '#faf7f3' } }}
        onMouseLeave={(e) => { if (!dragging) { e.currentTarget.style.borderColor = '#d6c5ae'; e.currentTarget.style.background = 'transparent' } }}
      >
        <p style={{ fontSize: '10px', color: '#a8a29e' }}>
          {uploading ? 'Enviando…' : 'Soltar PDF ou clicar'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={uploading}
        />
      </div>
      {uploading && (
        <div style={{ marginTop: '6px' }}>
          <ProgressBar progress={progress} />
          <p style={{ fontSize: '10px', color: '#a8a29e', marginTop: '3px', textAlign: 'right' }}>{progress}%</p>
        </div>
      )}
    </div>
  )
}
