import { useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadQueue, setUploadQueue] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')

  const fetchDocuments = useCallback(async () => {
    try {
      const { data } = await api.get('/documents')
      setDocuments(data.data)
    } catch {
      setError('Falha ao carregar documentos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const upload = useCallback(async (files) => {
    const fileArray = Array.from(files)
    setUploading(true)
    setError('')

    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress(0)
      setUploadQueue({ current: i + 1, total: fileArray.length })
      try {
        const form = new FormData()
        form.append('file', fileArray[i])
        await api.post('/documents/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
          },
        })
      } catch (err) {
        setError(err.response?.data?.error?.message || `Falha no upload de "${fileArray[i].name}".`)
        break
      }
    }

    await fetchDocuments()
    setUploading(false)
    setUploadProgress(0)
    setUploadQueue({ current: 0, total: 0 })
  }, [fetchDocuments])

  const remove = useCallback(async (id) => {
    setDocuments((prev) => prev.filter((d) => d._id !== id))
    try {
      await api.delete(`/documents/${id}`)
      await fetchDocuments()
    } catch {
      setError('Falha ao remover documento.')
      await fetchDocuments()
    }
  }, [fetchDocuments])

  return { documents, loading, uploading, uploadProgress, uploadQueue, error, upload, remove }
}
