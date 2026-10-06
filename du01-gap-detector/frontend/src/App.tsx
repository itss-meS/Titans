import { Routes, Route, Navigate } from 'react-router-dom'
import { homePath } from './auth'
import Login from './pages/Login'
import SubjectSelect from './pages/SubjectSelect'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentReport from './pages/StudentReport'
import PracticePlayer from './pages/PracticePlayer'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={homePath()} replace />} />
      <Route
        path="/teacher/subject"
        element={
          <ProtectedRoute roles={['teacher']}>
            <Layout>
              <SubjectSelect />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={['teacher']}>
            <Layout>
              <TeacherDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
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
