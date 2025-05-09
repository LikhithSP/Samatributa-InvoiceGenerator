import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiCamera, FiTrash2 } from 'react-icons/fi';
import { defaultLogo } from '../assets/logoData';
import Modal from '../components/Modal';
import { useUserRole } from '../context/UserRoleContext'; // Import the hook
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole(); // Get the isAdmin status
  
  // Initialize state with data from localStorage or defaults
  const [formData, setFormData] = useState(() => {
    // Get the stored values
    const storedName = localStorage.getItem('userName') || 'John Doe';
    const storedEmail = localStorage.getItem('userEmail') || 'johndoe@example.com';
    let storedPosition = localStorage.getItem('userPosition') || 'CEO';
    const storedPhone = localStorage.getItem('userPhone') || '';
    const storedAvatar = localStorage.getItem('userAvatar') || defaultLogo;
    
    // Update "client" position to "Invoicing Associate" if that's the current value
    // but only for non-admin users
    if (storedPosition && storedPosition.toLowerCase() === 'client' && !isAdmin) {
      storedPosition = 'Invoicing Associate';
      // Update it in localStorage right away
      localStorage.setItem('userPosition', storedPosition);
    }
    
    return {
      name: storedName,
      email: storedEmail,
      position: storedPosition,
      phone: storedPhone,
      avatar: storedAvatar
    };
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Initialize avatar from user object if available
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const currentUser = users.find(user => user.id === userId);
    
    if (currentUser && currentUser.avatar) {
      setFormData(prev => ({
        ...prev,
        avatar: currentUser.avatar
      }));
    }
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          avatar: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Save user data to localStorage
      localStorage.setItem('userName', formData.name);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userPosition', formData.position);
      localStorage.setItem('userPhone', formData.phone);
      localStorage.setItem('userAvatar', formData.avatar);
      
      // Update this user in the users array
      const userId = localStorage.getItem('userId');
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          avatar: formData.avatar,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Dispatch event to notify other components about the user update
      window.dispatchEvent(new CustomEvent('userUpdated'));
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 800);
  };
  
  const handleDeleteAccount = () => {
    setIsDeleting(true);
    
    // Simulate a bit of processing time
    setTimeout(() => {
      const userId = localStorage.getItem('userId');
      
      // 1. Unassign all invoices assigned to this user
      const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
      const updatedInvoices = savedInvoices.map(invoice => {
        if (invoice.assigneeId === userId) {
          return { ...invoice, assigneeId: '' }; // Unassign
        }
        return invoice;
      });
      localStorage.setItem('savedInvoices', JSON.stringify(updatedInvoices));
      
      // 2. Remove user from users array
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const filteredUsers = users.filter(user => user.id !== userId);
      localStorage.setItem('users', JSON.stringify(filteredUsers));
      
      // 3. Clear all user data from localStorage
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userPosition');
      localStorage.removeItem('userAvatar');
      localStorage.removeItem('lastLogin');
      localStorage.removeItem('lastActivity');
      localStorage.removeItem('selectedCompany');
      
      // 4. Dispatch event to notify other components
      window.dispatchEvent(new Event('invoicesUpdated'));
      
      // 5. Navigate to login page
      navigate('/login');
    }, 1000);
  };
  
  return (
    <div className="profile-container">
      <Link to="/dashboard" className="profile-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      <div className="profile-header">
        <div 
          className="profile-avatar-container"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <img src={formData.avatar} alt={formData.name} className="profile-avatar" />
          <label htmlFor="avatar-upload" className={`avatar-upload-overlay ${isHovering ? 'visible' : ''}`}>
            <FiCamera size={24} />
            <span>Change Photo</span>
          </label>
          <input 
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>
        <div>
          <h1 className="profile-name">{formData.name}</h1>
          <p className="profile-email">{formData.email}</p>
        </div>
      </div>
      
      <div className="profile-content">
        <form onSubmit={handleSubmit}>
          <div className="profile-section">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(123) 456-7890"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="position">Position/Title</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {saveSuccess && (
            <div className="success-message">
              Profile updated successfully!
            </div>
          )}
          
          <div className="profile-actions">
            <Link to="/dashboard" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
        
        {/* Danger Zone Section - Conditionally render based on isAdmin */}
        {!isAdmin && (
          <div className="profile-section danger-zone">
            <h3>Danger Zone</h3>
            <p>Delete your account permanently. This action cannot be undone.</p>
            <button 
              className="btn btn-danger" 
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
            >
              <FiTrash2 style={{ marginRight: '8px' }} /> 
              {isDeleting ? 'Deleting Account...' : 'Delete Account'}
            </button>
          </div>
        )}
      </div>
      
      {/* Delete Account Confirmation Modal - Conditionally render based on isAdmin */}
      {!isAdmin && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
          actions={
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </>
          }
        >
          <p>Are you sure you want to delete your account? This will:</p>
          <ul>
            <li>Remove all your account information</li>
            <li>Unassign any invoices assigned to you</li>
            <li>Log you out immediately</li>
          </ul>
          <p style={{ fontWeight: 'bold' }}>This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;