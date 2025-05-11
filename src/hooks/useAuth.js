import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import storage from '../utils/storage';
import { APP_CONFIG } from '../config/appConfig';

/**
 * Custom hook for authentication management
 * @returns {Object} Authentication methods and state
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [sessionTimer, setSessionTimer] = useState(null);
  const navigate = useNavigate();

  // Check authentication on initial load
  useEffect(() => {
    const isLoggedIn = storage.get('isLoggedIn') === true;
    setIsAuthenticated(isLoggedIn);
    
    if (isLoggedIn) {
      setUserEmail(storage.get('userEmail', ''));
    }
  }, []);

  // Set up session timeout monitoring
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any existing timer
      if (sessionTimer) clearTimeout(sessionTimer);
      
      // Start new timer
      const timer = setTimeout(() => {
        const lastActivity = storage.get('lastActivity');
        const now = new Date().getTime();
        
        if (lastActivity && now - lastActivity > APP_CONFIG.auth.sessionTimeout) {
          logout();
        }
      }, APP_CONFIG.auth.sessionTimeout);
      
      setSessionTimer(timer);
      storage.updateLastActivity();
    }
    
    return () => {
      if (sessionTimer) clearTimeout(sessionTimer);
    };
  }, [isAuthenticated, navigate]);

  // Login method
  const login = (email) => {
    storage.set('isLoggedIn', true);
    storage.set('userEmail', email);
    storage.set('lastLogin', new Date().toString());
    storage.updateLastActivity();
    setIsAuthenticated(true);
    setUserEmail(email);
  };

  // Logout method
  const logout = () => {
    storage.remove('isLoggedIn');
    storage.remove('userEmail');
    setIsAuthenticated(false);
    setUserEmail('');
  };

  // Return auth state and methods
  return {
    isAuthenticated,
    userEmail,
    login,
    logout,
    updateActivity: storage.updateLastActivity
  };
};

export default useAuth;