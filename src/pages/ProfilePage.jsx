import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiCamera, FiTrash2 } from 'react-icons/fi';
import { defaultLogo } from '../assets/logoData';
import Modal from '../components/Modal';
import { useUserRole } from '../context/UserRoleContext'; // Import the hook
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabaseClient';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  // Initialize state with async storage
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    phone: '',
    avatar: defaultLogo
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user data from storage on mount
  useEffect(() => {
    (async () => {
      const storedName = await storage.get('userName', 'John Doe');
      const storedEmail = await storage.get('userEmail', 'johndoe@example.com');
      let storedPosition = await storage.get('userPosition', 'CEO');
      const storedPhone = await storage.get('userPhone', '');
      const storedAvatar = await storage.get('userAvatar', defaultLogo);
      if (storedPosition && storedPosition.toLowerCase() === 'client' && !isAdmin) {
        storedPosition = 'Invoicing Associate';
        await storage.set('userPosition', storedPosition);
      }
      setFormData({
        name: storedName,
        email: storedEmail,
        position: storedPosition,
        phone: storedPhone,
        avatar: storedAvatar
      });
    })();
  }, [isAdmin]);

  // Initialize avatar from user object if available
  useEffect(() => {
    (async () => {
      const userId = await storage.get('userId');
      const users = (await storage.get('users', [])) || [];
      const currentUser = users.find(user => user.id === userId);
      if (currentUser && currentUser.avatar) {
        setFormData(prev => ({ ...prev, avatar: currentUser.avatar }));
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Upload to Supabase Storage
      const userId = await storage.get('userId');
      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${userId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) {
        alert('Failed to upload avatar.');
        return;
      }
      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      setFormData({ ...formData, avatar: publicUrl });
      // Optionally, update in storage immediately
      await storage.set('userAvatar', publicUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Save user data to storage
    await storage.set('userName', formData.name);
    await storage.set('userEmail', formData.email);
    await storage.set('userPosition', formData.position);
    await storage.set('userPhone', formData.phone);
    await storage.set('userAvatar', formData.avatar);
    // Update this user in the users array
    const userId = await storage.get('userId');
    const users = (await storage.get('users', [])) || [];
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
      await storage.set('users', users);
    }
    setIsSaving(false);
    setSaveSuccess(true);
    window.dispatchEvent(new CustomEvent('userUpdated'));
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setIsDeleting(true);
    setTimeout(async () => {
      const userId = await storage.get('userId');
      // 1. Unassign all invoices assigned to this user
      const savedInvoices = (await storage.get('savedInvoices', [])) || [];
      const updatedInvoices = savedInvoices.map(invoice => {
        if (invoice.assigneeId === userId) {
          return { ...invoice, assigneeId: '' };
        }
        return invoice;
      });
      await storage.set('savedInvoices', updatedInvoices);
      // 2. Remove user from users array
      const users = (await storage.get('users', [])) || [];
      const filteredUsers = users.filter(user => user.id !== userId);
      await storage.set('users', filteredUsers);
      // 3. Clear all user data from storage
      await storage.remove('isLoggedIn');
      await storage.remove('userEmail');
      await storage.remove('userId');
      await storage.remove('userName');
      await storage.remove('userPhone');
      await storage.remove('userPosition');
      await storage.remove('userAvatar');
      await storage.remove('lastLogin');
      await storage.remove('lastActivity');
      await storage.remove('selectedCompany');
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