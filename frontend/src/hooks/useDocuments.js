import { useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

export function useDocuments(conversationId) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadQueue, setUploadQueue] = useState({ current: 0, total: 0 })
  const [error, setError] = useState('')

  const fetchDocuments = useCallback(async () => {
    if (!conversationId) {
      setDocuments([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get(`/conversations/${conversationId}/documents`)
      setDocuments(data.data)
    } catch {
      setError('Falha ao carregar documentos.')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const upload = useCallback(async (files) => {
    if (!conversationId) {
      setError('Selecione ou crie uma conversa antes de enviar documentos.')
      return
    }
    const fileArray = Array.from(files)
    setUploading(true)
    setError('')
    const failed = []

    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress(0)
      setUploadQueue({ current: i + 1, total: fileArray.length })
      try {
        const form = new FormData()
        form.append('file', fileArray[i])
        await api.post(`/conversations/${conversationId}/documents/upload`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
          },
        })
      } catch (err) {
        const reason = err.response?.data?.error?.message || 'Falha no upload'
        failed.push(`${fileArray[i].name}: ${reason}`)
      }
    }

    await fetchDocuments()
    setUploading(false)
    setUploadProgress(0)
    setUploadQueue({ current: 0, total: 0 })
    if (failed.length > 0) setError(failed.join('\n'))
  }, [conversationId, fetchDocuments])

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
