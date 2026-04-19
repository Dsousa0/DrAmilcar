import { useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

export function useDocuments() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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

  const upload = useCallback(async (file) => {
    setUploading(true)
    setUploadProgress(0)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      await api.post('/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      await fetchDocuments()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Falha no upload.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [fetchDocuments])

  const remove = useCallback(async (id) => {
    try {
      await api.delete(`/documents/${id}`)
      setDocuments((prev) => prev.filter((d) => d._id !== id))
    } catch {
      setError('Falha ao remover documento.')
    }
  }, [])

  return { documents, loading, uploading, uploadProgress, error, upload, remove }
}
