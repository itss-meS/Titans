import axios from 'axios'
import { getRole, getStudentId } from './auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const role = getRole()
  const studentId = getStudentId()
  if (role) config.headers['X-User-Role'] = role
  if (studentId) config.headers['X-Student-Id'] = studentId
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('role')
      localStorage.removeItem('studentId')
      window.location.assign('/login')
    }
    return Promise.reject(error)
  }
)

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.data?.detail) return String(err.response.data.detail)
    if (!err.response) return 'Cannot reach the server. Make sure the backend is running on port 8000.'
    const status = err.response.status
    if ((status === 500 || status === 502 || status === 503 || status === 504) && !err.response.data?.detail) {
      return 'Cannot reach the server. Make sure the backend is running on port 8000.'
    }
  }
  return 'An unexpected error occurred'
}

export default api
