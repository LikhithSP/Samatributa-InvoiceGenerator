import React, { useState, useEffect } from 'react'; // Removed useCallback and useNavigate as they are not directly used here
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ErrorProvider } from './context/ErrorContext';
import { NotificationProvider } from './context/NotificationContext';
import { UserNotificationsProvider } from './context/UserNotificationsContext';
import { UserRoleProvider } from './context/UserRoleContext'; // Consider if this is still needed or if role comes from useAuth().profile
import useAuth from './hooks/useAuth';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ClientPage from './pages/ClientPage';
import CompanyPage from './pages/CompanyPage';
import InvoicePage from './pages/InvoicePage';
import BinPage from './pages/BinPage';
import DescriptionPage from './pages/DescriptionPage';
import DemoPage from './pages/DemoPage';
import NotFoundPage from './pages/NotFoundPage';
import DebugPage from './pages/DebugPage';
import DiagnosticPage from './pages/DiagnosticPage';
import MessageInbox from './pages/MessageInbox';
import UpdatePasswordPage from './pages/UpdatePasswordPage'; // Import the new page

import './App.css';

// ProtectedRoute component to handle authentication checks
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { user, profile, loading: authLoading } = useAuth(); // Added profile from useAuth
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Potential: Set dark mode based on user profile preferences if stored
    // if (profile && typeof profile.darkModePreference !== 'undefined') {
    //   setDarkMode(profile.darkModePreference);
    // } else {
    //   // Fallback to OS preference or default
    //   const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    //   setDarkMode(prefersDark);
    // }
  }, [profile]); // Re-run if profile changes

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' }}>Loading application...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <ErrorProvider>
        <NotificationProvider>
          {/* Pass Supabase user ID. If user is null, userId will be undefined, which is fine. */}
          <UserNotificationsProvider userId={user?.id}> 
            {/* UserRoleProvider might need to be adapted or use profile from useAuth directly */}
            {/* If roles are in profile, UserRoleContext might consume useAuth().profile */}
            <UserRoleProvider>
              <Router>
                <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
                  {/* 
                    Consider a global Navbar component here that could receive 
                    user, profile, logout, darkMode, toggleDarkMode 
                  */}
                  {/* Example: 
                  {user && <Navbar user={user} profile={profile} logout={logout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} 
                  */}
                  
                  <Routes>
                    <Route 
                      path="/login" 
                      element={!user ? <LoginPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> : <Navigate to="/dashboard" replace />}
                    />
                    <Route path="/update-password" element={<UpdatePasswordPage />} /> {/* Add route for password update */}
                    
                    {/* Publicly accessible informative pages */}
                    <Route path="/description" element={<DescriptionPage />} />
                    <Route path="/demo" element={<DemoPage />} />

                    {/* Protected Routes using the ProtectedRoute component */}
                    <Route 
                      path="/dashboard" 
                      element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/profile" 
                      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/clients" 
                      element={<ProtectedRoute><ClientPage /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/company" 
                      element={<ProtectedRoute><CompanyPage /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/invoices" 
                      element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/bin" 
                      element={<ProtectedRoute><BinPage /></ProtectedRoute>} 
                    />
                    <Route 
                      path="/debug" 
                      element={<ProtectedRoute><DebugPage /></ProtectedRoute>} 
                    />
                     <Route 
                      path="/diagnostic" 
                      element={<ProtectedRoute><DiagnosticPage /></ProtectedRoute>} 
                    />
                     <Route 
                      path="/messages" 
                      element={<ProtectedRoute><MessageInbox /></ProtectedRoute>} 
                    />
                    
                    {/* Fallback: if logged in, go to dashboard, else to login */}
                    <Route 
                      path="/" 
                      element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
                    />
                    {/* Catch-all for unmatched routes */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </div>
              </Router>
            </UserRoleProvider>
          </UserNotificationsProvider>
        </NotificationProvider>
      </ErrorProvider>
    </DndProvider>
  );
}

export default App;
