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
    <div className="p-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <p className="text-sm text-gray-500">
          {uploading ? 'Enviando...' : 'Arraste um PDF ou clique para selecionar'}
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
        <div className="mt-2">
          <ProgressBar progress={progress} />
          <p className="text-xs text-gray-400 mt-1 text-right">{progress}%</p>
        </div>
      )}
    </div>
  )
}
