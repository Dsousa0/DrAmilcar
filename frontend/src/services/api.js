import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export async function getConversations() {
  const { data } = await api.get('/conversations')
  return data.data
}

export async function createConversation() {
  const { data } = await api.post('/conversations')
  return data
}

export async function getConversation(id) {
  const { data } = await api.get(`/conversations/${id}`)
  return data
}

export default api
