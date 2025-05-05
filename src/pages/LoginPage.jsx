import { useState, useEffect } from 'react';
import { FiArrowRight, FiUserPlus } from 'react-icons/fi';
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
    
    if (isRegistering) {
      // Handle registration
      if (!email || !password || !name || !confirmPassword) {
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
            
            <h1 className="login-title">{isRegistering ? 'Create Account' : 'Invoice Generator'}</h1>
            
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              {isRegistering && (
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter your full name"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
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
                    <label className="form-label" htmlFor="phone">Phone Number</label>
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
                    <label className="form-label" htmlFor="position">Position/Title</label>
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
                <label className="form-label" htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {isRegistering && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              
              {!isRegistering && (
                <a href="#" className="forgot-link">Forgot Password ?</a>
              )}
              
              <button 
                type="submit" 
                className="login-button" 
                disabled={isLoading}
              >
                {isLoading ? 'LOADING...' : (isRegistering ? 'REGISTER' : 'LOGIN')} {!isLoading && <FiArrowRight />}
              </button>
              
              <div className="mode-toggle">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
                <a href="#" onClick={toggleMode}>
                  {isRegistering ? 'Login' : 'Register now'}
                </a>
              </div>
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