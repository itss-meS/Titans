import type { Role } from './types'

export function getRole(): Role | null {
  const role = localStorage.getItem('role')
  if (role === 'teacher' || role === 'student') return role
  return null
}

export function getStudentId(): string {
  return localStorage.getItem('studentId') || ''
}

export function login(role: Role, studentId: string): void {
  localStorage.setItem('role', role)
  localStorage.setItem('studentId', studentId)
}

export function logout(): void {
  localStorage.removeItem('role')
  localStorage.removeItem('studentId')
}

export function homePath(): string {
  const role = getRole()
  if (role === 'teacher') return '/teacher'
  if (role === 'student') {
    const id = getStudentId()
    return id ? `/students/${id}` : '/login'
  }
  return '/login'
}
