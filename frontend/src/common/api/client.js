import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('authToken')
  if (token) config.headers['X-Auth-Token'] = token
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response || error.message)
    return Promise.reject(error)
  }
)

export default api