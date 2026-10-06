import { Navigate, useParams, useLocation } from 'react-router-dom'
import { getRole, getStudentId, getSubject } from '../auth'
import type { Role } from '../types'

interface Props {
  roles: Role[]
  children: React.ReactNode
}

export default function ProtectedRoute({ roles, children }: Props) {
  const role = getRole()
  const studentId = getStudentId()
  const subject = getSubject()
  const params = useParams()
  const location = useLocation()

  if (!role || !roles.includes(role)) {
    return <Navigate to="/login" replace />
  }

  if (role === 'teacher' && location.pathname === '/teacher' && !subject) {
    return <Navigate to="/teacher/subject" replace />
  }

  if (role === 'student' && params.id && params.id !== studentId) {
    return <Navigate to={`/students/${studentId}`} replace />
  }

  return <>{children}</>
}
