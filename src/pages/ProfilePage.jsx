import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiUser } from 'react-icons/fi';
import { defaultLogo } from '../assets/logoData';
import './ProfilePage.css';

const ProfilePage = () => {
  // Initialize state with data from localStorage or defaults
  const [formData, setFormData] = useState({
    name: localStorage.getItem('userName') || 'John Doe',
    email: localStorage.getItem('userEmail') || 'johndoe@example.com',
    position: localStorage.getItem('userPosition') || 'CEO',
    phone: localStorage.getItem('userPhone') || '',
    avatar: defaultLogo // In a real app, this would be a user-uploaded image
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    }, 800);
  };
  
  return (
    <div className="profile-container">
      <Link to="/dashboard" className="profile-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      <div className="profile-header">
        <img src={formData.avatar} alt={formData.name} className="profile-avatar" />
        <div>
          <h1 className="profile-name">{formData.name}</h1>
          <p className="profile-email">{formData.email}</p>
        </div>
      </div>
      
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
    </div>
  );
};

export default ProfilePage;