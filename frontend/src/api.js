import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
})

// Request interceptor
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  console.log('📡 API Request:', config.method.toUpperCase(), config.url)
  return config
})

// Response interceptor
API.interceptors.response.use(
  response => {
    console.log('✅ API Response:', response.config.url, response.status)
    return response
  },
  error => {
    console.error('❌ API Error:', error.config?.url, error.response?.status, error.response?.data)
    
    // If token is invalid or expired, clear it and redirect to login
    if (error.response?.status === 401 && error.response?.data?.message?.includes('Token')) {
      console.log('🔑 Token invalid - clearing localStorage')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    
    return Promise.reject(error)
  }
)

export default API
