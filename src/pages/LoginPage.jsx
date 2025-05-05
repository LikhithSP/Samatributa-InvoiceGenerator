import { useState, useEffect, useRef } from 'react';
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const loginCardRef = useRef(null);

  // Force light mode for login page
  useEffect(() => {
    // Store the original dark mode state
    const wasDarkMode = document.body.classList.contains('dark-mode');
    
    // Force remove dark mode class while on login page
    document.body.classList.remove('dark-mode');
    
    // Add entrance animation class
    setTimeout(() => {
      document.querySelector('.login-card')?.classList.add('visible');
      
      // Add floating shapes with staggered animation
      const shapes = document.querySelectorAll('.floating-shape');
      shapes.forEach((shape, index) => {
        setTimeout(() => {
          shape.style.opacity = '0.5';
        }, index * 200);
      });
    }, 100);
    
    // Cleanup function to restore original mode when component unmounts
    return () => {
      if (wasDarkMode) {
        document.body.classList.add('dark-mode');
      }
    };
  }, []);

  // Handle 3D parallax effect on card
  useEffect(() => {
    const card = loginCardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate rotation based on mouse position (subtle effect)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 30;
      const rotateY = (centerX - x) / 30;
      
      // Apply 3D transform
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;
      
      // Move illustration slightly in opposite direction for parallax effect
      const illustration = card.querySelector('.illustration');
      if (illustration) {
        illustration.style.transform = `translate3d(${(centerX - x) / 15}px, ${(centerY - y) / 15}px, 0)`;
      }
    };
    
    const handleMouseLeave = () => {
      // Reset to initial position with smooth transition
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      
      const illustration = card.querySelector('.illustration');
      if (illustration) {
        illustration.style.transform = 'translate3d(0, 0, 0)';
      }
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + (100 - prev) / 10;
          return next > 90 ? 90 : next;
        });
      }, 100);
      
      return () => {
        clearInterval(interval);
        setLoadingProgress(0);
      };
    }
  }, [isLoading]);

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
        // Show 100% complete briefly before logging in
        setLoadingProgress(100);
        setTimeout(() => {
          // Pass the finalized position value and role
          onLogin(email, newUser.id, newUser.name, phone, newUser.position, newUser.role);
          setIsLoading(false);
        }, 400);
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
          // Show 100% complete briefly before logging in
          setLoadingProgress(100);
          setTimeout(() => {
            // Pass the user role along with other user info to ensure position is set correctly
            onLogin(email, user.id, user.name, user.phone || '', user.position || '', user.role || 'user');
            setIsLoading(false);
          }, 400);
        }, 1000);
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
      }
    }
  };
  
  const toggleMode = (e) => {
    e.preventDefault();
    
    // Add animation class for transition
    const card = loginCardRef.current;
    if (card) {
      card.classList.add('flip-animation');
      setTimeout(() => {
        setIsRegistering(!isRegistering);
        setTimeout(() => {
          card.classList.remove('flip-animation');
        }, 50);
      }, 300);
    } else {
      setIsRegistering(!isRegistering);
    }
    
    setError('');
  };

  return (
    <div className="login-page-light-mode parallax-container">
      {/* Floating background shapes */}
      <div className="login-floating-elements">
        <div className="floating-shape" style={{ opacity: 0 }}></div>
        <div className="floating-shape" style={{ opacity: 0 }}></div>
        <div className="floating-shape" style={{ opacity: 0 }}></div>
        <div className="floating-shape" style={{ opacity: 0 }}></div>
        <div className="floating-shape" style={{ opacity: 0 }}></div>
      </div>
      
      <div className="login-container">
        <div className="login-card" ref={loginCardRef}>
          {/* Left Content */}
          <div className="login-content">
            <div className="brand parallax-layer-1">
              <div className="brand-dots">
                <div className="dot dot-black"></div>
                <div className="dot dot-gray"></div>
                <div className="dot dot-yellow"></div>
              </div>
              <span className="brand-name">Sama Tributa Solutions</span>
            </div>
            
            <h1 className="login-title parallax-layer-2">{isRegistering ? 'Create Account' : 'Invoice Generator'}</h1>
            
            <form onSubmit={handleSubmit} className="parallax-layer-1">
              {error && (
                <div className="error-message animated-error">
                  {error}
                </div>
              )}
              
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
                {isLoading ? (
                  <div className="button-loader">
                    <div className="button-progress-bar">
                      <div 
                        className="button-progress-fill"
                        style={{ width: `${loadingProgress}%` }} 
                      />
                    </div>
                    <span>LOADING</span>
                  </div>
                ) : (
                  <>
                    {isRegistering ? 'REGISTER' : 'LOGIN'} <FiArrowRight className="button-icon" />
                  </>
                )}
              </button>
              
              <div className="mode-toggle">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
                <a href="#" onClick={toggleMode} className="toggle-link">
                  {isRegistering ? 'Login' : 'Register now'}
                </a>
              </div>
            </form>
          </div>
          
          {/* Right Image */}
          <div className="login-image parallax-layer-2">
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