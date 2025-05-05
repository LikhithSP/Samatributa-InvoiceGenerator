import { useState, useEffect, useRef } from 'react';
import { FiArrowRight, FiUserPlus, FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import './LoginPage.css'; // Import the CSS file

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formAnimation, setFormAnimation] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  
  // Refs for form fields
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const nameRef = useRef(null);

  // Force light mode for login page and set up animations
  useEffect(() => {
    // Store the original dark mode state
    const wasDarkMode = document.body.classList.contains('dark-mode');
    
    // Force remove dark mode class while on login page
    document.body.classList.remove('dark-mode');
    
    // Trigger animation after component mounts
    setTimeout(() => setFadeIn(true), 100);
    
    // Cleanup function to restore original mode when component unmounts
    return () => {
      if (wasDarkMode) {
        document.body.classList.add('dark-mode');
      }
    };
  }, []);

  // Animation for form switch
  useEffect(() => {
    // Briefly show animation class and then remove it
    setFormAnimation(true);
    const timer = setTimeout(() => setFormAnimation(false), 500);
    
    // Focus on the appropriate field after switching form mode
    setTimeout(() => {
      if (isRegistering && nameRef.current) {
        nameRef.current.focus();
      } else if (!isRegistering && emailRef.current) {
        emailRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isRegistering]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering) {
      // Handle registration
      if (!email || !password || !confirmPassword || !name) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      setIsLoading(true);
      
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const userExists = users.some(user => user.email === email);
      
      if (userExists) {
        setError('User with this email already exists');
        setIsLoading(false);
        return;
      }
      
      // Add new user with phone and position fields
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        name,
        phone,
        // Set position to "Invoicing Associate" as default if not specified
        position: position || 'Invoicing Associate',
        password, // In a real app, you'd hash this password
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Auto-login after registration
      setTimeout(() => {
        // Pass the finalized position value and role
        onLogin(email, newUser.id, newUser.name, phone, newUser.position, newUser.role);
        setIsLoading(false);
      }, 1000);
      
    } else {
      // Handle login
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      
      setIsLoading(true);
      
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users')) || [];
      
      // Check credentials
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        setTimeout(() => {
          // Save user info to localStorage for context sync
          localStorage.setItem('userId', user.id);
          localStorage.setItem('userEmail', user.email);
          localStorage.setItem('userPosition', user.position || '');
          localStorage.setItem('userRole', user.role || 'user');
          // Dispatch login event so UserRoleContext updates immediately
          window.dispatchEvent(new Event('login'));
          // Pass the user role along with other user info to ensure position is set correctly
          onLogin(email, user.id, user.name, user.phone || '', user.position || '', user.role || 'user');
          setIsLoading(false);
        }, 1000);
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
      }
    }
  };
  
  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    // Reset password visibility when switching modes
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className={`login-page-light-mode ${fadeIn ? 'fade-in' : ''}`}>
      <div className="login-container">
        <div className={`login-card ${formAnimation ? 'form-change' : ''}`}>
          {/* Left Content */}
          <div className="login-content">
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
            
            <h1 className="login-title">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="login-subtitle">
              {isRegistering 
                ? 'Register to access our invoice generation system' 
                : 'Access the invoice generator with your account'}
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
              {isRegistering && (
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
                  />
                </div>
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
                />
              </div>
              
              {isRegistering && (
                <>
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
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="position">
                      <FiBriefcase className="input-icon" />
                      Position/Title
                    </label>
                    <input
                      type="text"
                      id="position"
                      placeholder="Enter your job title"
                      className="form-input"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  <FiLock className="input-icon" />
                  Password *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    ref={passwordRef}
                    placeholder="Enter your password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              
              {isRegistering && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    <FiLock className="input-icon" />
                    Confirm Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                {!isRegistering && (
                  <div className="remember-forgot">
                    <div className="remember-me">
                      <input type="checkbox" id="rememberMe" />
                      <label htmlFor="rememberMe">Remember me</label>
                    </div>
                    <a href="#" className="forgot-link">Forgot Password?</a>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="login-button" 
                  disabled={isLoading}
                >
                  <span className="button-text">
                    {isLoading ? 'PROCESSING...' : (isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN')}
                  </span>
                  {!isLoading && <FiArrowRight className="button-icon" />}
                  <div className={`spinner ${isLoading ? 'active' : ''}`}></div>
                </button>
                
                <div className="mode-toggle">
                  {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
                  <a href="#" onClick={toggleMode} className="toggle-link">
                    {isRegistering ? 'Sign in' : 'Create account'}
                  </a>
                </div>
              </div>
            </form>
          </div>
          
          {/* Right Image */}
          <div className="login-image">
            <div className="image-overlay">
              <h2 className="overlay-title">
                {isRegistering ? 'Join the Platform' : 'Invoice Generator'}
              </h2>
              <p className="overlay-text">
                {isRegistering 
                  ? 'Create invoices, manage clients, and grow business using this platform.' 
                  : 'Now generate professional invoices within minutes with our easy-to-use platform.'}
              </p>
            </div>
            <img 
              src="https://v3.fal.media/files/koala/mCAx4qKIsxgRSmqzm7th4.png" 
              alt="Person using laptop" 
              className="illustration"
            />
          </div>
        </div>
        
        <div className="login-footer">
          <p>&copy; {new Date().getFullYear()} Sama Tributa Solutions. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;