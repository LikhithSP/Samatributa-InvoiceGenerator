import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { FiArrowRight, FiUserPlus, FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiEye, FiEyeOff, FiSun, FiMoon, FiArrowLeft } from 'react-icons/fi';
import './LoginPage.css'; // Import the CSS file
import useAuth from '../hooks/useAuth';

const LoginPage = ({ darkMode, toggleDarkMode }) => { // Removed onLogin prop
  const { login, signUp, loading, error: authError, sendPasswordResetEmail } = useAuth(); // Added sendPasswordResetEmail
  const navigate = useNavigate(); // Initialize useNavigate

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  // const [isLoading, setIsLoading] = useState(false); // Removed unused isLoading state
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formAnimation, setFormAnimation] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState(''); // For forgot password feedback

  // Refs for form fields
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const nameRef = useRef(null);

  // ... existing useEffect for fadeIn ...
  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  // ... existing useEffect for popstate ...
  useEffect(() => {
    const handlePopState = (event) => {
      const newIsRegistering = event.state ? event.state.isRegistering : window.location.hash === '#register';
      if (isRegistering !== newIsRegistering) {
        setIsRegistering(newIsRegistering);
        setError('');
        setForgotPasswordMessage(''); // Clear forgot password message on mode toggle
        setShowPassword(false);
        setShowConfirmPassword(false);
        // Trigger form change animation
        setFormAnimation(true);
        setTimeout(() => setFormAnimation(false), 500);
      }
    };

    // Initial setup based on URL hash
    const initialIsRegistering = window.location.hash === '#register';
    if (isRegistering !== initialIsRegistering) {
        setIsRegistering(initialIsRegistering);
    }
    // Ensure history state matches the component state
    window.history.replaceState({ isRegistering: initialIsRegistering }, '', window.location.href);

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // isRegistering removed from deps as it's managed internally by popstate

  // ... existing useEffect for formAnimation and focus ...
  useEffect(() => {
    if (formAnimation) { // Only run focus logic if formAnimation was triggered
      setTimeout(() => {
        if (isRegistering && nameRef.current) {
          nameRef.current.focus();
        } else if (!isRegistering && emailRef.current) {
          emailRef.current.focus();
        }
      }, 100); // Delay focus slightly after animation starts
    }
  }, [formAnimation, isRegistering]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setForgotPasswordMessage(''); // Clear forgot password message on new submission
    try {
      if (isRegistering) {
        if (!email || !password || !confirmPassword || !name) {
          setError('Please fill in all required fields');
          return;
        }
        
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        const metadata = {
          full_name: name,
          phone: phone || null, // Pass null if empty, assuming DB handles it
          position: position || null, // Pass null if empty
        };
        await signUp(email, password, metadata);
        alert('Sign up successful! Please check your email for verification.'); 
        // Reset form fields after successful sign-up
        setName('');
        setEmail('');
        setPhone('');
        setPosition('');
        setPassword('');
        setConfirmPassword('');
        setIsRegistering(false); // Switch to login form
        // Update URL to reflect login mode
        if (window.location.hash === '#register') {
            window.history.pushState({ isRegistering: false }, 'Sign In', window.location.pathname);
        } else {
            window.history.replaceState({ isRegistering: false}, 'Sign In', window.location.pathname);
        }

      } else { // Logging in
        if (!email || !password) {
          setError('Please enter both email and password.');
          return;
        }
        await login(email, password);
        // On successful login, the useAuth hook updates user state.
        // App.jsx should have a listener for user state to redirect.
        // Or, we can navigate explicitly here.
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      console.error("Auth error:", err);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setError('');
    setForgotPasswordMessage('');
    try {
      await sendPasswordResetEmail(email);
      setForgotPasswordMessage('Password reset email sent! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
      console.error("Forgot password error:", err);
    }
  };

  const toggleMode = (e) => {
    if (e) e.preventDefault(); 

    const newIsRegistering = !isRegistering;
    
    setIsRegistering(newIsRegistering);
    setError('');
    setForgotPasswordMessage(''); // Clear forgot password message
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormAnimation(true); 
    setTimeout(() => setFormAnimation(false), 500);

    if (newIsRegistering) {
      window.history.pushState({ isRegistering: true }, 'Create Account', '#register');
    } else {
      if (window.location.hash === '#register') {
        window.history.pushState({ isRegistering: false }, 'Sign In', window.location.pathname);
      } else {
        window.history.replaceState({ isRegistering: false}, 'Sign In', window.location.pathname);
      }
    }
  };

  // ... existing JSX structure ...
  // Modify the form part to include "Forgot Password" link
  // and ensure loading state disables relevant elements.

  return (
    <div className={`login-page-light-mode ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      <div className="theme-switch-wrapper login-theme-switch">
        {/* ... theme switch jsx ... */}
        <label className="theme-switch">
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
          <span className="slider">
            <span className="sun-icon"><FiSun /></span>
            <span className="moon-icon"><FiMoon /></span>
          </span>
        </label>
      </div>
      <div className="login-container">
        <div className={`login-card ${formAnimation ? 'form-change' : ''}`}>
          <div className="login-content">
            {/* ... brand and title jsx ... */}
            <div className="brand">
              <div className="brand-logo">
                <div className="brand-dots">
                  <div className="dot dot-black"></div>
                  <div className="dot dot-gray"></div>
                  <div className="dot dot-yellow"></div>
                </div>
              </div>
              <span className="brand-name">Sama Tributa Solutions</span>
            </div>
            
            <h1 className="login-title">{isRegistering ? 'Create Account' : 'Sign In'}</h1>
            <p className="login-subtitle">
              {isRegistering 
                ? 'Register to access our invoice generation system' 
                : 'Access the invoice generator with your account'}
            </p>
            
            {error && <div className="error-message">{error}</div>}
            {authError && <div className="error-message">{authError.message}</div>}
            {forgotPasswordMessage && <div className="success-message">{forgotPasswordMessage}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
              {isRegistering && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">
                      <FiUser className="input-icon" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      ref={nameRef}
                      placeholder="Enter your full name"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  {/* Email field is common, shown below */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">
                      <FiPhone className="input-icon" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="Enter your phone number"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="position">
                      <FiBriefcase className="input-icon" />
                      Position / Role
                    </label>
                    <input
                      type="text"
                      id="position"
                      placeholder="Enter your position or role"
                      className="form-input"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  <FiMail className="input-icon" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  ref={emailRef}
                  placeholder="Enter your email address"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  <FiLock className="input-icon" />
                  Password *
                </label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    ref={passwordRef}
                    placeholder="Enter your password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <span onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </div>

              {isRegistering && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    <FiLock className="input-icon" />
                    Confirm Password *
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle">
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>
              )}
              
              {!isRegistering && (
                <div className="form-options">
                  {/* <label className="remember-me">
                    <input type="checkbox" /> Remember me
                  </label> */}
                  <a href="#" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }} className="forgot-password-link">
                    Forgot Password?
                  </a>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? (isRegistering ? 'Creating Account...' : 'Signing In...') : (isRegistering ? 'Create Account' : 'Sign In')}
                {!loading && <FiArrowRight className="icon-arrow" />}
              </button>
            </form>
            
            <div className="form-footer">
              {isRegistering ? (
                <p>Already have an account? <a href="#" onClick={toggleMode}>Sign In <FiArrowLeft className="icon-arrow-left"/></a></p>
              ) : (
                <p>Don't have an account? <a href="#" onClick={toggleMode}>Create Account <FiUserPlus className="icon-plus"/></a></p>
              )}
            </div>
          </div>
          {/* Right Image/Illustration Part - No changes needed here */}
          <div className="login-illustration">
            <div className="illustration-overlay"></div>
            {/* You can add an image or illustration here */}
            {/* For example: <img src="/path-to-your-illustration.svg" alt="Illustration" /> */}
            <div className="illustration-text">
                <h2>Streamline Your Invoicing</h2>
                <p>Efficient, reliable, and integrated with modern solutions.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

// Ensure LoginPage.css has styles for .success-message if it doesn't exist
/* Example for .success-message in LoginPage.css:
.success-message {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.9em;
  text-align: center;
}
*/