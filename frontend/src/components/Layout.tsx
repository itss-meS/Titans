import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { getRole, getStudentId, logout } from '../auth'
import api from '../api'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate()
  const role = getRole()
  const studentId = getStudentId()
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiHealthy, setAiHealthy] = useState<boolean | null>(null)
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    api.get('/health')
      .then((res) => setAiHealthy(res.data.ai === true))
      .catch(() => setAiHealthy(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const links = role === 'teacher'
    ? [{ label: 'Class Dashboard', path: '/teacher' }]
    : [{ label: 'My Report', path: `/students/${studentId}` }]

  return (
    <div className="min-h-screen bg-bg">
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div
          className="rounded-full border px-6 py-3 flex items-center justify-between gap-6"
          style={{
            background: 'var(--glass-bg)',
            borderColor: 'var(--glass-border)',
            backdropFilter: 'blur(18px) saturate(140%)',
          }}
        >
          <div className="font-display text-xl text-ink">GapDetector</div>

          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-sm text-ink hover:text-accent transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs font-mono tracking-wider text-mute capitalize">
              {role}
            </span>

            {role === 'student' && studentId && (
              <span className="hidden md:inline text-xs font-mono tracking-wider text-ink">
                {studentId}
              </span>
            )}

            <div className="flex items-center gap-1" title={aiHealthy ? 'AI service healthy' : 'AI service unavailable'}>
              <div
                className={`w-2 h-2 rounded-full ${aiHealthy ? 'bg-accent' : 'border border-accent'}`}
                aria-label={aiHealthy ? 'AI service healthy' : 'AI service unavailable'}
              ></div>
              <span className="sr-only">{aiHealthy ? 'AI healthy' : 'AI unavailable'}</span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-surface rounded-full transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
            </button>

            <button
              onClick={handleLogout}
              className="hidden md:inline-block text-sm text-ink hover:text-accent transition-colors duration-200"
            >
              Logout
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 hover:bg-surface rounded-full transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div
            className="md:hidden mt-2 rounded-lg border p-4 space-y-3"
            style={{
              background: 'var(--glass-bg)',
              borderColor: 'var(--glass-border)',
              backdropFilter: 'blur(18px) saturate(140%)',
            }}
          >
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path)
                  setMenuOpen(false)
                }}
                className="block w-full text-left text-sm text-ink hover:text-accent transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="block w-full text-left text-sm text-ink hover:text-accent transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
