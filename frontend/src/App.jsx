import { useEffect, useState } from 'react'
import './App.css'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'

const AUTH_STORAGE_KEY = 'auth_session'
const THEME_STORAGE_KEY = 'ui_theme'

function getStoredSession() {
  try {
    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!rawSession) return { user: null, token: null }

    const parsedSession = JSON.parse(rawSession)

    return {
      user: parsedSession?.user ?? null,
      token: parsedSession?.token ?? null,
    }
  } catch {
    return { user: null, token: null }
  }
}

function App() {
  const [view, setView] = useState('login')
  const [user, setUser] = useState(() => getStoredSession().user)
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!user) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return
    }

    const currentSession = getStoredSession()

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user,
        token: currentSession.token,
      }),
    )
  }, [user])

  const handleAccess = (session) => {
    const authenticatedUser = session?.user ?? session ?? null
    const token = session?.token ?? null

    if (!authenticatedUser) return

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: authenticatedUser,
        token,
      }),
    )

    setUser(authenticatedUser)
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUser(null)
    setView('login')
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <main className="app-shell">
      {!user ? (
        <AuthPage mode={view} onModeChange={setView} onAccess={handleAccess} />
      ) : (
        <DashboardPage user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
      )}
    </main>
  )
}

export default App
