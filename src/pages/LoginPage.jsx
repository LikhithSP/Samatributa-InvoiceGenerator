import { useState, useEffect } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import './LoginPage.css'; // Import the CSS file

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Force light mode for login page
  useEffect(() => {
    // Store the original dark mode state
    const wasDarkMode = document.body.classList.contains('dark-mode');
    
    // Force remove dark mode class while on login page
    document.body.classList.remove('dark-mode');
    
    // Cleanup function to restore original mode when component unmounts
    return () => {
      if (wasDarkMode) {
        document.body.classList.add('dark-mode');
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    // Simulating authentication
    setTimeout(() => {
      if (email === 'user@example.com' && password === 'password123') {
        onLogin(email);
      } else {
        setError('Invalid email or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  const fillDemoCredentials = (e) => {
    e.preventDefault();
    
    // First clear any previous errors
    setError('');
    
    // Update the form fields
    setEmail('user@example.com');
    setPassword('password123');
    
    // Provide visual feedback that fields were filled
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (emailInput && passwordInput) {
      // Briefly highlight the fields to show they've been filled
      emailInput.classList.add('highlight-input');
      passwordInput.classList.add('highlight-input');
      
      // Remove highlight after 800ms
      setTimeout(() => {
        emailInput.classList.remove('highlight-input');
        passwordInput.classList.remove('highlight-input');
      }, 800);
    }
  };
  

  return (
    <div className="login-page-light-mode">
      <div className="login-container">
        <div className="login-card">
          {/* Left Content */}
          <div className="login-content">
            <div className="brand">
              <div className="brand-dots">
                <div className="dot dot-black"></div>
                <div className="dot dot-gray"></div>
                <div className="dot dot-yellow"></div>
              </div>
              <span className="brand-name">Sama Tributa Solutions</span>
            </div>
            
            <h1 className="login-title">Invoice Generator</h1>
            
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email address"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <a href="#" className="forgot-link">Forgot Password ?</a>
              
              <button 
                type="submit" 
                className="login-button" 
                disabled={isLoading}
              >
                {isLoading ? 'LOADING...' : 'LOGIN'} {!isLoading && <FiArrowRight />}
              </button>
              
              <a href="#" className="demo-link" onClick={fillDemoCredentials}>
                Fill demo credentials
              </a>
            </form>
          </div>
          
          {/* Right Image */}
          <div className="login-image">
            <img 
              src="https://v3.fal.media/files/koala/mCAx4qKIsxgRSmqzm7th4.png" 
              alt="Person using laptop" 
              className="illustration"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;