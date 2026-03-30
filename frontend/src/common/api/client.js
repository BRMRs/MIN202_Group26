import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Inject auth token from sessionStorage
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('authToken')
  if (token) config.headers['X-Auth-Token'] = token
  return config
})

export default api
