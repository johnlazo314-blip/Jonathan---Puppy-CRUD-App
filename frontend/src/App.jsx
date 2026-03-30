import { useEffect, useState } from 'react'
import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import { initializeAuth, startLogin, startLogout } from './auth/asgardeo'
import './App.css'

function App() {
  const [authState, setAuthState] = useState({
    loading: true,
    isConfigured: true,
    isAuthenticated: false
  })

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      try {
        const next = await initializeAuth()
        if (isMounted) {
          setAuthState({
            loading: false,
            isConfigured: next.isConfigured,
            isAuthenticated: next.isAuthenticated
          })
        }
      } catch {
        if (isMounted) {
          setAuthState({ loading: false, isConfigured: false, isAuthenticated: false })
        }
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogin = async () => {
    await startLogin()
  }

  const handleLogout = async () => {
    await startLogout()
  }

  if (authState.loading) {
    return (
      <div className="app-shell">
        <Header />
        <main className="app-body">
          <section className="panel auth-panel">
            <h2>Checking sign in status...</h2>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  if (!authState.isConfigured || !authState.isAuthenticated) {
    return (
      <div className="app-shell">
        <Header />
        <main className="app-body">
          <section className="panel auth-panel">
            <h2>You need to log in to see records.</h2>
            <p>Sign in with Asgardeo to view and manage the puppy table.</p>
            <button className="btn" type="button" onClick={handleLogin}>
              Log In
            </button>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header onLogout={handleLogout} />
      <Body />
      <Footer />
    </div>
  )
}

export default App
