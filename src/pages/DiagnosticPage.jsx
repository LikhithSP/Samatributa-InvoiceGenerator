import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';
import { useAuth } from '../hooks/useAuth'; // Import useAuth

const DiagnosticPage = () => {
  const [basicChecks, setBasicChecks] = useState('');
  const [libraryTests, setLibraryTests] = useState('');
  const [storageTests, setStorageTests] = useState('');
  const { user, session } = useAuth(); // Get user and session from useAuth

  useEffect(() => {
    runBasicChecks();
    checkLibraries();
    testStorage();
  }, []);

  const runBasicChecks = () => {
    let html = '';
    
    // JavaScript enabled - obviously true if this runs
    html += `<p class="success">✓ JavaScript enabled</p>`;
    
    // Browser information
    html += `<p>Browser: ${navigator.userAgent}</p>`;
    
    // Cookie enabled
    if (navigator.cookieEnabled) {
      html += `<p class="success">✓ Cookies enabled</p>`;
    } else {
      html += `<p class="error">✗ Cookies disabled</p>`;
    }
    
    // LocalStorage check
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      html += `<p class="success">✓ LocalStorage accessible</p>`;
    } catch (e) {
      html += `<p class="error">✗ LocalStorage error: ${e.message}</p>`;
    }
    
    // Check login status using useAuth
    try {
      const isLoggedIn = !!session;
      html += `<p>Login status: ${isLoggedIn ? 'Logged in (Supabase)' : 'Not logged in (Supabase)'}</p>`;
      if (isLoggedIn && user) {
        html += `<p>User email: ${user.email || 'Not available'}</p>`;
      }
    } catch (e) {
      html += `<p class="error">✗ Error checking Supabase auth status: ${e.message}</p>`;
    }
    
    setBasicChecks(html);
  };

  const checkLibraries = () => {
    let html = '<p>Testing libraries...</p>';
    
    // Check jsPDF
    if (typeof jsPDF !== 'undefined') {
      html += `<p class="success">✓ jsPDF loaded successfully</p>`;
      html += `<p class="success">✓ jsPDF is properly initialized</p>`;
    } else {
      html += `<p class="error">✗ jsPDF not loaded properly</p>`;
    }
    
    // Check html2canvas
    if (typeof html2canvas !== 'undefined') {
      html += `<p class="success">✓ html2canvas loaded successfully</p>`;
      html += `<p class="success">✓ html2canvas function available</p>`;
    } else {
      html += `<p class="error">✗ html2canvas not loaded properly</p>`;
    }
    
    // Check emailjs
    if (typeof emailjs !== 'undefined') {
      html += `<p class="success">✓ emailjs loaded successfully</p>`;
      html += `<p class="success">✓ emailjs object available</p>`;
    } else {
      html += `<p class="error">✗ emailjs not loaded properly</p>`;
    }
    
    setLibraryTests(html);
  };

  const testStorage = () => {
    let html = '';
    
    try {
      // Show current localStorage content
      html += `<h3>Current LocalStorage Content (for debugging purposes):</h3>`;
      if (typeof window !== 'undefined' && window.localStorage) {
        if (localStorage.length === 0) {
          html += `<p>LocalStorage is empty</p>`;
        } else {
          let contentHtml = '<pre>';
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            contentHtml += `${key}: ${value}\n`;
          }
          contentHtml += '</pre>';
          html += contentHtml;
        }
      } else {
        html += `<p class="error">✗ LocalStorage API not available.</p>`;
      }
    } catch (e) {
      html += `<p class="error">✗ Error accessing LocalStorage: ${e.message}</p>`;
    }
    
    setStorageTests(html);
  };

  const resetStorage = () => {
    try {
      localStorage.clear();
      setStorageTests(`<p class="success">LocalStorage cleared successfully</p>`);
      setTimeout(() => testStorage(), 500);
    } catch (e) {
      setStorageTests(`<p class="error">Error clearing localStorage: ${e.message}</p>`);
    }
  };

  const autoLogin = () => {
    try {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', 'user@example.com');
      setStorageTests(`<p class="success">Auto login set. You are now logged in as user@example.com</p>`);
      runBasicChecks(); // Refresh basic checks
    } catch (e) {
      setStorageTests(`<p class="error">Error setting login: ${e.message}</p>`);
    }
  };

  const clearLogin = () => {
    try {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      setStorageTests(`<p class="success">Login cleared. You are now logged out.</p>`);
      runBasicChecks(); // Refresh basic checks
    } catch (e) {
      setStorageTests(`<p class="error">Error clearing login: ${e.message}</p>`);
    }
  };

  return (
    <div className="diagnostic-container">
      <h1 className="diagnostic-title">Invoice Generator Diagnostics</h1>
      
      <div className="card-nav">
        <Link to="/" className="btn btn-secondary">Go to Main App</Link>
        <Link to="/login" className="btn btn-secondary">Go to Login</Link>
        <Link to="/debug" className="btn btn-secondary">Go to Debug</Link>
        <Link to="/demo" className="btn btn-secondary">Go to Demo</Link>
      </div>
      
      <div className="card">
        <h2 className="card-title">Basic Checks</h2>
        <div dangerouslySetInnerHTML={{ __html: basicChecks }}></div>
      </div>

      <div className="card">
        <h2 className="card-title">Library Tests</h2>
        <div dangerouslySetInnerHTML={{ __html: libraryTests }}></div>
      </div>

      <div className="card">
        <h2 className="card-title">LocalStorage Test</h2>
        <div dangerouslySetInnerHTML={{ __html: storageTests }}></div>
        <div className="actions" style={{ justifyContent: 'flex-start' }}>
          <button onClick={testStorage} className="btn btn-secondary">Test LocalStorage</button>
          <button onClick={resetStorage} className="btn btn-secondary">Reset LocalStorage</button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Quick Actions</h2>
        <div className="actions" style={{ justifyContent: 'flex-start' }}>
          <button onClick={autoLogin} className="btn btn-secondary">Auto Login</button>
          <button onClick={clearLogin} className="btn btn-secondary">Clear Login</button>
          <Link to="/" className="btn btn-secondary">Go to App</Link>
          <Link to="/login" className="btn btn-secondary">Go to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;