import { useState, useEffect, useRef } from 'react'
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
import ClientPage from './pages/ClientPage'
import BinPage from './pages/BinPage'
import DescriptionPage from './pages/DescriptionPage'
import NotificationDisplay from './components/ErrorDisplay'
import Modal from './components/Modal'
import { useNotification } from './context/ErrorContext'
import SoundEffects from './utils/soundEffects'

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
  const appRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Mouse parallax effect handler
  const handleMouseMove = (e) => {
    if (!appRef.current) return;
    
    // Get all elements with mouse-parallax class
    const parallaxElements = document.querySelectorAll('.mouse-parallax');
    
    // Calculate mouse position relative to center of screen
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    // Apply transform to each element based on its layer
    parallaxElements.forEach(el => {
      const depth = el.dataset.depth || 10;
      const moveX = mouseX * depth;
      const moveY = mouseY * depth;
      el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    });
  };

  // Initial loading effect
  useEffect(() => {
    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    // Initialize sound effects
    SoundEffects.init();
    
    return () => {
      // Clean up any ongoing sound processes if needed
    };
  }, []);

  // Initialize and preload sound effects
  useEffect(() => {
    // Preload sound effects for better performance
    SoundEffects.preload();
    
    // Initialize the sound effect system
    SoundEffects.init();

    // Show loading animation for a brief moment
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  }, []);

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

    // Update all users with position "client" to "Invoicing Associate"
    updateUserPositions();

    // Setup global error handler
    window.addEventListener('error', handleGlobalError)
    
    // Setup mouse parallax effect
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Function to update user positions from "client" to "Invoicing Associate"
  const updateUserPositions = () => {
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let updated = false;

    // Update any user with position "client" to "Invoicing Associate" (if they're not admin)
    const updatedUsers = users.map(user => {
      if (user.position && user.position.toLowerCase() === 'client' && user.role !== 'admin') {
        updated = true;
        return {
          ...user,
          position: 'Invoicing Associate'
        };
      }
      return user;
    });

    // Save back to localStorage if any user was updated
    if (updated) {
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      console.log('Updated users with position "client" to "Invoicing Associate"');
    }

    // Also update current user if needed
    const currentUserId = localStorage.getItem('userId');
    const currentUserPosition = localStorage.getItem('userPosition');
    const currentUserRole = localStorage.getItem('userRole');
    
    if (currentUserId && 
        currentUserPosition && 
        currentUserPosition.toLowerCase() === 'client' &&
        currentUserRole !== 'admin') {
      localStorage.setItem('userPosition', 'Invoicing Associate');
    }
  };

  // Handle global errors
  const handleGlobalError = (event) => {
    console.error('Global error:', event.error)
    const errorMessage = event.error ? event.error.message : 'Unknown error'
    setNotification(`Error: ${errorMessage}`, 'error')
    SoundEffects.play('ERROR');
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

  const handleLogin = (email, userId, userName, phone, position, role) => {
    // Store role in localStorage
    localStorage.setItem('userRole', role || 'user');
    
    // Set default position based on role
    let finalPosition = position;
    
    // If position is not provided, set default based on role
    if (!finalPosition || finalPosition === '') {
      if (role === 'admin') {
        finalPosition = 'Admin';
      } else {
        finalPosition = 'Invoicing Associate';
      }
    }
    
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userEmail', email)
    localStorage.setItem('userId', userId || 'demo_user')
    localStorage.setItem('userName', userName || email.split('@')[0])
    localStorage.setItem('userPhone', phone || '')
    localStorage.setItem('userPosition', finalPosition)
    localStorage.setItem('lastLogin', new Date().toString())
    localStorage.setItem('lastActivity', new Date().getTime().toString())
    setIsAuthenticated(true)
    
    // Play success sound on successful login
    SoundEffects.play('SUCCESS');
    
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
    
    // Play switch sound effect
    SoundEffects.play('SWITCH');
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode)
    SoundEffects.play('SWITCH');
  }

  if (isLoading) {
    return (
      <div className="loading-page">
        <img 
          src="/images/c-logo.png" 
          alt="Loading" 
          className="loading-logo" 
          style={{ 
            width: "80px", 
            height: "80px",
            animation: "pulse 2s infinite ease-in-out"
          }} 
        />
        <div className="loading-dots">
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
          <div className="loading-dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="App" ref={appRef}>
      {/* Floating background shapes */}
      <div className="floating-elements">
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
        <div className="floating-shape"></div>
      </div>
      
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
        
        <Route path="/bin" element={
          isAuthenticated ? 
            <BinPage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />

        <Route path="/client" element={
          isAuthenticated ? 
            <ClientPage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />

        <Route path="/description" element={
          isAuthenticated ? 
            <DescriptionPage 
              onLogout={handleLogout} 
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
