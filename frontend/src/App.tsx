import { Routes, Route, Navigate } from 'react-router-dom'
import { homePath, getRole, getStudentId } from './auth'
import Login from './pages/Login'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentReport from './pages/StudentReport'
import PracticePlayer from './pages/PracticePlayer'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function StudentOrMeRedirect() {
  const role = getRole()
  const studentId = getStudentId()
  if (role === 'student' && studentId) {
    return <Navigate to={`/students/${studentId}`} replace />
  }
  return <Navigate to="/teacher" replace />
}

function TeacherStudentRedirect() {
  const role = getRole()
  if (role === 'student') {
    const studentId = getStudentId()
    return <Navigate to={`/students/${studentId}`} replace />
  }
  return null
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={homePath()} replace />} />
      <Route path="/student" element={<StudentOrMeRedirect />} />
      <Route path="/student/me/report" element={<StudentOrMeRedirect />} />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={['teacher']}>
            <Layout>
              <TeacherStudentRedirect />
              <TeacherDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="/teacher/student/:id" element={<Navigate to="/students/:id" replace />} />
      <Route
        path="/students/:id"
        element={
          <ProtectedRoute roles={['teacher', 'student']}>
            <Layout>
              <StudentReport />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/:setId"
        element={
          <ProtectedRoute roles={['teacher', 'student']}>
            <Layout>
              <PracticePlayer />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
