import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import InvoicePage from './pages/InvoicePage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import DiagnosticPage from './pages/DiagnosticPage'
import DebugPage from './pages/DebugPage'
import DemoPage from './pages/DemoPage'
import CompanyPage from './pages/CompanyPage'
import NotificationDisplay from './components/ErrorDisplay'
import Modal from './components/Modal'
import { useNotification } from './context/ErrorContext'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [sessionTimer, setSessionTimer] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { notification, setNotification, clearNotification } = useNotification()
  const navigate = useNavigate()
  const location = useLocation()

  // Check authentication and dark mode on initial load
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsAuthenticated(isLoggedIn)
    
    // Check dark mode preference, default to true if not set
    const darkModeInStorage = localStorage.getItem('darkMode')
    const savedDarkMode = darkModeInStorage === null ? true : darkModeInStorage === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.body.classList.add('dark-mode')
    }

    // Setup global error handler
    window.addEventListener('error', handleGlobalError)
    return () => {
      window.removeEventListener('error', handleGlobalError)
    }
  }, [])

  // Handle global errors
  const handleGlobalError = (event) => {
    console.error('Global error:', event.error)
    const errorMessage = event.error ? event.error.message : 'Unknown error'
    setNotification(`Error: ${errorMessage}`, 'error')
  }

  // Update body class when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Setup session timeout
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any existing timer
      if (sessionTimer) clearTimeout(sessionTimer)
      
      // Start new timer
      const timer = setTimeout(() => {
        // Get last active time from local storage
        const lastActivity = localStorage.getItem('lastActivity')
        const now = new Date().getTime()
        
        // If it's been too long since the last activity, log the user out
        if (lastActivity && now - parseInt(lastActivity) > SESSION_TIMEOUT) {
          handleLogout()
          setNotification('Your session has expired. Please log in again.', 'warning')
        }
      }, SESSION_TIMEOUT)
      
      setSessionTimer(timer)
      
      // Update last activity time
      localStorage.setItem('lastActivity', new Date().getTime().toString())
    }
    
    return () => {
      if (sessionTimer) clearTimeout(sessionTimer)
    }
  }, [isAuthenticated, location])

  // Redirect based on authentication status
  useEffect(() => {
    // Only redirect for main app routes that require authentication
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/dashboard')
    } else if (isAuthenticated && location.pathname === '/') {
      navigate('/dashboard')
    } else if (!isAuthenticated && 
              location.pathname !== '/login' && 
              location.pathname !== '/demo' && 
              location.pathname !== '/debug' && 
              location.pathname !== '/diagnostic') {
      navigate('/login')
    }
  }, [isAuthenticated, location.pathname, navigate])

  const handleLogin = (email) => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userEmail', email)
    localStorage.setItem('lastLogin', new Date().toString())
    localStorage.setItem('lastActivity', new Date().getTime().toString())
    setIsAuthenticated(true)
    navigate('/')
  }

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setShowLogoutModal(false);
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode)
  }

  return (
    <div className="App">
      {notification && (
        <NotificationDisplay 
          notification={notification} 
          onClose={() => clearNotification()} 
          duration={5000} 
        />
      )}
      
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Confirm Logout"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </button>
            <button className="btn" onClick={confirmLogout}>
              Logout
            </button>
          </>
        }
      >
        <p>Are you sure you want to sign out? Any unsaved changes will be lost.</p>
      </Modal>
      
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <LoginPage onLogin={handleLogin} />
        } />
        
        <Route path="/dashboard" element={
          isAuthenticated ? 
            <DashboardPage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/invoice/:id" element={
          isAuthenticated ? 
            <InvoicePage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/invoice/new" element={
          isAuthenticated ? 
            <InvoicePage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/profile" element={
          isAuthenticated ? 
            <ProfilePage /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/company" element={
          isAuthenticated ? 
            <CompanyPage 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />

        {/* Debug and diagnostic routes - no auth required */}
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/demo" element={<DemoPage />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
