import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
// You might want to create a specific CSS file for this page or use existing styles
// import './UpdatePasswordPage.css'; 

const UpdatePasswordPage = () => {
  const { updateUserPassword, loading, error: authError, user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // This page is typically accessed via a link with a token in the URL hash.
  // Supabase handles the token verification automatically when updateUser is called
  // after the user has clicked the reset link and is redirected here.

  useEffect(() => {
    // If the user is not logged in (which they shouldn't be to reset password, usually)
    // but Supabase JS client might pick up a session if one was recently active.
    // The key is that the reset token (from email link) allows password update.
    // If a user *is* logged in and somehow lands here, they can update their password.
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await updateUserPassword(password);
      setSuccessMessage('Password updated successfully! You can now log in with your new password.');
      // Clear form fields
      setPassword('');
      setConfirmPassword('');
      // Optionally, redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password. The reset link may be invalid or expired.');
      console.error("Update password error:", err);
    }
  };

  return (
    <div className="login-page-light-mode" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="login-container" style={{ maxWidth: '400px' }}>
        <div className="login-card">
          <div className="login-content">
            <h1 className="login-title">Update Your Password</h1>
            <p className="login-subtitle">Enter your new password below.</p>

            {error && <div className="error-message" style={{ marginBottom: '15px' }}>{error}</div>}
            {authError && <div className="error-message" style={{ marginBottom: '15px' }}>{authError.message}</div>}
            {successMessage && <div className="success-message" style={{ marginBottom: '15px', backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '4px' }}>{successMessage}</div>}
            
            {!successMessage && (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    <FiLock className="input-icon" />
                    New Password *
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      placeholder="Enter new password"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span onClick={() => setShowPassword(!showPassword)} className="password-toggle" style={{ cursor: 'pointer' }}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    <FiLock className="input-icon" />
                    Confirm New Password *
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle" style={{ cursor: 'pointer' }}>
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </span>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Updating Password...' : 'Update Password'}
                  {!loading && <FiArrowRight className="icon-arrow" />}
                </button>
              </form>
            )}
             {successMessage && (
                <button 
                    onClick={() => navigate('/login')} 
                    className="btn btn-secondary btn-block" 
                    style={{marginTop: '10px'}}
                >
                    Go to Login
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
