import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Inject auth headers from sessionStorage
api.interceptors.request.use(config => {
  const userId = sessionStorage.getItem('userId')
  const userRole = sessionStorage.getItem('userRole')
  if (userId) config.headers['X-User-Id'] = userId
  if (userRole) config.headers['X-User-Role'] = userRole
  return config
})

export default api
